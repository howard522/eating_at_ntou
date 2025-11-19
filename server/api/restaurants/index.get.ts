// server/api/restaurants/index.get.ts

import { getRestaurantsByQuery, updateRestaurantById } from "@server/services/restaurants.service";
import { getGeocodeFromAddress, sleep, validateGeocode } from "@server/utils/nominatim";
import { buildRestaurantSearchQuery } from "@server/utils/mongoQuery";

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     summary: 搜尋餐廳
 *     description: |
 *       根據關鍵字（name / info / address / menu.name）進行不區分大小寫的搜尋。
 *       多個關鍵字可用空白分隔；若未提供則回傳符合分頁條件的全部餐廳。
 *
 *       若查詢參數帶上 `geocode=true`，伺服器會嘗試呼叫 Nominatim 將缺少經緯度的餐廳地址轉換為座標，並把座標寫回資料庫（此為有副作用的測試功能）。
 *       注意：Nominatim 使用條款要求每秒請求數量不得超過限制，本 API 在批次更新時會進行節流。
 *     tags:
 *       - Restaurants
 *     parameters:
 *       - name: search
 *         in: query
 *         description: 搜尋關鍵字（可多個，以空白分隔；無則回傳所有餐廳）
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 最大回傳筆數（預設 50，限制為 100）
 *         schema:
 *           type: integer
 *       - name: skip
 *         in: query
 *         description: 跳過筆數（用於分頁）
 *         schema:
 *           type: integer
 *       - name: geocode
 *         in: query
 *         description: |
 *           若為 true，將對回傳結果中沒有座標的餐廳呼叫 Nominatim 取得經緯度，並把結果寫回 DB（測試用途）。
 *           請務必提供可辨識的 User-Agent（email 或 domain），並注意速率限制（範例實作每次等待 1.1 秒）。
 *         schema:
 *           type: boolean
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
    // 防止過長或過多關鍵字造成效能問題
    const MAX_TERMS = 5;
    const MAX_TERM_LEN = 50;
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;

    const query = getQuery(event);
    const raw_search = query.search?.toString() ?? "";

    // MongoDB 查詢物件
    const mongoQuery = buildRestaurantSearchQuery(raw_search, { maxTerms: MAX_TERMS, maxTermLength: MAX_TERM_LEN });
    mongoQuery.isActive = true; // 只搜尋上架的餐廳

    // 分頁參數
    const limit = Math.min(Number(query.limit) ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = Number(query.skip) ?? 0;

    // 查詢餐廳
    let restaurants = await getRestaurantsByQuery(mongoQuery, { limit, skip });

    // 若帶 ?geocode=true，嘗試把沒有座標的餐廳更新到 DB（測試用）
    if (query.geocode === "true") {
        for (const r of restaurants) {
            // 檢查 locationGeo 是否存在或含 coordinates
            if (r.address && !validateGeocode(r.locationGeo)) {
                try {
                    const geocode = await getGeocodeFromAddress(r.address);
                    if (geocode) {
                        await updateRestaurantById(r._id.toString(), { locationGeo: geocode });
                    }
                } catch (e) {
                    // ignore individual errors, 繼續下個
                    console.error(e);
                }
                // 節流：Nominatim 建議每秒不要超過 1 次，這裡設 1.1 秒
                await sleep(1100);
            }
        }

        // 重新抓一次包含更新後的資料（只取上架餐廳）
        restaurants = await getRestaurantsByQuery(mongoQuery, { limit, skip });
    }

    return {
        success: true,
        count: restaurants.length,
        data: restaurants,
    };
});
