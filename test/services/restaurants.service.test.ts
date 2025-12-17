// test/services/restaurants.service.test.ts

import Restaurant from "@server/models/restaurant.model";
import {
    createMenuItem,
    createRestaurant,
    deleteMenuItemById,
    deleteRestaurantById,
    getMenuItemById,
    getRestaurantById,
    getRestaurantsByQuery,
    searchRestaurants,
    searchRestaurantsNearByAddress,
    updateMenuItemById,
    updateRestaurantById,
} from "@server/services/restaurants.service";
import { buildRestaurantSearchQueryMock, mockMongoQueryUtils } from "@test/__mocks__/utils/mongoQuery.mock";
import { getGeocodeFromAddressMock, mockNominatimUtils } from "@test/__mocks__/utils/nominatim.mock";
import { mockObjectUtils } from "@test/__mocks__/utils/object.mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
    findByIdMock: vi.fn(),
    findByIdAndUpdateMock: vi.fn(),
    findByIdAndDeleteMock: vi.fn(),
    findMock: vi.fn(),
    aggregateMock: vi.fn(),
    restaurantInstances: [] as any[],
    buildRestaurantSearchQuery: vi.fn(),
}));

vi.mock("@server/models/restaurant.model", () => {
    class RestaurantMock {
        _id: any;
        menu: any[];
        isActive?: boolean;
        locationGeo?: any;
        data: any;
        constructor(data: any) {
            this._id = data._id || "rest-new";
            this.data = data;
            this.menu = data.menu || [];
            this.isActive = data.isActive;
            this.locationGeo = data.locationGeo;
            mocks.restaurantInstances.push(this);
        }
        save = vi.fn().mockResolvedValue(undefined);
        toObject = () => ({ _id: this._id, ...this.data });
        static findById = mocks.findByIdMock;
        static findByIdAndUpdate = mocks.findByIdAndUpdateMock;
        static findByIdAndDelete = mocks.findByIdAndDeleteMock;
        static find = mocks.findMock;
        static aggregate = mocks.aggregateMock;
    }
    return { default: RestaurantMock };
});

mockMongoQueryUtils();
mockNominatimUtils();
mockObjectUtils();

beforeEach(() => {
    mocks.restaurantInstances.length = 0;
});

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("restaurants.service", () => {
    it("createRestaurant geocodes address and saves", async () => {
        getGeocodeFromAddressMock.mockResolvedValue({ coords: true });
        const result = await createRestaurant({ name: "R1", address: "addr" } as any);

        expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
        expect(result.locationGeo).toEqual({ coords: true });
        expect(mocks.restaurantInstances).toHaveLength(1);
        expect(mocks.restaurantInstances[0].save).toHaveBeenCalled();
    });

    it("createRestaurant throws on bad geocode", async () => {
        getGeocodeFromAddressMock.mockResolvedValue(null);

        await expect(createRestaurant({ name: "R1", address: "addr" } as any)).rejects.toHaveProperty(
            "statusCode",
            400
        );
    });

    it("getRestaurantById returns object", async () => {
        const doc = { _id: "r1", toObject: () => ({ _id: "r1", name: "R" }) } as any;
        mocks.findByIdMock.mockResolvedValue(doc);

        const result = await getRestaurantById("r1");

        expect(result).toEqual({ _id: "r1", name: "R" });
    });

    it("updateRestaurantById geocodes and returns updated", async () => {
        getGeocodeFromAddressMock.mockResolvedValue({ coords: true });
        const doc = { _id: "r2", toObject: () => ({ _id: "r2", name: "New" }) } as any;
        const select = vi.fn();
        mocks.findByIdAndUpdateMock.mockResolvedValue(doc);

        const result = await updateRestaurantById("r2", { address: "addr" } as any);

        expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
        expect(result).toEqual({ _id: "r2", name: "New" });
    });

    it("updateRestaurantById throws 404 when missing", async () => {
        mocks.findByIdAndUpdateMock.mockResolvedValue(null);

        await expect(updateRestaurantById("missing", {} as any)).rejects.toHaveProperty("statusCode", 404);
    });

    it("deleteRestaurantById deletes or throws", async () => {
        mocks.findByIdAndDeleteMock.mockResolvedValue(null);
        await expect(deleteRestaurantById("missing" as any)).rejects.toHaveProperty("statusCode", 404);

        mocks.findByIdAndDeleteMock.mockResolvedValue({ _id: "r3" } as any);
        await deleteRestaurantById("r3");
        expect(mocks.findByIdAndDeleteMock).toHaveBeenCalledWith("r3");
    });

    it("getRestaurantsByQuery maps toObject", async () => {
        const docs = [
            { _id: "r4", toObject: () => ({ _id: "r4", name: "R4" }) },
            { _id: "r5", toObject: () => ({ _id: "r5", name: "R5" }) },
        ];
        const skip = vi.fn().mockReturnValue(docs);
        const limit = vi.fn().mockReturnValue({ skip });
        mocks.findMock.mockReturnValue({ limit });

        const result = await getRestaurantsByQuery({ isActive: true } as any, { limit: 2, skip: 1 });

        expect(mocks.findMock).toHaveBeenCalledWith({ isActive: true });
        expect(limit).toHaveBeenCalledWith(2);
        expect(skip).toHaveBeenCalledWith(1);
        expect(result).toEqual([
            { _id: "r4", name: "R4" },
            { _id: "r5", name: "R5" },
        ]);
    });

    it("searchRestaurants builds query and filters active", async () => {
        buildRestaurantSearchQueryMock.mockReturnValue({ name: /re/i });
        const data = [{ _id: "r6", toObject: () => ({ _id: "r6" }) }];
        const skip = vi.fn().mockResolvedValue(data);
        const limit = vi.fn().mockReturnValue({ skip });
        mocks.findMock.mockReturnValue({ limit });

        const result = await searchRestaurants("re", { limit: 3, skip: 2, activeOnly: true });

        expect(buildRestaurantSearchQueryMock).toHaveBeenCalled();
        expect(mocks.findMock).toHaveBeenCalledWith({ name: /re/i, isActive: true });
        expect(limit).toHaveBeenCalledWith(3);
        expect(skip).toHaveBeenCalledWith(2);
        expect(result).toEqual([{ _id: "r6" }]);
    });

    it("searchRestaurantsNearByAddress runs geo pipeline", async () => {
        getGeocodeFromAddressMock.mockResolvedValue({ type: "Point", coordinates: [1, 2] });
        buildRestaurantSearchQueryMock.mockReturnValue({ name: /re/i });
        mocks.aggregateMock.mockResolvedValue([{ _id: "r7" }]);

        const result = await searchRestaurantsNearByAddress("addr", "re", {
            limit: 5,
            skip: 1,
            maxDistance: 1000,
            activeOnly: false,
        });

        expect(mocks.aggregateMock).toHaveBeenCalled();
        expect(result).toEqual([{ _id: "r7" }]);
    });

    it("createMenuItem adds item and saves", async () => {
        const restaurant = new (Restaurant as any)({ _id: "rest1", menu: [] });
        restaurant.menu.create = (d: any) => ({ ...d, toObject: () => ({ ...d, _id: "m-new" }) });
        restaurant.menu.push = vi.fn();
        mocks.findByIdMock.mockResolvedValue(restaurant);

        const result = await createMenuItem("rest1", { name: "Dish", price: 100 } as any);

        expect(restaurant.menu.push).toHaveBeenCalled();
        expect(restaurant.save).toHaveBeenCalled();
        expect(result).toMatchObject({ name: "Dish", price: 100, _id: "m-new" });
    });

    it("getMenuItemById returns item or throws", async () => {
        const item = { _id: "m1", toObject: () => ({ _id: "m1", name: "Dish" }) } as any;
        const restaurant = new (Restaurant as any)({ _id: "rest1", menu: [item] });
        restaurant.menu.id = (mid: any) => (mid === "m1" ? item : null);
        mocks.findByIdMock.mockResolvedValue(restaurant);

        const result = await getMenuItemById("rest1", "m1");
        expect(result).toEqual({ _id: "m1", name: "Dish" });

        restaurant.menu.id = () => null;
        await expect(getMenuItemById("rest1", "m2")).rejects.toHaveProperty("statusCode", 404);
    });

    it("updateMenuItemById updates fields and saves", async () => {
        const item = { _id: "m1", name: "Old", toObject: () => ({ _id: "m1", name: "New" }) } as any;
        const restaurant = new (Restaurant as any)({ _id: "rest1", menu: [item] });
        restaurant.menu.id = (mid: any) => (mid === "m1" ? item : null);
        mocks.findByIdMock.mockResolvedValue(restaurant);

        const result = await updateMenuItemById("rest1", "m1", { name: "New" } as any);

        expect(item.name).toBe("New");
        expect(restaurant.save).toHaveBeenCalled();
        expect(result).toEqual({ _id: "m1", name: "New" });
    });

    it("deleteMenuItemById removes item", async () => {
        const item = { _id: "m1" } as any;
        const restaurant = new (Restaurant as any)({ _id: "rest1", menu: [item] });
        restaurant.menu.id = (mid: any) => (mid === "m1" ? item : null);
        restaurant.menu.pull = vi.fn();
        mocks.findByIdMock.mockResolvedValue(restaurant);

        await deleteMenuItemById("rest1", "m1");

        expect(restaurant.menu.pull).toHaveBeenCalledWith(item);
        expect(restaurant.save).toHaveBeenCalled();
    });
});
