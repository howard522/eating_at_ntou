// server/models/chatMessage.model.ts

import type { IChatMessage } from "@server/interfaces/chatMessage.interface";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// 文件類型定義
type ChatMessageDocument = HydratedDocument<IChatMessage>;

// --------------------
// 聊天訊息
// --------------------

const chatMessageSchema = new Schema<ChatMessageDocument>(
    {
        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderRole: {
            type: String,
            enum: ["customer", "delivery"],
            required: true,
        },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// --------------------
// Model export
// --------------------

export const ChatMessage =
    (mongoose.models.ChatMessage as Model<ChatMessageDocument>) ||
    model<ChatMessageDocument>("ChatMessage", chatMessageSchema);

export default ChatMessage;
