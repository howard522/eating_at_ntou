// test/__mocks__/models/review.model.mock.ts

import { vi } from "vitest";

const reviewMocks = vi.hoisted(() => ({
    aggregate: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
}));

export const mockReviewModel = () => {
    vi.mock("$models/review.model", () => {
        class ReviewMock {
            constructor(data: any) {
                Object.assign(this, data);
            }

            static aggregate = reviewMocks.aggregate;
            static countDocuments = reviewMocks.countDocuments;
            static create = reviewMocks.create;
            static find = reviewMocks.find;
        }

        return { default: ReviewMock };
    });
};

export { reviewMocks };
