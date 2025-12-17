// test/__mocks__/models/review.model.mock.ts

import { vi } from "vitest";

const reviewMocks = vi.hoisted(() => ({
    countDocuments: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
}));

export const mockReviewModel = () => {
    vi.mock("@server/models/review.model", () => {
        class ReviewMock {
            constructor(data: any) {
                Object.assign(this, data);
            }

            static countDocuments = reviewMocks.countDocuments;
            static create = reviewMocks.create;
            static find = reviewMocks.find;
        }

        return { default: ReviewMock };
    });
};

export { reviewMocks };
