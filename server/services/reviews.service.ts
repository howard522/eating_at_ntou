import type { ObjectIdLike } from "@server/interfaces/common.interface";
import Review from "@server/models/review.model";

/**
 * 取得特定餐廳的評論列表，包含使用者資訊（暱稱、頭像），支援排序與分頁
 *
 * @param restaurantId 餐廳 ID
 * @param sort 排序方式 (newest: 最新, highest: 最高分, lowest: 最低分)
 * @param skip 跳過筆數
 * @param limit 每頁筆數
 * @returns 評論列表及分頁資訊
 */
export async function getReviewsByRestaurantId(
    restaurantId: ObjectIdLike,
    sort: "newest" | "highest" | "lowest" = "newest",
    skip = 0,
    limit = 10
) {
    {
        const sortOptions: { [key: string]: Record<string, 1 | -1> } = {
            newest: { createdAt: -1 },
            highest: { rating: -1 },
            lowest: { rating: 1 },
        };

        const total = await Review.countDocuments({ restaurant: restaurantId });
        const reviews = await Review.find({ restaurant: restaurantId })
            .populate("user", "name img")
            .sort(sortOptions[sort])
            .skip(skip)
            .limit(limit);

        const data = reviews.map((review) => ({
            _id: review._id,
            restaurantId: review.restaurant,
            user: {
                _id: review.user?._id,
                name: review.user?.name,
                img: review.user?.img,
            },
            rating: review.rating,
            content: review.content,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
        }));

        return {
            total,
            reviews: data,
        };
    }
}

export async function createReview(restaurantId: ObjectIdLike, userId: ObjectIdLike, rating: number, content: string) {
    const review = await Review.create({
        restaurant: restaurantId,
        user: userId,
        rating,
        content,
    });

    return review;
}
