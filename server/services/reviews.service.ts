// server/services/reviews.service.ts

import type { ObjectIdLike, QueryPaginationOptions } from "@server/interfaces/common.interface";
import type { IReviewCreate, IReviewResponse } from "@server/interfaces/review.interface";
import Review from "@server/models/review.model";

/**
 * 取得特定餐廳的評論列表
 * 包含使用者資訊，並支援排序與分頁
 *
 * @param restaurantId 餐廳 ID
 * @param sort 排序方式 (newest: 最新, highest: 最高分, lowest: 最低分)
 * @param options.limit 每頁筆數
 * @param options.skip 跳過筆數
 * @returns 評論列表及分頁資訊
 */
export async function getReviewsByRestaurantId(
    restaurantId: ObjectIdLike,
    sort: "newest" | "highest" | "lowest" = "newest",
    options: QueryPaginationOptions
) {
    const SORT_OPTIONS: { [key: string]: Record<string, 1 | -1> } = {
        newest: { createdAt: -1 },
        highest: { rating: -1, createdAt: -1 }, // 同分時以最新的在前
        lowest: { rating: 1, createdAt: -1 }, // 同分時以最新的在前
    } as const;

    const skip = options.skip || 0;
    const limit = options.limit || 10;

    const query = { restaurant: restaurantId };

    // 同時取得總數與評論列表
    const [total, reviews] = await Promise.all([
        await Review.countDocuments(query),
        await Review.find(query)
            .populate("user", "id name img")
            .sort(SORT_OPTIONS[sort] || { createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean<IReviewResponse[]>(),
    ]);

    // 有可能需要轉換 review.restaurant -> restaurantId ?

    return { total, reviews };
}

/**
 * 建立新的評論
 *
 * @param restaurantId 餐廳 ID
 * @param userId 使用者 ID
 * @param rating 評分
 * @param content 評論內容
 * @returns 新建立的評論
 */
export async function createReview(data: IReviewCreate) {
    const reviewDoc = await Review.create(data);

    const review = await reviewDoc.populate("user", "id name img");

    return review.toObject<IReviewResponse>();
}
