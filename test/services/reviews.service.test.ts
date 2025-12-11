import { beforeEach, describe, expect, it, vi } from "vitest";
import { createReview, getReviewsByRestaurantId } from "@server/services/reviews.service";
import Review from "@server/models/review.model";

const mocks = vi.hoisted(() => ({
    countDocuments: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
}));

vi.mock("@server/models/review.model", () => ({
    default: {
        countDocuments: mocks.countDocuments,
        find: mocks.find,
        create: mocks.create,
    },
}));

vi.stubGlobal("createError", (err: any) => Object.assign(new Error(err.message || "Error"), err));

describe("reviews.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getReviewsByRestaurantId returns paginated mapped data", async () => {
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
        const limit = vi.fn().mockResolvedValue(reviewsDocs);
        const skip = vi.fn().mockReturnValue({ limit });
        const sort = vi.fn().mockReturnValue({ skip });
        const populate = vi.fn().mockReturnValue({ sort });
        mocks.find.mockReturnValue({ populate });
        mocks.countDocuments.mockResolvedValue(1);

        const result = await getReviewsByRestaurantId("rest1", "highest", 5, 10);

        expect(mocks.countDocuments).toHaveBeenCalledWith({ restaurant: "rest1" });
        expect(populate).toHaveBeenCalledWith("user", "name img");
        expect(sort).toHaveBeenCalledWith({ rating: -1 });
        expect(skip).toHaveBeenCalledWith(5);
        expect(limit).toHaveBeenCalledWith(10);
        expect(result.total).toBe(1);
        expect(result.reviews[0]).toMatchObject({
            _id: "rev1",
            restaurantId: "rest1",
            user: { _id: "u1", name: "A", img: "img" },
            rating: 5,
            content: "Great",
        });
    });

    it("createReview forwards to model.create", async () => {
        const reviewDoc = { _id: "rev2" };
        mocks.create.mockResolvedValue(reviewDoc);

        const result = await createReview("rest1", "u1", 4, "Nice");

        expect(mocks.create).toHaveBeenCalledWith({ restaurant: "rest1", user: "u1", rating: 4, content: "Nice" });
        expect(result).toBe(reviewDoc);
    });
});
