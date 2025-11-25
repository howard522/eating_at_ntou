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

import { createError, defineEventHandler, getQuery, readBody } from "h3";
import ChatMessage from "@server/models/chatMessage.model";
import Order from "@server/models/order.model";
import connectDB from "@server/utils/db";
import { verifyJwtFromEvent } from "@server/utils/auth";

export default defineEventHandler(async (event) => {
    await connectDB();

    const payload = await verifyJwtFromEvent(event);
    const userId = payload.id;
    if (!event.context.params?.id) throw createError({ statusCode: 400, statusMessage: "Missing order id" });

    const orderId = event.context.params.id;
    console.log("orderId:", orderId);
    const order: any = await Order.findById(orderId)
        .populate("user", "name email")
        // 將外送員回傳必要欄位：name, img, phone
        .populate("deliveryPerson", "name img phone")
        // items.restaurant.phone 已存為 snapshot，無需額外 populate
        .lean();

    if (!order) throw createError({ statusCode: 404, statusMessage: "Order not found" });

    // 權限檢查：顧客、外送員（只能查自己的訂單）
    // 或 Admin 都可查
    const isOwner = String(order.user?._id || order.user) === userId;
    const isDelivery = String(order.deliveryPerson?._id || order.deliveryPerson) === userId;
    const isAdmin = payload.role === "admin" || payload.role === "multi";

    if (!isOwner && !isDelivery && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: "Not allowed to view this order" });
    }

    // 已完成訂單禁止發送訊息
    if (order.customerStatus === "completed" && order.deliveryStatus === "completed") {
        throw createError({ statusCode: 403, statusMessage: "Cannot send messages to completed orders" });
    }

    const { content, role } = await readBody(event);

    // 不能傳送空訊息
    if (!content || typeof content !== "string" || content.trim() === "") {
        throw createError({ statusCode: 400, statusMessage: "Message content is required" });
    }

    // role 必須是 customer 或 delivery（若有提供）
    if (role && role !== "customer" && role !== "delivery") {
        throw createError({ statusCode: 400, statusMessage: "Invalid role value" });
    }

    const chatMessage = new ChatMessage({
        order: orderId,
        sender: userId,
        senderRole: role || "customer",
        content: content.trim(),
    });

    await chatMessage.save();

    return { success: true, data: chatMessage };
});
