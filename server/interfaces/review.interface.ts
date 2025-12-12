// server/interfaces/review.interface.ts

import type { CreateBody, ObjectIdLike, WithTimestamps } from "./common.interface";
import type { IUserSummary } from "./user.interface";

// --------------------
// 評論介面
// --------------------

export interface IReview extends WithTimestamps {
    _id: ObjectIdLike;
    user: ObjectIdLike;
    restaurant: ObjectIdLike;
    rating: number; // 評分，通常是 1 到 5 之間的數字
    content: string; // 評論內容
}

// --------------------
// 評論相關 DTO
// --------------------

export type IReviewResponse = Omit<IReview, "user"> & {
    user: IUserSummary;
};

export type IReviewCreate = CreateBody<IReview, "user" | "restaurant" | "rating" | "content">;
