// test/__mocks__/utils/calcPrice.mock.ts

import { vi } from "vitest";

const calcPriceUtilMocks = vi.hoisted(() => ({
    calculateDeliveryFeeByDistance: vi.fn(),
}));

export const mockCalcPriceUtils = () => {
    vi.mock("@server/utils/calcPrice", () => ({
        calculateDeliveryFeeByDistance: calcPriceUtilMocks.calculateDeliveryFeeByDistance,
    }));
};

export { calcPriceUtilMocks };
