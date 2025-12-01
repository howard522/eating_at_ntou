// server/api/orders/[id]/accept.patch.ts

import { updateOrderDeliveryPerson } from "@server/services/order.service";
import { getUserFromEvent } from "@server/utils/auth";

/**
 * 前端請注意：
 * api不會檢查使用者是否為外送員，請自行在前端確認使用者角色後再呼叫此API。
 */

/**
 * @openapi
 * /api/orders/{id}/accept:
 *   patch:
 *     summary: 外送員接單
 *     description: 外送員可接下尚未被接的訂單，並將外送狀態更新為 on_the_way。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     responses:
 *       200:
 *         description: 成功接單
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
 *                 deliveryPerson: "670a15fa5c3b5a001279cc33"
 *                 deliveryStatus: "on_the_way"
 */
export default defineEventHandler(async (event) => {
    // const payload = await verifyJwtFromEvent(event)
    // assertNotBanned(payload) // 確保使用者未被封鎖
    // const userId = payload.id

    const user = await getUserFromEvent(event); // 取得目前使用者，11/15更新後會檔掉被封鎖的使用者
    const userId = user._id;

    if (!userId) throw createError({ statusCode: 401, statusMessage: "Invalid token payload" });

    const orderId = getRouterParam(event, "id") as string;

    if (!orderId) throw createError({ statusCode: 400, statusMessage: "Missing order id" });

    const order = await updateOrderDeliveryPerson(orderId, userId);

    return { success: true, data: order };
});
