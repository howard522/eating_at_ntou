// test/__mocks__/utils/distance.mock.ts

import { vi } from "vitest";

const distanceUtilMocks = vi.hoisted(() => ({
    haversineDistance: vi.fn(),
}));

export const mockDistanceUtils = () => {
    vi.mock("$utils/distance", () => ({
        haversineDistance: distanceUtilMocks.haversineDistance,
    }));
};

export { distanceUtilMocks };
