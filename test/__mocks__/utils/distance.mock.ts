// test/__mocks__/utils/distance.mock.ts

import { vi } from "vitest";

const haversineDistanceMock = vi.fn();

export const mockDistanceUtils = () => {
    vi.mock("@server/utils/distance", () => ({
        haversineDistance: haversineDistanceMock,
    }));
};

export { haversineDistanceMock };
