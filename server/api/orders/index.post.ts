import type { OrderInfo } from "@server/interfaces/order.interface";
import { createOrder } from "@server/services/order.service";
import { getCurrentUser } from "@server/utils/getCurrentUser";

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: 建立新訂單
 *     description: 根據購物車內容建立訂單，會自動補全菜單快照並計算外送費。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryInfo:
 *                 type: object
 *                 properties:
 *                   address: { type: string, example: "基隆市中正區OO路123號" }
 *                   contactName: { type: string, example: "宋辰星" }
 *                   contactPhone: { type: string, example: "0912-345-678" }
 *                   note: { type: string, example: "麻煩幫我放門口～" }
 *               deliveryFee:
 *                 type: number
 *                 example: 30
 *                 description: 外送費（預設 0）
 *               arriveTime:
 *                 type: string
 *                 format: date-time
 *           example:
 *             deliveryInfo:
 *               address: "基隆市中正區OO路123號"
 *               contactName: "宋辰星"
 *               contactPhone: "0912-345-678"
 *               note: "麻煩幫我放門口～"
 *             deliveryFee: 30
 *             arriveTime: "2024-08-01T12:30:00.000Z"
 *     responses:
 *       200:
 *         description: 成功建立訂單
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Order' }
 *             example:
 *               success: true
 *               data:
 *                 _id: "671c0c2f5c3b5a001276a7ff"
 *                 total: 450
 *                 deliveryFee: 30
 *                 currency: "TWD"
 *                 arriveTime: "2024-08-01T12:30:00.000Z"
 *                 items:
 *                   - name: "三杯雞"
 *                     price: 220
 *                     quantity: 1
 *                     image: "https://example.com/meal.jpg"
 *                     restaurant:
 *                       id: "66f2426335e9054c99b316a0"
 *                       name: "傑哥加長加長菜"
 *                 deliveryInfo:
 *                   address: "基隆市中正區OO路123號"
 *                   contactName: "宋辰星"
 *                   contactPhone: "0912-345-678"
 *                   note: "麻煩幫我放門口～"
 */
export default defineEventHandler(async (event) => {
    const userId = getCurrentUser(event).id;

    if (!userId) throw createError({ statusCode: 401, statusMessage: "Invalid token payload" });

    const body = await readBody<OrderInfo>(event);

    const order = await createOrder(userId, body);

    return { success: true, data: order };
});
