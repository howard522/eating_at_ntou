// server/interfaces/chatMessage.interface.ts

import type { ObjectIdLike, WithTimestamps } from "./common.interface";
import type { ActiveUserRole } from "./user.interface";

export interface IChatMessage extends WithTimestamps {
    order: ObjectIdLike;
    sender: ObjectIdLike;
    senderRole: ActiveUserRole;
    content: string;
    timestamp: Date;
}
