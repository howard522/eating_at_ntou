// test/services/cart.service.test.ts

import { cartMocks as mocks } from "@test/__mocks__/models/cart.model.mock";
import { createChainedQueryMock } from "@test/__mocks__/query.mock";
import { calcPriceUtilMocks, mockCalcPriceUtils } from "@test/__mocks__/utils/calcPrice.mock";
import { distanceUtilMocks, mockDistanceUtils } from "@test/__mocks__/utils/distance.mock";
import { mockNominatimUtils, nominatimUtilMocks } from "@test/__mocks__/utils/nominatim.mock";
import { beforeEach, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

mockCalcPriceUtils();
mockDistanceUtils();
mockNominatimUtils();

const calculateDeliveryFeeMock = calcPriceUtilMocks.calculateDeliveryFeeByDistance;
const haversineDistanceMock = distanceUtilMocks.haversineDistance;
const getGeocodeFromAddressMock = nominatimUtilMocks.getGeocodeFromAddress;

beforeEach(() => {
    mocks.cartInstances.length = 0;
});

// ---------------------------------------------------------------------
// Import 要測試的功能
// ---------------------------------------------------------------------

import Cart from "@server/models/cart.model";
import {
    calculateDeliveryFee,
    clearCartByUserId,
    createCartForUser,
    getCartByUserId,
    updateCartByUserId,
} from "@server/services/cart.service";

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("cart.service", () => {
    describe("createCartForUser - 建立新的購物車", () => {
        it("當使用者建立新的購物車時，應該建立一個新的購物車並儲存", async () => {
            mocks.findOne.mockResolvedValue(null); // 模擬沒有現有的購物車

            const result = await createCartForUser("u1");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u1" });
            expect(mocks.cartInstances).toHaveLength(1);
            expect(mocks.cartInstances[0].save).toHaveBeenCalled();
            expect(mocks.cartInstances[0].toObject).toHaveBeenCalled();
            expect(result.user).toBe("u1");
            expect(result.items).toStrictEqual([]);
        });

        it("當使用者已有購物車時，應該拋出衝突錯誤", async () => {
            const existingCart = new Cart({ user: "u1", items: [] });
            mocks.findOne.mockResolvedValue(existingCart); // 模擬已有購物車

            const result = createCartForUser("u1");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u1" });
            expect(mocks.cartInstances).toHaveLength(1); // 不應該建立新購物車 (因為已有)
            expect(result).rejects.toHaveProperty("statusCode", 409);
        });
    });

    describe("getCartByUserId - 根據使用者 ID 獲取購物車", () => {
        it("應該根據使用者 ID 獲取購物車並包含餐廳和菜單資訊", async () => {
            const cart = new Cart({
                user: "u2",
                items: [
                    {
                        restaurantId: "r1",
                        menuItemId: "m1",
                        restaurant: {
                            name: "Rest",
                            image: "rest_img",
                            info: "rest_info",
                            menu: {
                                find: (mi: string) => ({
                                    name: "Dish",
                                    price: 10,
                                    image: "dish_img",
                                    info: "dish_info",
                                }),
                            },
                        },
                        price: 10,
                        quantity: 1,
                    },
                ],
            });
            // WARNING: 這裡沒有 lean()
            mocks.findOne.mockReturnValue(createChainedQueryMock(cart, ["populate"]));

            const result = await getCartByUserId("u2");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u2" });
            expect(result.user).toBe("u2");
            expect(result.items).toHaveLength(1);
            expect(result.items[0]).toStrictEqual({
                restaurantId: "r1",
                menuItemId: "m1",
                restaurantName: "Rest",
                name: "Dish",
                price: 10,
                image: "dish_img",
                info: "dish_info",
                quantity: 1,
            });
        });

        it("當使用者沒有購物車時，會自動建立一個新的購物車", async () => {
            mocks.findOne.mockReturnValue(createChainedQueryMock(null, ["populate"])); // 模擬沒有現有的購物車

            const result = await getCartByUserId("u3");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u3" });
            expect(mocks.cartInstances).toHaveLength(1);
            expect(mocks.cartInstances[0].save).toHaveBeenCalled();
            expect(result.user).toBe("u3");
            expect(result.items).toHaveLength(0);
        });
    });

    describe("updateCartByUserId - 根據使用者 ID 更新購物車", () => {
        it("應該根據使用者 ID 更新購物車的商品列表並重新計算總價", async () => {
            const cart = new Cart({ user: "u1", items: [], total: 0 });
            mocks.findOne.mockReturnValue(createChainedQueryMock(cart, ["populate"]));

            const newItems = [
                { _id: "i1", restaurantId: "r1", menuItemId: "m1", name: "dish1", price: 100, quantity: 2 },
                { _id: "i2", restaurantId: "r2", menuItemId: "m2", name: "dish2", price: 50, quantity: 1 },
            ];

            const result = await updateCartByUserId("u1", newItems);

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u1" });
            expect(cart.save).toHaveBeenCalled();
            expect(cart.items).toStrictEqual(newItems);
            // expect(cart.total).toBe(250); // 100*2 + 50*1 (沒有 mock 自動計算總價)
            expect(result).toBe(cart);
        });

        it("當使用者沒有購物車時，會自動建立一個新的購物車", async () => {
            mocks.findOne.mockReturnValue(createChainedQueryMock(null, ["populate"]));
            const newItems = [{ restaurantId: "r1", menuItemId: "m1", quantity: 2 }];

            const result = await updateCartByUserId("u2", newItems as any);

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u2" });
            expect(mocks.cartInstances).toHaveLength(1);
            expect(mocks.cartInstances[0].save).toHaveBeenCalled();
            expect(result.user).toBe("u2");
            expect(result.items).toEqual(newItems);
        });

        it("當傳入的商品列表為空時，應該清空購物車並重設總價和狀態", async () => {
            const cart = new Cart({ user: "u3", items: [{ menuItemId: "m1" }], total: 50 });
            mocks.findOne.mockReturnValue(createChainedQueryMock(cart, ["populate"]));

            const result = await updateCartByUserId("u3", []);

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u3" });
            expect(cart.save).toHaveBeenCalled();
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.status).toBe("open");
            expect(result).toBe(cart);
        });

        it("當購物車狀態為 locked 時，應該拋出鎖定錯誤", async () => {
            const cart = new Cart({ user: "u4", items: [], status: "locked" });
            mocks.findOne.mockReturnValue(createChainedQueryMock(cart, ["populate"]));

            const result = updateCartByUserId("u4", [
                { _id: "i1", restaurantId: "r1", menuItemId: "m1", name: "dish", price: 10, quantity: 1 },
            ]);

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u4" });
            expect(cart.save).not.toHaveBeenCalled();
            expect(result).rejects.toHaveProperty("statusCode", 423);
        });
    });

    describe("clearCartByUserId - 根據使用者 ID 清空購物車", () => {
        it("應該清空購物車的商品列表並重設總價和狀態", async () => {
            const cart = new Cart({ user: "u5", items: [{ menuItemId: "m1" }], total: 50, status: "locked" });
            mocks.findOne.mockReturnValue(createChainedQueryMock(cart, ["populate"]));

            const result = await clearCartByUserId("u5");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u5" });
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.status).toBe("open");
            expect(cart.save).toHaveBeenCalled();
        });
    });

    describe("calculateDeliveryFee - 計算配送費用", () => {
        it("當使用者沒有購物車時，會返回 0 元", async () => {
            mocks.findOne.mockReturnValue(createChainedQueryMock(null, ["populate"]));

            const result = await calculateDeliveryFee("u6", "some address");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u6" });
            expect(result).toBe(0);
        });

        it("當取得地址的地理編碼失敗時，應該拋出錯誤", async () => {
            const cart = new Cart({ user: "u8", items: [{ restaurantId: "r1", menuItemId: "m1" }] });
            mocks.findOne.mockReturnValue(createChainedQueryMock(cart, ["populate"]));
            getGeocodeFromAddressMock.mockResolvedValue(null);

            const result = calculateDeliveryFee("u8", "addr");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u8" });
            expect(result).rejects.toHaveProperty("statusCode", 400);
        });

        it("當計算平均距離和配送費用時，應該正確計算並返回結果", async () => {
            const cart = new Cart({
                user: "u9",
                items: [
                    {
                        restaurantId: "r1",
                        menuItemId: "m1",
                        restaurant: { locationGeo: { coordinates: [120, 24] } },
                    },
                    {
                        restaurantId: "r2",
                        menuItemId: "m2",
                        restaurant: { locationGeo: { coordinates: [122, 26] } },
                    },
                ],
            });
            mocks.findOne.mockReturnValue(createChainedQueryMock(cart, ["populate"]));
            getGeocodeFromAddressMock.mockResolvedValue({ coordinates: [121, 25] });
            haversineDistanceMock.mockReturnValueOnce(1000).mockReturnValueOnce(3000);
            calculateDeliveryFeeMock.mockReturnValue(50);

            const result = await calculateDeliveryFee("u9", "addr");

            expect(mocks.findOne).toHaveBeenCalledWith({ user: "u9" });
            expect(getGeocodeFromAddressMock).toHaveBeenCalledWith("addr");
            expect(haversineDistanceMock).toHaveBeenCalledTimes(2);
            expect(calculateDeliveryFeeMock).toHaveBeenCalledWith(2); // (1 km + 3 km) / 2
            expect(result).toEqual({ distance: 2, fee: 50 });
        });
    });
});
