// test/__mocks__/utils/mongoQuery.mock.ts

import { vi } from "vitest";

const mongoQueryUtilMocks = vi.hoisted(() => ({
    buildRestaurantSearchQuery: vi.fn(),
}));

export const mockMongoQueryUtils = () => {
    vi.mock("$utils/mongoQuery", () => ({
        buildRestaurantSearchQuery: mongoQueryUtilMocks.buildRestaurantSearchQuery,
    }));
};

export { mongoQueryUtilMocks };