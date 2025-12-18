// test/services/restaurants.service.test.ts

import { createDocumentMock } from "@mocks/document.mock";
import { restaurantMocks as mocks } from "@mocks/models/restaurant.model.mock";
import { createChainedQueryMock } from "@mocks/query.mock";
import { mongoQueryUtilMocks, mockMongoQueryUtils } from "@mocks/utils/mongoQuery.mock";
import { nominatimUtilMocks, mockNominatimUtils } from "@mocks/utils/nominatim.mock";
import { mockObjectUtils } from "@mocks/utils/object.mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

mockObjectUtils();
mockNominatimUtils();
mockMongoQueryUtils();

const getGeocodeFromAddressMock = nominatimUtilMocks.getGeocodeFromAddress;
const buildRestaurantSearchQueryMock = mongoQueryUtilMocks.buildRestaurantSearchQuery;

beforeEach(() => {
    mocks.restaurantInstances.length = 0;
});

// ---------------------------------------------------------------------
// Import 要測試的功能
// ---------------------------------------------------------------------

import Restaurant from "$models/restaurant.model";
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
} from "$services/restaurants.service";

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("restaurants.service - 餐廳相關功能", () => {
    describe("createRestaurant - 餐廳建立", () => {
        it("當提供地址時，應自動進行地理編碼並儲存餐廳", async () => {
            const data = { name: "R1", address: "addr", phone: "123" };
            getGeocodeFromAddressMock.mockResolvedValue({ coordinates: [1, 2] });
            const result = await createRestaurant(data);

            expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
            expect(result.locationGeo).toEqual({ coordinates: [1, 2] });
            expect(mocks.restaurantInstances).toHaveLength(1);
            expect(mocks.restaurantInstances[0].save).toHaveBeenCalled();
            expect(result).toStrictEqual(data);
        });

        it("當地理編碼失敗時，應拋出錯誤", async () => {
            const data = { name: "R1", address: "addr", phone: "123" };
            getGeocodeFromAddressMock.mockResolvedValue(null);
            const result = createRestaurant(data);

            expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
            expect(result).rejects.toHaveProperty("statusCode", 400);
            expect(mocks.restaurantInstances).toHaveLength(0);
        });
    });

    describe("getRestaurantById - 查詢餐廳", () => {
        it("當成功找到餐廳時，應回傳餐廳資料", async () => {
            const restaurant = { _id: "r2", name: "R2" };
            mocks.findById.mockReturnValue(createDocumentMock(restaurant));

            const result = await getRestaurantById("r2");

            expect(mocks.findById).toHaveBeenCalledWith("r2");
            expect(mocks.findById().toObject).toHaveBeenCalled();
            expect(result).toStrictEqual(restaurant);
        });

        it("當餐廳不存在時，應拋出錯誤", async () => {
            mocks.findById.mockResolvedValue(null);

            const result = getRestaurantById("missing");

            expect(mocks.findById).toHaveBeenCalledWith("missing");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("updateRestaurantById - 更新餐廳", () => {
        it("當更新地址時，應重新進行地理編碼並更新餐廳", async () => {
            const restaurant = { _id: "r3", name: "R3", address: "old addr" };
            getGeocodeFromAddressMock.mockResolvedValue({ coordinates: [1, 2] });
            mocks.findByIdAndUpdate.mockReturnValue(createChainedQueryMock(restaurant));

            const result = await updateRestaurantById("r3", { address: "addr" });
            expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
            expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
                "r3",
                { address: "addr", locationGeo: { coordinates: [1, 2] } },
                { new: true, runValidators: true }
            );
            expect(result).toStrictEqual(restaurant); // Mock 不會更新 address 欄位
        });

        it("當地理編碼失敗時，應拋出錯誤", async () => {
            getGeocodeFromAddressMock.mockResolvedValue(null);

            const result = updateRestaurantById("r3", { address: "addr" });

            expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
            expect(result).rejects.toHaveProperty("statusCode", 400);
            expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it("當餐廳不存在時，應拋出錯誤", async () => {
            mocks.findByIdAndUpdate.mockReturnValue(createChainedQueryMock(null));

            const result = updateRestaurantById("missing", {});

            expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith("missing", {}, { new: true, runValidators: true });
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("deleteRestaurantById - 刪除餐廳", () => {
        it("當餐廳存在時，應成功刪除", async () => {
            mocks.findByIdAndDelete.mockResolvedValue({ _id: "r4" });

            await deleteRestaurantById("r4");

            expect(mocks.findByIdAndDelete).toHaveBeenCalledWith("r4");
        });

        it("當餐廳不存在時，應拋出錯誤", async () => {
            mocks.findByIdAndDelete.mockResolvedValue(null);

            const result = deleteRestaurantById("missing");

            expect(mocks.findByIdAndDelete).toHaveBeenCalledWith("missing");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("getRestaurantsByQuery - 查詢餐廳列表", () => {
        it("當有查詢條件時，應回傳符合條件的餐廳資料", async () => {
            const restaurants = [
                { _id: "r5", name: "R5" },
                { _id: "r6", name: "R6" },
            ];
            mocks.find.mockReturnValue(createChainedQueryMock(restaurants));

            const result = await getRestaurantsByQuery({ isActive: true }, { limit: 2, skip: 1 });

            expect(mocks.find).toHaveBeenCalledWith({ isActive: true });
            expect(mocks.find().limit).toHaveBeenCalledWith(2);
            expect(mocks.find().skip).toHaveBeenCalledWith(1);
            expect(mocks.find().lean).toHaveBeenCalled();
            expect(result).toStrictEqual(restaurants);
        });

        it("當無查詢條件時，應回傳預設數量的餐廳資料", async () => {
            // QUESTION: 這個測試案例是否有意義？不確定預設值應該要在哪裡設定比較好
            const restaurants = [
                { _id: "r5", name: "R5" },
                { _id: "r6", name: "R6" },
            ];
            mocks.find.mockReturnValue(createChainedQueryMock(restaurants));

            const result = await getRestaurantsByQuery({});

            expect(mocks.find).toHaveBeenCalledWith({});
            expect(mocks.find().limit).toHaveBeenCalledWith(50);
            expect(mocks.find().skip).toHaveBeenCalledWith(0);
            expect(mocks.find().lean).toHaveBeenCalled();
            expect(result).toStrictEqual(restaurants);
        });
    });

    describe("searchRestaurants - 搜尋餐廳", () => {
        it("當提供關鍵字時，應回傳符合條件的餐廳資料", async () => {
            const restaurants = [
                { _id: "r7", name: "Re7" },
                { _id: "r8", name: "Re8" },
            ];
            buildRestaurantSearchQueryMock.mockReturnValue({ name: /re/i });
            mocks.find.mockReturnValue(createChainedQueryMock(restaurants));

            const result = await searchRestaurants("re", { limit: 3, skip: 2, activeOnly: true });

            expect(buildRestaurantSearchQueryMock).toHaveBeenCalledWith("re", { maxTerms: 5, maxTermLength: 50 });
            expect(mocks.find).toHaveBeenCalledWith({ name: /re/i, isActive: true });
            expect(mocks.find().limit).toHaveBeenCalledWith(3);
            expect(mocks.find().skip).toHaveBeenCalledWith(2);
            expect(result).toStrictEqual(restaurants);
        });

        it("當無提供關鍵字時，應回傳預設數量的餐廳資料", async () => {
            const restaurants = [
                { _id: "r7", name: "Re7" },
                { _id: "r8", name: "Re8" },
            ];
            buildRestaurantSearchQueryMock.mockReturnValue({});
            mocks.find.mockReturnValue(createChainedQueryMock(restaurants));

            const result = await searchRestaurants("", {});

            expect(buildRestaurantSearchQueryMock).toHaveBeenCalledWith("", { maxTerms: 5, maxTermLength: 50 });
            expect(mocks.find).toHaveBeenCalledWith({ isActive: true });
            expect(mocks.find().limit).toHaveBeenCalledWith(50);
            expect(mocks.find().skip).toHaveBeenCalledWith(0);
            expect(result).toStrictEqual(restaurants);
        });

        it("當 activeOnly 為 false 時，應包含非上架的餐廳", async () => {
            const restaurants = [
                { _id: "r7", name: "Re7" },
                { _id: "r8", name: "Re8" },
            ];
            buildRestaurantSearchQueryMock.mockReturnValue({});
            mocks.find.mockReturnValue(createChainedQueryMock(restaurants));

            const result = await searchRestaurants("re", { activeOnly: false });

            expect(buildRestaurantSearchQueryMock).toHaveBeenCalled();
            expect(mocks.find).toHaveBeenCalledWith({});
            expect(result).toStrictEqual(restaurants);
        });
    });

    describe("searchRestaurantsNearByAddress - 附近餐廳搜尋", () => {
        it("當提供地址時，應執行地理查詢並回傳餐廳資料", async () => {
            const restaurants = [
                { _id: "r9", name: "Re9" },
                { _id: "r10", name: "Re10" },
            ];
            getGeocodeFromAddressMock.mockResolvedValue({ type: "Point", coordinates: [1, 2] });
            buildRestaurantSearchQueryMock.mockReturnValue({ name: /re/i });
            mocks.aggregate.mockResolvedValue(restaurants);

            const result = await searchRestaurantsNearByAddress("addr", "re", {
                limit: 5,
                skip: 1,
                maxDistance: 1000,
                activeOnly: false,
            });

            expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
            expect(buildRestaurantSearchQueryMock).toHaveBeenCalled();
            expect(mocks.aggregate).toHaveBeenCalled();
            expect(result).toStrictEqual(restaurants);
        });

        it("當地理編碼失敗時，應拋出錯誤", async () => {
            getGeocodeFromAddressMock.mockResolvedValue(null);

            const result = searchRestaurantsNearByAddress("addr", "re", {});

            expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
            expect(result).rejects.toHaveProperty("statusCode", 400);
            expect(mocks.aggregate).not.toHaveBeenCalled();
        });
    });
});

describe("menu.service - 餐單項目操作", () => {
    describe("createMenuItem - 建立餐單項目", () => {
        it("當成功建立餐單項目時，應儲存並回傳該項目", async () => {
            const restaurant = new Restaurant({ _id: "rest1", menu: [] });
            restaurant.menu.create = (d: any) => createDocumentMock({ ...d, _id: "m-new" });
            restaurant.menu.push = vi.fn();
            mocks.findById.mockResolvedValue(restaurant);

            const result = await createMenuItem("rest1", { name: "Dish", price: 100 });

            expect(mocks.findById).toHaveBeenCalledWith("rest1");
            expect(restaurant.menu.push).toHaveBeenCalled();
            expect(restaurant.save).toHaveBeenCalled();
            expect(result).toStrictEqual({ name: "Dish", price: 100, _id: "m-new" });
        });

        it("當餐廳不存在時，應拋出錯誤", async () => {
            mocks.findById.mockResolvedValue(null);

            const result = createMenuItem("rest-missing", { name: "Dish", price: 100 });

            expect(mocks.findById).toHaveBeenCalledWith("rest-missing");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("getMenuItemById - 查詢餐單項目", () => {
        it("當成功找到餐單項目時，應回傳該項目", async () => {
            const item = { _id: "m1", name: "Dish" };
            const restaurant = new Restaurant({ _id: "rest1", menu: [item] });
            restaurant.menu.id = vi.fn((mid: string) => (mid === "m1" ? (createDocumentMock(item) as any) : null));
            mocks.findById.mockResolvedValue(restaurant);

            const result = await getMenuItemById("rest1", "m1");

            expect(mocks.findById).toHaveBeenCalledWith("rest1");
            expect(restaurant.menu.id).toHaveBeenCalledWith("m1");
            expect(result).toStrictEqual(item);
        });

        it("當餐單項目不存在時，應拋出錯誤", async () => {
            const restaurant = new Restaurant({ _id: "rest1", menu: [] });
            restaurant.menu.id = vi.fn().mockReturnValue(null);
            mocks.findById.mockResolvedValue(restaurant);

            const result = getMenuItemById("rest1", "missing");

            expect(mocks.findById).toHaveBeenCalledWith("rest1");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });

        it("當餐廳不存在時，應拋出錯誤", async () => {
            mocks.findById.mockResolvedValue(null);

            const result = getMenuItemById("rest-missing", "m2");

            expect(mocks.findById).toHaveBeenCalledWith("rest-missing");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("updateMenuItemById - 更新餐單項目", () => {
        it("當成功更新餐單項目時，應回傳更新後的項目", async () => {
            const item = { _id: "m1", name: "Old" };
            const restaurant = new Restaurant({ _id: "rest1", menu: [item] });
            restaurant.menu.id = vi.fn((mid: string) => (mid === "m1" ? (createDocumentMock(item) as any) : null));
            mocks.findById.mockResolvedValue(restaurant);

            const result = await updateMenuItemById("rest1", "m1", { name: "New" });

            expect(mocks.findById).toHaveBeenCalledWith("rest1");
            expect(restaurant.menu.id).toHaveBeenCalledWith("m1");
            expect(restaurant.save).toHaveBeenCalled();
            expect(result).toStrictEqual({ _id: "m1", name: "New" });
        });

        it("當餐單項目不存在時，應拋出錯誤", async () => {
            const restaurant = new Restaurant({ _id: "rest1", menu: [] });
            restaurant.menu.id = vi.fn().mockReturnValue(null);
            mocks.findById.mockResolvedValue(restaurant);

            const result = updateMenuItemById("rest1", "missing", { name: "New" });

            expect(mocks.findById).toHaveBeenCalledWith("rest1");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });

        it("當餐廳不存在時，應拋出錯誤", async () => {
            mocks.findById.mockResolvedValue(null);

            const result = updateMenuItemById("rest-missing", "m3", { name: "New" });

            expect(mocks.findById).toHaveBeenCalledWith("rest-missing");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("deleteMenuItemById - 刪除餐單項目", () => {
        it("當成功刪除餐單項目時，應儲存變更並回傳", async () => {
            const item = { _id: "m1" };
            const restaurant = new Restaurant({ _id: "rest1", menu: [item] });
            restaurant.menu.id = vi.fn((mid: string) => (mid === "m1" ? (item as any) : null));
            restaurant.menu.pull = vi.fn();
            mocks.findById.mockResolvedValue(restaurant);

            await deleteMenuItemById("rest1", "m1");

            expect(mocks.findById).toHaveBeenCalledWith("rest1");
            expect(restaurant.menu.id).toHaveBeenCalledWith("m1");
            expect(restaurant.menu.pull).toHaveBeenCalledWith(item);
            expect(restaurant.save).toHaveBeenCalled();
        });

        it("當餐單項目不存在時，應拋出錯誤", async () => {
            const restaurant = new Restaurant({ _id: "rest1", menu: [] });
            restaurant.menu.id = vi.fn().mockReturnValue(null);
            mocks.findById.mockResolvedValue(restaurant);

            const result = deleteMenuItemById("rest1", "missing");

            expect(mocks.findById).toHaveBeenCalledWith("rest1");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });

        it("當餐廳不存在時，應拋出錯誤", async () => {
            mocks.findById.mockResolvedValue(null);

            const result = deleteMenuItemById("rest-missing", "m2");

            expect(mocks.findById).toHaveBeenCalledWith("rest-missing");
            expect(result).rejects.toHaveProperty("statusCode", 404);
        });
    });
});
