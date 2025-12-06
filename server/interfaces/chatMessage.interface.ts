// server/interfaces/chatMessage.interface.ts

import type { ObjectId } from "mongoose";

export interface IChatMessage {
    order: ObjectId;
    sender: ObjectId;
    senderRole: "customer" | "delivery";
    content: string;
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
