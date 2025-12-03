// server/api/orders/[id]/status.patch.ts

import type { OrderStatusUpdate } from "@server/interfaces/order.interface";
import { getOrderOwnership, updateOrderStatusById } from "@server/services/order.service";
import { getCurrentUser } from "@server/utils/getCurrentUser";

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     summary: 更新訂單狀態
 *     description: 顧客或外送員可更新訂單進度（customerStatus 或 deliveryStatus）。
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerStatus:
 *                 type: string
 *                 enum: [preparing, on_the_way, received, completed]
 *               deliveryStatus:
 *                 type: string
 *                 enum: [preparing, on_the_way, delivered, completed]
 *           example:
 *             customerStatus: "received"
 *             deliveryStatus: "delivered"
 *     responses:
 *       200:
 *         description: 成功更新狀態
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 */
export default defineEventHandler(async (event) => {
    const userId = getCurrentUser(event).id;

    const orderId = getRouterParam(event, "id") as string;

    if (!orderId) throw createError({ statusCode: 400, message: "Missing order id" });

    const ownership = await getOrderOwnership(orderId, userId);

    const body = await readBody<OrderStatusUpdate>(event);

    // 權限判斷：必須是訂單擁有者或外送員才能更新狀態
    // QUESTION: 顧客可以更新 deliveryStatus 嗎？目前允許但實際上應該不會這樣做
    if (payload.role !== "admin" && !ownership.isOwner && !ownership.isDeliveryPerson) {
        throw createError({ statusCode: 403, message: "Not allowed to update this status" });
    }

    const updatedOrder = await updateOrderStatusById(orderId, body);

    return { success: true, data: updatedOrder };
});
