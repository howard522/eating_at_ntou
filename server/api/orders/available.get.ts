// server/api/orders/available.get.ts

import { getAvailableOrdersForDeliveryPerson } from "@server/services/order.service";

/**
 * @openapi
 * /api/orders/available:
 *   get:
 *     summary: 查詢可接單列表
 *     description: |
 *       取得所有尚未被外送員接單、狀態為「準備中」的訂單清單。
 *       支援依餐廳名稱搜尋、排序（建立時間、外送費、預估送達時間、距離）與地理距離篩選。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: keyword
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: 餐廳名稱關鍵字（模糊搜尋）
 *         example: "港邊"
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [createdAt, deliveryFee, arriveTime, distance]
 *         description: 排序依據（預設為 createdAt）
 *         example: "distance"
 *       - name: order
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向（asc=由小到大，desc=由大到小，預設 desc）
 *         example: "asc"
 *       - name: lat
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *         description: 外送員當前位置緯度（若指定則回傳結果會附加距離）
 *         example: 25.1327
 *       - name: lon
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *         description: 外送員當前位置經度（若指定則支援依距離排序）
 *         example: 121.7401
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: 每頁最大回傳筆數
 *         example: 20
 *       - name: skip
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 要跳過的筆數（用於分頁）
 *         example: 0
 *     responses:
 *       200:
 *         description: 成功取得可接單列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: 回傳的訂單筆數（受 limit/skip 影響）
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "671c0c2f5c3b5a001276a7ff"
 *                       total:
 *                         type: number
 *                         example: 450
 *                       deliveryFee:
 *                         type: number
 *                         example: 30
 *                       arriveTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-08-01T12:30:00.000Z"
 *                       currency:
 *                         type: string
 *                         example: "TWD"
 *                       _distance:
 *                         type: number
 *                         description: 若提供經緯度則回傳距離（單位：公尺）
 *                         example: 215.3
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "三杯雞"
 *                             price:
 *                               type: number
 *                               example: 220
 *                             quantity:
 *                               type: number
 *                               example: 1
 *                             restaurant:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "海大港邊食堂"
 *                                 phone:
 *                                   type: string
 *                                   example: "02-2462-2192"
 *                       deliveryInfo:
 *                         type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                             example: "基隆市中正區北寧路2號"
 *                           contactName:
 *                             type: string
 *                             example: "宋辰星"
 *                           contactPhone:
 *                             type: string
 *                             example: "0912345678"
 *                           note:
 *                             type: string
 *                             example: "放在門口即可"
 *                       customerStatus:
 *                         type: string
 *                         example: "preparing"
 *                       deliveryStatus:
 *                         type: string
 *                         example: "preparing"
 *       401:
 *         description: 驗證失敗或未登入
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 statusMessage:
 *                   type: string
 *                   example: "未登入或 Token 錯誤"
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const { keyword = "", sortBy = "createdAt", order = "desc", lat, lon } = query;
    // 分頁參數
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;
    let limit = Number(query.limit) || DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT);
    const skip = Number(query.skip) || 0;

    if (!["createdAt", "deliveryFee", "arriveTime", "distance"].includes(sortBy as string)) {
        throw createError({ statusCode: 422, statusMessage: "Unprocessable Entity", message: "Invalid sortBy value" });
    }

    // 查詢訂單
    let orders = await getAvailableOrdersForDeliveryPerson(
        lat ? Number(lat) : undefined,
        lon ? Number(lon) : undefined,
        keyword ? String(keyword) : undefined,
        {
            limit,
            skip,
            sortBy: sortBy as "createdAt" | "deliveryFee" | "arriveTime" | "distance",
            order: order === "asc" ? "asc" : "desc",
        }
    );

    return {
        success: true,
        count: orders.length,
        data: orders,
    };
});
