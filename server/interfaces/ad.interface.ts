// server/interfaces/ad.interface.ts

import type { Document } from "mongoose";

// 廣告介面
export interface IAd extends Document {
    title: string;
    imageUrl?: string;
    linkUrl?: string;
    text?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
