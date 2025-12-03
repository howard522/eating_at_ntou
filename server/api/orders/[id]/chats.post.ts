// server/api/orders/[id]/chats.post.ts

import { createChatMessage } from "@server/services/chat.service";
import { getOrderOwnership, getOrderStatus } from "@server/services/order.service";
import { getUser } from "@server/utils/getUser";

/**
 * @openapi
 * /api/orders/{id}/chats:
 *  post:
 *     summary: 發送聊天訊息
 *     description: 根據訂單 ID 發送聊天訊息。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 訂單 ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 description: 發送者角色類型（不指定則預設為 customer）
 *                 enum: ["customer", "delivery"]
 *                 example: "customer"
 *               content:
 *                 type: string
 *                 description: 聊天訊息內容
 *                 example: "Hello!!"
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: 成功發送聊天訊息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: 無效的請求參數
 *       401:
 *         description: 未授權
 *       403:
 *         description: 禁止訪問該訂單的聊天記錄
 *       404:
 *         description: 訂單不存在
 */
export default defineEventHandler(async (event) => {
    const userId = getUser(event).id;
    const orderId = getRouterParam(event, "id") as string;

    if (!orderId) {
        throw createError({ statusCode: 400, statusMessage: "Missing order id" });
    }

    const ownership = await getOrderOwnership(orderId, userId);
    const status = await getOrderStatus(orderId);

    // 權限檢查：顧客、外送員（只能查自己的訂單）
    if (!ownership.isOwner && !ownership.isDeliveryPerson) {
        throw createError({ statusCode: 403, statusMessage: "Not allowed to view this order" });
    }

    // 已完成訂單禁止發送訊息
    if (status.customerStatus === "completed" && status.deliveryStatus === "completed") {
        throw createError({ statusCode: 403, statusMessage: "Cannot send messages to completed orders" });
    }

    const body = await readBody(event);
    const content = body.content as string;
    const role = body.role as "customer" | "delivery" | undefined;

    // 不能傳送空訊息
    if (!content || typeof content !== "string" || content.trim() === "") {
        throw createError({ statusCode: 400, statusMessage: "Message content is required" });
    }

    // role 必須是 customer 或 delivery（若有提供）
    if (role && role !== "customer" && role !== "delivery") {
        throw createError({ statusCode: 400, statusMessage: "Invalid role value" });
    }

    const chatMessage = await createChatMessage(
        orderId,
        userId,
        role || (ownership.isOwner ? "customer" : "delivery"),
        content.trim()
    );

    return { success: true, data: chatMessage };
});
