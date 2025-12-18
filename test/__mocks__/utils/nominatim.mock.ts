// test/__mocks__/utils/nominatim.mock.ts

import { vi } from "vitest";

const nominatimUtilMocks = vi.hoisted(() => ({
    geocodeAddress: vi.fn(),
    getGeocodeFromAddress: vi.fn(),
}));

export const mockNominatimUtils = () => {
    vi.mock("$utils/nominatim", () => ({
        geocodeAddress: nominatimUtilMocks.geocodeAddress,
        getGeocodeFromAddress: nominatimUtilMocks.getGeocodeFromAddress,
    }));
};

export { nominatimUtilMocks };