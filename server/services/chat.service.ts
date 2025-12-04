// server/services/chat.service.ts

import type { IChatMessage } from "@server/interfaces/chatMessage.interface";
import type { ObjectIdLike } from "@server/interfaces/common.interface";
import ChatMessage from "@server/models/chatMessage.model";
import type { FilterQuery } from "mongoose";

export async function createChatMessage(
    orderId: ObjectIdLike,
    userId: ObjectIdLike,
    role: "customer" | "delivery",
    content: string
) {
    const chatMessage = new ChatMessage({
        order: orderId,
        sender: userId,
        senderRole: role || "customer",
        content: content.trim(),
    });

    await chatMessage.save();

    return chatMessage;
}

export async function getChatMessages(
    orderId: ObjectIdLike,
    options: {
        limit: number;
        skip: number;
        after?: Date;
        before?: Date;
    }
) {
    const { limit, skip, after, before } = options;
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
        .limit(limit)
        .skip(skip)
        .populate("sender", "name img");

    return chatMessages;
}
