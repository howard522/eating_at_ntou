// server/api/admin/restaurants/index.get.ts

import { getRestaurantsByQuery, updateRestaurantById } from "@server/services/restaurants.service";
import { getGeocodeFromAddress, sleep, validateGeocode } from "@server/utils/nominatim";
import { buildRestaurantSearchQuery } from "@server/utils/mongoQuery";

/**
 * @openapi
 * /api/admin/restaurants:
 *   get:
 *     summary: 管理員 - 搜尋餐廳（包含上架與下架）
 *     description: |
 *       管理員用的餐廳搜尋，可搜尋 name / info / address / menu.name。與公開 API 類似，但會回傳包含已下架的餐廳。
 *
 *       若查詢參數帶上 `geocode=true`，伺服器會嘗試呼叫 Nominatim 將缺少經緯度的餐廳地址轉換為座標，並把座標寫回資料庫（此為有副作用的測試功能）。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
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

    // 分頁參數
    const limit = Math.min(Number(query.limit) ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = Number(query.skip) ?? 0;

    // 此 admin endpoint 不過濾 isActive，會回傳上、下架資料
    let restaurants = await getRestaurantsByQuery(mongoQuery, { limit, skip });

    if (query.geocode === "true") {
        for (const r of restaurants) {
            if (r.address && !validateGeocode(r.locationGeo)) {
                try {
                    const geocode = await getGeocodeFromAddress(r.address);
                    if (geocode) {
                        await updateRestaurantById(r._id.toString(), { locationGeo: geocode });
                    }
                } catch (e) {
                    console.error(e);
                }
                await sleep(1100);
            }
        }

        restaurants = await getRestaurantsByQuery(mongoQuery, { limit, skip });
    }

    return {
        success: true,
        count: restaurants.length,
        data: restaurants,
    };
});
