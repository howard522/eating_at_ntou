// server/services/chat.service.ts

import type { IChatMessage, IChatMessageCreate, IChatMessageResponse } from "@server/interfaces/chatMessage.interface";
import type { ObjectIdLike, QueryPaginationOptions } from "@server/interfaces/common.interface";
import ChatMessage from "@server/models/chatMessage.model";
import type { FilterQuery } from "mongoose";

export async function createChatMessage(data: IChatMessageCreate) {
    const chatMessage = new ChatMessage(data);

    await chatMessage.save();

    return chatMessage.toObject<IChatMessage>();
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
