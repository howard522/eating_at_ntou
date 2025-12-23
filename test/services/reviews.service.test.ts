// test/services/reviews.service.test.ts

import { createDocumentMock } from "@mocks/document.mock";
import { reviewMocks as mocks } from "@mocks/models/review.model.mock";
import { restaurantMocks } from "@test/__mocks__/models/restaurant.model.mock";
import { createChainedQueryMock } from "@mocks/query.mock";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------
// Import 要測試的功能
// ---------------------------------------------------------------------

import { createReview, getReviewsByRestaurantId } from "$services/reviews.service";

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("reviews.service", () => {
    it("getReviewsByRestaurantId - 應回傳正確的分頁評論資料，並按評分與時間排序", async () => {
        const reviewsDocs = [
            {
                _id: "rev1",
                restaurant: "rest1",
                user: { _id: "u1", name: "A", img: "img" },
                rating: 5,
                content: "Great",
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-02"),
            },
        ];
        mocks.find.mockReturnValue(createChainedQueryMock(reviewsDocs));
        mocks.countDocuments.mockResolvedValue(1);

        const result = await getReviewsByRestaurantId("rest1", "highest", { skip: 5, limit: 10 });

        expect(mocks.countDocuments).toHaveBeenCalledWith({ restaurant: "rest1" });
        expect(mocks.find().populate).toHaveBeenCalledWith("user", "id name img");
        expect(mocks.find().sort).toHaveBeenCalledWith({ rating: -1, createdAt: -1 });
        expect(mocks.find().skip).toHaveBeenCalledWith(5);
        expect(mocks.find().limit).toHaveBeenCalledWith(10);
        expect(result.total).toBe(1);
        expect(result.reviews[0]).toMatchObject({
            _id: "rev1",
            restaurant: "rest1",
            user: { _id: "u1", name: "A", img: "img" },
            rating: 5,
            content: "Great",
        });
    });

    it("createReview - 應將資料轉發至 model.create 並回傳創建的評論", async () => {
        // 建立完整 document mock
        const reviewDoc = {
            _id: "rev2",
            restaurant: "507f1f77bcf86cd799439011",
            user: { _id: "u1", name: "A", img: "img" },
            rating: 4,
            content: "Nice",
        };
        mocks.create.mockReturnValue(createDocumentMock(reviewDoc));
        mocks.aggregate.mockReturnValueOnce([{ _id: "507f1f77bcf86cd799439011", averageRating: 4 }]);
        restaurantMocks.findByIdAndUpdate.mockResolvedValue(null);

        const result = await createReview({ restaurant: "507f1f77bcf86cd799439011", user: "u1", rating: 4, content: "Nice" });

        expect(mocks.create).toHaveBeenCalledWith({ restaurant: "507f1f77bcf86cd799439011", user: "u1", rating: 4, content: "Nice" });
        expect(result).toStrictEqual(reviewDoc);
    });
});
