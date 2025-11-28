// server/models/chatMessage.model.ts

import mongoose from "mongoose";
import type { Model } from "mongoose";
import type { IChatMessage } from "../interfaces/chatMessage.interface";

const { Schema, model } = mongoose;

const chatMessageSchema = new Schema<IChatMessage>(
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

export default (mongoose.models.ChatMessage as Model<IChatMessage>) ||
    model<IChatMessage>("ChatMessage", chatMessageSchema);
