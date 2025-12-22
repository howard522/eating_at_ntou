// server/interfaces/chatMessage.interface.ts

import type { ObjectIdLike, WithTimestamps } from "./common.interface";
import type { ActiveUserRole, IUserSummary } from "./user.interface";

export interface IChatMessage extends WithTimestamps {
    order: ObjectIdLike;
    sender: ObjectIdLike;
    senderRole: ActiveUserRole;
    content: string;
    timestamp: Date;
}

// --------------------
// ChatMessage DTO
// --------------------

export type IChatMessageResponse = Omit<IChatMessage, "sender"> & {
    sender: IUserSummary;
};

export type IChatMessageCreate = Pick<IChatMessage, "order" | "sender" | "senderRole" | "content">;
