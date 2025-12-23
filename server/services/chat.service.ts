// server/services/chat.service.ts

import type { IChatMessage, IChatMessageCreate, IChatMessageResponse } from "$interfaces/chatMessage.interface";
import type { ObjectIdLike, QueryPaginationOptions } from "$interfaces/common.interface";
import ChatMessage from "$models/chatMessage.model";
import { broadcastToOrder } from "$utils/wsContext";
import type { FilterQuery } from "mongoose";

export async function createChatMessage(data: IChatMessageCreate) {
    data.senderRole ||= "customer"; // 預設為 customer
    data.content = data.content.trim();

    const chatMessage = new ChatMessage(data);

    await chatMessage.save();

    const messageObj = chatMessage.toObject<IChatMessage>();

    // 廣播訊息給 WebSocket 客戶端，觸發前端通知
    broadcastToOrder(String(data.order), {
        type: "message",
        data: messageObj,
    });

    return messageObj;
}

export async function getChatMessagesByOrderId(
    orderId: ObjectIdLike,
    options: QueryPaginationOptions & {
        after?: Date;
        before?: Date;
    }
) {
    const limit = options.limit ?? 20;
    const skip = options.skip ?? 0;
    const after = options.after;
    const before = options.before;
    const filter: FilterQuery<IChatMessage> = { order: orderId };

    if (after || before) {
        filter.timestamp = {};

        if (after) {
            filter.timestamp.$gt = after;
        }

        if (before) {
            filter.timestamp.$lt = before;
        }
    }

    const chatMessages = await ChatMessage.find(filter)
        .sort({ timestamp: -1 }) // 排序：新到舊
        .skip(skip)
        .limit(limit)
        .populate("sender", "name img")
        .lean<IChatMessageResponse[]>();

    return chatMessages;
}
