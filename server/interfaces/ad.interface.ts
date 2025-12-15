// server/interfaces/ad.interface.ts

import type { CreateBody, ObjectIdLike, UpdateBody, WithTimestamps } from "./common.interface";

// 廣告介面
export interface IAd extends WithTimestamps {
    _id: ObjectIdLike;
    title: string;
    imageUrl?: string;
    linkUrl?: string;
    text?: string;
    isActive: boolean;
}

// --------------------
// 廣告相關 DTO
// --------------------

// 廣告回應介面
export type IAdResponse = IAd;

// 廣告建立介面
export type IAdCreate = CreateBody<IAd, "title">;

// 廣告更新介面
export type IAdUpdate = UpdateBody<IAd>;