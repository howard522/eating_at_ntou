import Restaurant from '@server/models/restaurant.model'
import connectDB from "@server/utils/db";
import { getQuery } from 'h3'
import { geocodeAddress, sleep } from '@server/utils/nominatim';
import { createError } from 'h3'

/**
 * @openapi
 * /api/admin/restaurants:
 *   get:
 *     summary: 管理員 - 搜尋餐廳（包含上架與下架）
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       管理員用的餐廳搜尋，可搜尋 name / info / address / menu.name。與公開 API 類似，但會回傳包含已下架的餐廳。
 *       若查詢參數帶上 `geocode=true`，伺服器會嘗試呼叫 Nominatim 將缺少經緯度的餐廳地址轉換為座標，並把座標寫回資料庫（此為有副作用的測試功能）。
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
    const query = getQuery(event);
    const raw = (query.search as string) || '';

    const MAX_TERMS = 5;
    const MAX_TERM_LEN = 50;
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const terms = raw.split(/\s+/).map(t => t.trim()).filter(Boolean).slice(0, MAX_TERMS);

    let mongoQuery: any = {};
    if (terms.length > 0) {
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

    let limit = Number(query.limit) || DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT);
    const skip = Number(query.skip) || 0;

    // 此 admin endpoint 不過濾 isActive，會回傳上、下架資料
    const restaurants = await Restaurant.find(mongoQuery).skip(skip).limit(limit);

    if (query.geocode === 'true') {
        for (const r of restaurants) {
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
                    console.error(e);
                }
                await sleep(1100);
            }
        }
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
