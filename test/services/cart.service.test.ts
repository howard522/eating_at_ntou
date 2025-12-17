// test/services/cart.service.test.ts

import Cart from "@server/models/cart.model";
import {
    calculateDeliveryFee,
    clearCartByUserId,
    createCartForUser,
    getCartByUserId,
    updateCartByUserId,
} from "@server/services/cart.service";
import { calculateDeliveryFeeMock, mockCalcPriceUtils } from "@test/__mocks__/utils/calcPrice.mock";
import { haversineDistanceMock, mockDistanceUtils } from "@test/__mocks__/utils/distance.mock";
import { getGeocodeFromAddressMock, mockNominatimUtils } from "@test/__mocks__/utils/nominatim.mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

const mocks = vi.hoisted(() => {
    return {
        findOneMock: vi.fn(),
        cartInstances: [] as any[],
        getRestaurantsByQuery: vi.fn(),
    };
});

vi.mock("@server/models/cart.model", () => {
    class CartMock {
        user: any;
        items: any[];
        status: string;
        total: number;
        currency?: string;
        constructor(data: any) {
            this.user = data.user;
            this.items = data.items || [];
            this.status = data.status || "open";
            this.total = data.total || 0;
            this.currency = data.currency;
            mocks.cartInstances.push(this);
        }
        save = vi.fn().mockResolvedValue(undefined);
        toObject = () => ({
            user: this.user,
            items: this.items,
            status: this.status,
            total: this.total,
            currency: this.currency,
        });
        static findOne = mocks.findOneMock;
    }
    return { default: CartMock };
});

vi.mock("./restaurants.service", () => ({
    getRestaurantsByQuery: mocks.getRestaurantsByQuery,
}));

mockCalcPriceUtils();
mockDistanceUtils();
mockNominatimUtils();

beforeEach(() => {
    mocks.cartInstances.length = 0;
});

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("cart.service", () => {
    it("createCartForUser - creates and saves cart", async () => {
        const cart = await createCartForUser("u1");

        expect(mocks.cartInstances).toHaveLength(1);
        expect(cart.user).toBe("u1");
        expect(cart.items).toEqual([]);
        expect(mocks.cartInstances[0].save).toHaveBeenCalled();
    });

    it("getCartByUserId - builds response with restaurant/menu info", async () => {
        const cart = new (Cart as any)({
            user: "u2",
            items: [{ restaurantId: "r1", menuItemId: "m1", name: "old", price: 10, quantity: 1, options: [] }],
        });
        mocks.findOneMock.mockResolvedValue(cart);
        mocks.getRestaurantsByQuery.mockResolvedValue([
            { _id: "r1", name: "Rest", menu: [{ _id: "m1", name: "New", price: 15, image: "img", info: "info" }] },
        ]);

        const result = await getCartByUserId("u2");

        expect(mocks.findOneMock).toHaveBeenCalledWith({ user: "u2" });
        expect(result.items[0]).toMatchObject({
            restaurantName: "Rest",
            name: "New",
            price: 15,
            image: "img",
            info: "info",
        });
    });

    it("updateCartByUserId - clears when items empty", async () => {
        const cart = new (Cart as any)({ user: "u3", items: [{ menuItemId: "m1" }], total: 50 });
        mocks.findOneMock.mockResolvedValue(cart);

        const result = await updateCartByUserId("u3", []);

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.status).toBe("open");
        expect(cart.save).toHaveBeenCalled();
    });

    it("updateCartByUserId - throws when cart locked", async () => {
        const cart = new (Cart as any)({ user: "u4", items: [], status: "locked" });
        mocks.findOneMock.mockResolvedValue(cart);

        await expect(
            updateCartByUserId("u4", [{ restaurantId: "r1", menuItemId: "m1", quantity: 1 } as any])
        ).rejects.toHaveProperty("statusCode", 423);
    });

    it("updateCartByUserId - replaces items and saves", async () => {
        const cart = new (Cart as any)({ user: "u5", items: [{ restaurantId: "r1" }], status: "open" });
        mocks.findOneMock.mockResolvedValue(cart);

        const newItems = [{ restaurantId: "r2", menuItemId: "m2", quantity: 2 }];
        const result = await updateCartByUserId("u5", newItems as any);

        expect(cart.items).toEqual(newItems);
        expect(cart.save).toHaveBeenCalled();
        expect(result).toBe(cart);
    });

    it("clearCartByUserId - resets fields and saves", async () => {
        const cart = new (Cart as any)({ user: "u6", items: [{ restaurantId: "r1" }], total: 100, status: "locked" });
        mocks.findOneMock.mockResolvedValue(cart);

        const result = await clearCartByUserId("u6");

        expect(result?.items).toHaveLength(0);
        expect(result?.total).toBe(0);
        expect(result?.status).toBe("open");
        expect(cart.save).toHaveBeenCalled();
    });

    it("calculateDeliveryFee - returns 0 for empty cart", async () => {
        const cart = new (Cart as any)({ user: "u7", items: [] });
        mocks.findOneMock.mockResolvedValue(cart);

        const result = await calculateDeliveryFee("u7", "addr");

        expect(result).toBe(0);
    });

    it("calculateDeliveryFee - throws when geocode fails", async () => {
        const cart = new (Cart as any)({ user: "u8", items: [{ restaurantId: "r1", menuItemId: "m1" }] });
        mocks.findOneMock.mockResolvedValue(cart);
        getGeocodeFromAddressMock.mockResolvedValue(null);

        await expect(calculateDeliveryFee("u8", "addr")).rejects.toHaveProperty("statusCode", 400);
    });

    it("calculateDeliveryFee - computes average distance and fee", async () => {
        const cart = new (Cart as any)({
            user: "u9",
            items: [
                { restaurantId: "r1", menuItemId: "m1" },
                { restaurantId: "r2", menuItemId: "m2" },
            ],
        });
        mocks.findOneMock.mockResolvedValue(cart);
        getGeocodeFromAddressMock.mockResolvedValue({ coordinates: [121, 25] });
        mocks.getRestaurantsByQuery.mockResolvedValue([
            { _id: "r1", locationGeo: { coordinates: [121, 25] }, name: "R1" },
            { _id: "r2", locationGeo: { coordinates: [122, 26] }, name: "R2" },
        ]);
        haversineDistanceMock.mockReturnValueOnce(1000).mockReturnValueOnce(3000);
        calculateDeliveryFeeMock.mockReturnValue(50);

        const result = await calculateDeliveryFee("u9", "addr");

        expect(haversineDistanceMock).toHaveBeenCalledTimes(2);
        expect(calculateDeliveryFeeMock).toHaveBeenCalledWith(2); // avg distance km
        expect(result).toEqual({ distance: 2, fee: 50 });
    });
});
