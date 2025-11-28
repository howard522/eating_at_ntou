// server/api/restaurants/near.get.ts

import { searchRestaurantsNearByAddress } from "@server/services/restaurants.service";
import { parseInteger } from "@server/utils/parseNumber";

/**
 * @openapi
 * /api/restaurants/near:
 *   get:
 *     summary: 依距離搜尋附近餐廳（geoNear）
 *     description: |
 *       以給定的座標為中心，回傳依距離排序的餐廳清單。若資料中某些餐廳缺少地理座標，
 *       此 endpoint 會對最多 20 筆缺少座標的餐廳嘗試一次 Nominatim geocode（best-effort），並將結果寫回 DB。
 *       注意：此寫回為有副作用的操作，請在測試時小心使用。
 *     tags:
 *       - Restaurants
 *     parameters:
 *       - name: address
 *         in: query
 *         required: true
 *         description: 地址字串（前端僅需傳 address），伺服器會使用 Nominatim geocode 取得中心座標並以該座標搜尋附近餐廳。
 *         schema:
 *           type: string
 *           example: "基隆市中正區北寧路2號"
 *       - name: search
 *         in: query
 *         description: 搜尋關鍵字（支援用雙引號包住的精準片語，例如 "炸雞 便當"；未包引號會以空白拆詞），會比對 name/info/address/menu.name/tags/phone
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 最大回傳筆數（預設 20）
 *         schema:
 *           type: integer
 *       - name: skip
 *         in: query
 *         description: 跳過筆數（分頁用）
 *         schema:
 *           type: integer
 *       - name: maxDistance
 *         in: query
 *         description: 最大搜尋距離（公尺），選填
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: 成功回傳附近餐廳清單，包含 distance 欄位（單位：公尺）
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Restaurant'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             description: 距離（公尺）
 */
export default defineEventHandler(async (event) => {
    // 防止過長造成效能問題
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;

    const query = getQuery(event);
    const address = query.address?.toString() ?? "";
    const search = query.search?.toString() ?? "";

    // 分頁參數
    const limit = parseInteger(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const skip = parseInteger(query.skip, 0, 0);
    const maxDistance = query.maxDistance ? Number(query.maxDistance) : undefined; // meters

    const results = await searchRestaurantsNearByAddress(address, search, true, { limit, skip, maxDistance });

    return {
        success: true,
        count: results.length,
        data: results,
    };
});
