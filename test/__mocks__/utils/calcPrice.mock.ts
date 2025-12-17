// test/__mocks__/utils/calcPrice.mock.ts

import { vi } from "vitest";

const calculateDeliveryFeeMock = vi.fn();

export const mockCalcPriceUtils = () => {
    vi.mock("@server/utils/calcPrice", () => ({
        calculateDeliveryFeeByDistance: calculateDeliveryFeeMock,
    }));
};

export { calculateDeliveryFeeMock };
