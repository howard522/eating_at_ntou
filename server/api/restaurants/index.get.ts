// server/api/restaurants/index.get.ts

import { searchRestaurants } from "@server/services/restaurants.service";
import { parseInteger } from "@server/utils/parseNumber";

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
    // 防止過長造成效能問題
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;

    const query = getQuery(event);
    const search = query.search?.toString() ?? "";

    // 分頁參數
    const limit = parseInteger(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const skip = parseInteger(query.skip, 0, 0);

    // 查詢餐廳
    const restaurants = await searchRestaurants(search, { limit, skip, activeOnly: true });

    return {
        success: true,
        count: restaurants.length,
        data: restaurants,
    };
});
