// server/api/orders/[id]/chats.get.ts

import { getChatMessages } from "@server/services/chat.service";
import { getOrderOwnership } from "@server/services/order.service";
import { getCurrentUser } from "@server/utils/getCurrentUser";

/**
 * @openapi
 * /api/orders/{id}/chats:
 *  get:
 *     summary: 取得聊天訊息
 *     description: 根據訂單 ID 取得聊天訊息。
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
 *       - name: limit
 *         in: query
 *         required: false
 *         description: 最大回傳筆數（預設 50，限制為 100）
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: skip
 *         in: query
 *         required: false
 *         description: 跳過筆數（用於分頁，預設 0）
 *         schema:
 *           type: integer
 *           default: 0
 *       - name: after
 *         in: query
 *         required: false
 *         description: 只回傳此時間戳之後的訊息（ISO 8601 格式）
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: before
 *         in: query
 *         required: false
 *         description: 只回傳此時間戳之前的訊息（ISO 8601 格式）
 *         schema:
 *           type: string
 *           format: date-time
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
    const userId = getCurrentUser(event).id;
    const orderId = getRouterParam(event, "id") as string;

    if (!orderId) {
        throw createError({ statusCode: 400, statusMessage: "Missing order id" });
    }

    const ownership = await getOrderOwnership(orderId, userId);

    // 權限檢查：顧客、外送員（只能查自己的訂單）
    if (!ownership.isOwner && !ownership.isDeliveryPerson) {
        throw createError({ statusCode: 403, statusMessage: "Not allowed to view this order" });
    }

    const query = getQuery(event);
    const DEFAULT_LIMIT = 50;
    const MIN_LIMIT = 1;
    const MAX_LIMIT = 100;
    const DEFAULT_SKIP = 0;
    const MIN_SKIP = 0;

    let limit = parseInt(query.limit as string) || DEFAULT_LIMIT;
    let skip = parseInt(query.skip as string) || DEFAULT_SKIP;
    let after = query.after ? new Date(query.after as string) : null;
    let before = query.before ? new Date(query.before as string) : null;

    const chatMessages = await getChatMessages(orderId, {
        limit: Math.min(Math.max(limit, MIN_LIMIT), MAX_LIMIT),
        skip: Math.max(skip, MIN_SKIP),
        after: after || undefined,
        before: before || undefined,
    });

    return {
        success: true,
        count: chatMessages.length,
        data: chatMessages,
    };
});
