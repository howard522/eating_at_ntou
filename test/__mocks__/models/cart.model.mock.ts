// test/__mocks__/models/cart.model.mock.ts

import { createDocumentMock } from "@test/__mocks__/document.mock";
import { vi } from "vitest";

const cartMocks = vi.hoisted(() => ({
    findOne: vi.fn(),
    cartInstances: [] as any[],
    CartMock: undefined as any,
}));

export const mockCartModel = () => {
    vi.mock("@server/models/cart.model", () => {
        class CartMock {
            constructor(data: any) {
                data = createDocumentMock(data);
                Object.assign(this, data);
                cartMocks.cartInstances.push(this);
            }

            static findOne = cartMocks.findOne;
        }

        cartMocks.CartMock = CartMock;

        return { default: CartMock };
    });
};

export { cartMocks };
