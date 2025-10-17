import Restaurant from '../../models/restaurant.model'
import connectDB from "../../utils/db";
import { getQuery } from 'h3'
import { geocodeAddress, sleep } from '../../utils/nominatim';

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     summary: 搜尋餐廳
 *     tags:
 *       - Restaurants
 *     description: |
 *       根據關鍵字（name / info / address / menu.name）進行不區分大小寫的搜尋。
 *       多個關鍵字可用空白分隔；若未提供則回傳符合分頁條件的全部餐廳。
 *
 *       若查詢參數帶上 `geocode=true`，伺服器會嘗試呼叫 Nominatim 將缺少經緯度的餐廳地址轉換為座標，並把座標寫回資料庫（此為有副作用的測試功能）。
 *       注意：Nominatim 使用條款要求每秒請求數量不得超過限制，本 API 在批次更新時會進行節流。
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字（可多個，以空白分隔；無則回傳所有餐廳）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 最大回傳筆數（預設 50，限制為 100）
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: 跳過筆數（用於分頁）
 *       - in: query
 *         name: geocode
 *         schema:
 *           type: boolean
 *         description: |
 *           若為 true，將對回傳結果中沒有座標的餐廳呼叫 Nominatim 取得經緯度，並把結果寫回 DB（測試用途）。
 *           請務必提供可辨識的 User-Agent（email 或 domain），並注意速率限制（範例實作每次等待 1.1 秒）。
 *     responses:
 *       200:
 *         description: 成功回傳餐廳清單
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 */
export default defineEventHandler(async (event) => {
    await connectDB();
    // Search for restaurants in the database
    const query = getQuery(event);
    const raw = (query.search as string) || '';
    // 防止過長或過多關鍵字造成效能問題
    const MAX_TERMS = 5;
    const MAX_TERM_LEN = 50;
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 以空白拆詞（支援多個關鍵字），並限制數量與長度
    const terms = raw.split(/\s+/).map(t => t.trim()).filter(Boolean).slice(0, MAX_TERMS);
    console.log('Searching for restaurants with terms:', terms);

    // 建立 mongo query：若沒有關鍵字則使用空查詢（回傳全部）
    let mongoQuery: any = {};
    if (terms.length > 0) {
        // 若任一關鍵字符合即可：把每個欄位的 match 都放入同一個 $or，
        // 使用者輸入多個關鍵字時，任何一個詞匹配就會被回傳。
        const orClauses: any[] = [];
        for (const t of terms) {
            const term = t.substring(0, MAX_TERM_LEN);
            const re = new RegExp(escapeRegex(term), 'i');
            orClauses.push({ name: { $regex: re } });
            orClauses.push({ info: { $regex: re } });
            orClauses.push({ address: { $regex: re } });
            orClauses.push({ 'menu.name': { $regex: re } });
        }
        mongoQuery = { $or: orClauses };
    }

    // 分頁參數
    let limit = Number(query.limit) || DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT);
    const skip = Number(query.skip) || 0;

    const restaurants = await Restaurant.find(mongoQuery).skip(skip).limit(limit);
    // 若帶 ?geocode=true，嘗試把沒有座標的餐廳更新到 DB（測試用）
    if (query.geocode === 'true') {
        for (const r of restaurants) {
            // 檢查 locationGeo 是否存在或含 coordinates
            const hasGeo = r.locationGeo && Array.isArray(r.locationGeo.coordinates) && r.locationGeo.coordinates.length === 2;
            if (r.address && !hasGeo) {
                try {
                    const coords = await geocodeAddress(r.address);
                    if (coords) {
                        const lon = coords.lon;
                        const lat = coords.lat;
                        await Restaurant.findByIdAndUpdate(r._id, { $set: { locationGeo: { type: 'Point', coordinates: [lon, lat] } } });
                    }
                } catch (e) {
                    // ignore individual errors,繼續下個
                    console.error(e);
                }
                // 節流：Nominatim 建議每秒不要超過 1 次，這裡設 1.1 秒
                await sleep(1100);
            }
        }
        // 重新抓一次包含更新後的資料
        const updated = await Restaurant.find(mongoQuery).skip(skip).limit(limit);
        return {
            success: true,
            count: updated.length,
            data: updated
        }
    }

    return {
        success: true,
        count: restaurants.length,
        data: restaurants
    }
});
