// server/api/orders/[id]/index.get.ts

import { getOrderById, getOrderOwnership } from "@server/services/order.service";
import { getCurrentUser } from "@server/utils/getCurrentUser";

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: 查詢單筆訂單資訊
 *     description: 根據訂單 ID 取得詳細資料（含餐點快照、外送與顧客資訊）。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     responses:
 *       200:
 *         description: 成功取得訂單資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               data:
 *                 _id: "671c0c2f5c3b5a001276a7ff"
 *                 user:
 *                   id: "670a15fa5c3b5a001279cc22"
 *                   name: "宋辰星"
 *                 deliveryPerson:
 *                   _id: "670a15fa5c3b5a001279cc33"
 *                   name: "小明"
 *                   img: "https://example.com/avatar/min.png"
 *                   phone: "0912-111-222"
 *                 total: 450
 *                 deliveryFee: 30
 *                 arriveTime: "2024-08-01T12:30:00.000Z"
 *                 currency: "TWD"
 *                 customerStatus: "completed"
 *                 deliveryStatus: "completed"
 *                 items:
 *                   - name: "三杯雞"
 *                     price: 220
 *                     quantity: 1
 *                     restaurant:
 *                       name: "傑哥加長加長菜"
 *                       phone: "02-1234-5678"
 *                       location:
 *                         lat: 25.1508
 *                         lng: 121.7730
 *                 deliveryInfo:
 *                   address: "基隆市中正區OO路123號"
 *                   contactName: "宋辰星"
 *                   contactPhone: "0912-345-678"
 *                   note: "請放門口"
 */
export default defineEventHandler(async (event) => {
    const user = getCurrentUser(event);
    const userId = user.id;

    const orderId = getRouterParam(event, "id");

    if (!orderId) throw createError({ statusCode: 400, message: "Missing order id" });

    // 權限檢查：顧客、外送員（只能查自己的訂單）
    // 或 Admin 都可查詢
    const ownership = await getOrderOwnership(orderId, user.id);
    const isAdmin = user.role === "admin" || user.role === "multi"; // QUESTION: multi 角色是否有此權限？

    if (!ownership.isOwner && !ownership.isDeliveryPerson && !isAdmin) {
        throw createError({ statusCode: 403, message: "Not allowed to view this order" });
    }

    const order = await getOrderById(orderId);

    return { success: true, data: order };
});
