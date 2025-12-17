// test/__mocks__/utils/mongoQuery.mock.ts

import { vi } from "vitest";

const buildRestaurantSearchQueryMock = vi.fn();

export const mockMongoQueryUtils = () => {
    vi.mock("@server/utils/mongoQuery", () => ({
        buildRestaurantSearchQuery: buildRestaurantSearchQueryMock,
    }));
};

export { buildRestaurantSearchQueryMock };
