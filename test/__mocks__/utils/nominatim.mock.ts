// test/__mocks__/utils/nominatim.mock.ts

import { vi } from "vitest";

const getGeocodeFromAddressMock = vi.fn();

export const mockNominatimUtils = () => {
    vi.mock("@server/utils/nominatim", () => ({
        getGeocodeFromAddress: getGeocodeFromAddressMock,
    }));
};

export { getGeocodeFromAddressMock };
