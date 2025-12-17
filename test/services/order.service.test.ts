// test/services/order.service.test.ts

import Order from "@server/models/order.model";
import {
    createOrder,
    getAvailableOrdersForDeliveryPerson,
    getOrderById,
    getOrderOwnership,
    getOrderStatus,
    getOrdersByUserRole,
    getOrdersForAdmin,
    updateOrderDeliveryPerson,
    updateOrderStatusById,
} from "@server/services/order.service";
import { haversineDistanceMock, mockDistanceUtils } from "@test/__mocks__/utils/distance.mock";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

const mocks = vi.hoisted(() => {
    return {
        findByIdMock: vi.fn(),
        findMock: vi.fn(),
        orderSaveMock: vi.fn(),
        orderPopulateMock: vi.fn(),
        orderInstances: [] as any[],
        cartFindOneMock: vi.fn(),
        cartSaveMock: vi.fn(),
        clearCartByUserIdMock: vi.fn(),
        geocodeMock: vi.fn(),
        getRestaurantsByQueryMock: vi.fn(),
    };
});

vi.mock("@server/models/order.model", () => {
    class OrderMock {
        save = mocks.orderSaveMock;
        populate = mocks.orderPopulateMock;
        constructor(data: any) {
            Object.assign(this, data);
            mocks.orderInstances.push(this);
        }
        static findById = mocks.findByIdMock;
        static find = mocks.findMock;
    }
    return { default: OrderMock };
});

vi.mock("@server/models/cart.model", () => ({
    default: {
        findOne: mocks.cartFindOneMock,
    },
}));

vi.mock("./cart.service", () => ({
    clearCartByUserId: mocks.clearCartByUserIdMock,
}));

vi.mock("./restaurants.service", () => ({
    getRestaurantsByQuery: mocks.getRestaurantsByQueryMock,
}));

mockDistanceUtils();

beforeAll(() => {
    vi.stubGlobal("geocodeAddress", mocks.geocodeMock);
});

beforeEach(() => {
    mocks.orderInstances.length = 0;
});

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("Order Service - getOrderOwnership", () => {
    it("應正確判斷使用者是訂單擁有者", async () => {
        const mockOrder = {
            user: "user123",
            deliveryPerson: "delivery456",
        };

        const mockSelect = vi.fn().mockResolvedValue(mockOrder);
        (Order.findById as any).mockReturnValue({
            select: mockSelect,
        });

        const result = await getOrderOwnership("order123", "user123");

        expect(Order.findById).toHaveBeenCalledWith("order123");
        expect(result.isOwner).toBe(true);
        expect(result.isDeliveryPerson).toBe(false);
    });

    it("應正確判斷使用者是外送員", async () => {
        const mockOrder = {
            user: "user123",
            deliveryPerson: "delivery456",
        };

        const mockSelect = vi.fn().mockResolvedValue(mockOrder);
        (Order.findById as any).mockReturnValue({
            select: mockSelect,
        });

        const result = await getOrderOwnership("order123", "delivery456");

        expect(result.isOwner).toBe(false);
        expect(result.isDeliveryPerson).toBe(true);
    });

    it("當訂單不存在時應拋出錯誤", async () => {
        const mockSelect = vi.fn().mockResolvedValue(null);
        (Order.findById as any).mockReturnValue({
            select: mockSelect,
        });

        await expect(getOrderOwnership("order999", "user123")).rejects.toHaveProperty("statusCode", 404);
    });
});

describe("Order Service - getOrderStatus", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("應回傳訂單的顧客與外送狀態", async () => {
        const mockOrder = { customerStatus: "pending", deliveryStatus: "preparing" };
        const mockSelect = vi.fn().mockResolvedValue(mockOrder);
        mocks.findByIdMock.mockReturnValue({ select: mockSelect });

        const result = await getOrderStatus("order123");

        expect(mocks.findByIdMock).toHaveBeenCalledWith("order123");
        expect(result).toEqual(mockOrder);
    });

    it("找不到訂單時應丟出 404", async () => {
        const mockSelect = vi.fn().mockResolvedValue(null);
        mocks.findByIdMock.mockReturnValue({ select: mockSelect });

        await expect(getOrderStatus("not-exist")).rejects.toHaveProperty("statusCode", 404);
    });
});

describe("Order Service - updateOrderDeliveryPerson", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("應設定外送員並更新狀態", async () => {
        const saveMock = vi.fn().mockResolvedValue(undefined);
        const populateMock = vi.fn().mockResolvedValue(undefined);
        const order = {
            deliveryPerson: null,
            deliveryStatus: "preparing",
            save: saveMock,
            populate: populateMock,
        } as any;
        mocks.findByIdMock.mockResolvedValue(order);

        const result = await updateOrderDeliveryPerson("order-1", "delivery-1");

        expect(mocks.findByIdMock).toHaveBeenCalledWith("order-1");
        expect(order.deliveryPerson).toBe("delivery-1");
        expect(order.deliveryStatus).toBe("on_the_way");
        expect(saveMock).toHaveBeenCalled();
        expect(populateMock).toHaveBeenCalledWith("deliveryPerson", "name img phone");
        expect(result).toBe(order);
    });

    it("已有外送員時應拋出 409", async () => {
        const order = { deliveryPerson: "someone" } as any;
        mocks.findByIdMock.mockResolvedValue(order);

        await expect(updateOrderDeliveryPerson("order-1", "delivery-1")).rejects.toHaveProperty("statusCode", 409);
    });

    it("找不到訂單時應拋出 404", async () => {
        mocks.findByIdMock.mockResolvedValue(null);

        await expect(updateOrderDeliveryPerson("missing", "delivery-1")).rejects.toHaveProperty("statusCode", 404);
    });
});

describe("Order Service - updateOrderStatusById", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("應更新訂單狀態並自動完成", async () => {
        const saveMock = vi.fn().mockResolvedValue(undefined);
        const populateMock = vi.fn().mockResolvedValue(undefined);
        const order = {
            customerStatus: "preparing",
            deliveryStatus: "preparing",
            deliveryPerson: "dp-1",
            save: saveMock,
            populate: populateMock,
        } as any;
        mocks.findByIdMock.mockResolvedValue(order);

        const result = await updateOrderStatusById("order-2", {
            customerStatus: "received",
            deliveryStatus: "delivered",
        });

        expect(order.customerStatus).toBe("completed");
        expect(order.deliveryStatus).toBe("completed");
        expect(saveMock).toHaveBeenCalled();
        expect(populateMock).toHaveBeenCalledWith("deliveryPerson", "name img phone");
        expect(result).toBe(order);
    });

    it("找不到訂單時應拋出 404", async () => {
        mocks.findByIdMock.mockResolvedValue(null);

        await expect(updateOrderStatusById("missing", {})).rejects.toHaveProperty("statusCode", 404);
    });
});

describe("Order Service - getOrdersByUserRole", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("客戶角色時應以 user 查詢並套用分頁", async () => {
        const orders = [{ id: 1 }];
        const skipMock = vi.fn().mockResolvedValue(orders);
        const limitMock = vi.fn().mockReturnValue({ skip: skipMock });
        const sortMock = vi.fn().mockReturnValue({ limit: limitMock, skip: skipMock });
        mocks.findMock.mockReturnValue({ sort: sortMock });

        const result = await getOrdersByUserRole("user-1", "customer", { limit: 10, skip: 5 });

        expect(mocks.findMock).toHaveBeenCalledWith({ user: "user-1" });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(limitMock).toHaveBeenCalledWith(10);
        expect(skipMock).toHaveBeenCalledWith(5);
        expect(result).toBe(orders);
    });

    it("外送員角色時應以 deliveryPerson 查詢", async () => {
        const orders = [{ id: 2 }];
        const skipMock = vi.fn().mockResolvedValue(orders);
        const limitMock = vi.fn().mockReturnValue({ skip: skipMock });
        const sortMock = vi.fn().mockReturnValue({ limit: limitMock, skip: skipMock });
        mocks.findMock.mockReturnValue({ sort: sortMock });

        const result = await getOrdersByUserRole("dp-1", "delivery");

        expect(mocks.findMock).toHaveBeenCalledWith({ deliveryPerson: "dp-1" });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toBe(orders);
    });
});

describe("Order Service - createOrder", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("應建立訂單並鎖定購物車", async () => {
        const cart = {
            user: "user-1",
            items: [
                {
                    menuItemId: "menu-1",
                    name: "Backup Name",
                    price: 50,
                    quantity: 2,
                    restaurantId: {
                        _id: "rest-1",
                        name: "Test Restaurant",
                        phone: "0900",
                        address: "rest addr",
                        locationGeo: { coordinates: [121.1, 25.1] },
                        menu: [
                            {
                                _id: "menu-1",
                                name: "Burger",
                                price: 80,
                            },
                        ],
                    },
                },
            ],
            status: "open",
            total: 160,
            currency: "TWD",
            save: mocks.cartSaveMock,
        } as any;

        mocks.cartFindOneMock.mockReturnValue({ populate: vi.fn().mockResolvedValue(cart) });
        mocks.geocodeMock.mockResolvedValue({ lat: 25.05, lon: 121.5 });
        mocks.orderSaveMock.mockResolvedValue(undefined);
        mocks.orderPopulateMock.mockResolvedValue(undefined);
        mocks.cartSaveMock.mockResolvedValue(undefined);
        mocks.clearCartByUserIdMock.mockResolvedValue(undefined);

        const payload = {
            deliveryInfo: { address: "customer addr" },
            arriveTime: new Date(),
            deliveryFee: 40,
        } as any;

        const result = await createOrder("user-1", payload);

        expect(mocks.cartFindOneMock).toHaveBeenCalledWith({ user: "user-1" });
        expect(mocks.geocodeMock).toHaveBeenCalledWith("customer addr");
        expect(mocks.orderSaveMock).toHaveBeenCalled();
        expect(mocks.cartSaveMock).toHaveBeenCalled();
        expect(mocks.clearCartByUserIdMock).toHaveBeenCalledWith("user-1");
        expect(mocks.orderInstances).toHaveLength(1);
        const created = mocks.orderInstances[0];
        expect(created.total).toBe(cart.total + 40);
        expect(created.items[0].restaurant.location).toEqual({ lat: 25.1, lng: 121.1 });
        expect(result).toBe(created);
        expect(cart.status).toBe("locked");
    });

    it("購物車為空時應拋出錯誤", async () => {
        mocks.cartFindOneMock.mockReturnValue({ populate: vi.fn().mockResolvedValue({ items: [] }) });

        await expect(createOrder("user-1", { deliveryInfo: {}, arriveTime: new Date() } as any)).rejects.toHaveProperty(
            "statusCode",
            400
        );
    });

    it("購物車非開放狀態時應拋出錯誤", async () => {
        mocks.cartFindOneMock.mockReturnValue({
            populate: vi.fn().mockResolvedValue({ items: [{}], status: "locked" }),
        } as any);

        await expect(createOrder("user-1", { deliveryInfo: {}, arriveTime: new Date() } as any)).rejects.toHaveProperty(
            "statusCode",
            400
        );
    });
});

describe("Order Service - getOrderById", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("應補齊餐廳座標並格式化外送員", async () => {
        const orderDoc = {
            _id: "order-1",
            items: [
                {
                    restaurant: {
                        id: {
                            _id: "rest-1",
                            locationGeo: { coordinates: [121.2, 25.2] },
                        },
                        phone: "0900",
                    },
                },
            ],
            deliveryPerson: { _id: "dp-1", name: "Alex", phone: "0999", img: "img.png" },
        } as any;

        const populateRestaurant = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(orderDoc) });
        const populateDelivery = vi.fn().mockReturnValue({ populate: populateRestaurant });
        const populateUser = vi.fn().mockReturnValue({ populate: populateDelivery });
        mocks.findByIdMock.mockReturnValue({ populate: populateUser });

        const result = await getOrderById("order-1");

        expect(mocks.findByIdMock).toHaveBeenCalledWith("order-1");
        expect(populateUser).toHaveBeenCalledWith("user", "name img email");
        expect(result.items[0].restaurant.location).toEqual({ lat: 25.2, lng: 121.2 });
        expect(result.items[0].restaurant.id).toBe("rest-1");
        expect(result.deliveryPerson).toEqual({ _id: "dp-1", name: "Alex", phone: "0999", img: "img.png" });
    });
});

describe("Order Service - getAvailableOrdersForDeliveryPerson", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("應依關鍵字與距離排序回傳可接訂單", async () => {
        const orders = [
            {
                _id: "order-1",
                deliveryFee: 10,
                arriveTime: new Date("2024-01-02"),
                createdAt: new Date("2024-01-02"),
                items: [
                    {
                        restaurant: { id: { locationGeo: { coordinates: [121.3, 25.3] } } },
                    },
                ],
            },
            {
                _id: "order-2",
                deliveryFee: 20,
                arriveTime: new Date("2024-01-03"),
                createdAt: new Date("2024-01-01"),
                items: [
                    {
                        restaurant: { id: { locationGeo: { coordinates: [121.4, 25.4] } } },
                    },
                ],
            },
        ] as any;

        mocks.getRestaurantsByQueryMock.mockResolvedValue([{ _id: "rest-1" }]);
        const skip = vi.fn().mockResolvedValue(orders);
        const limit = vi.fn().mockReturnValue({ skip });
        const sort = vi.fn().mockReturnValue({ limit });
        const populate = vi.fn().mockReturnValue({ sort });
        mocks.findMock.mockReturnValue({ populate });
        haversineDistanceMock.mockReturnValueOnce(5).mockReturnValueOnce(10);

        const result = await getAvailableOrdersForDeliveryPerson(25, 121, "keyword", {
            sortBy: "distance",
            order: "asc",
        });

        expect(mocks.getRestaurantsByQueryMock).toHaveBeenCalled();
        expect(mocks.findMock).toHaveBeenCalledWith({
            deliveryPerson: null,
            deliveryStatus: "preparing",
            "items.restaurant.id": { $in: ["rest-1"] },
        });
        expect(populate).toHaveBeenCalledWith("items.restaurant.id", "name locationGeo phone address");
        expect(haversineDistanceMock).toHaveBeenCalledTimes(2);
        expect(result.map((o: any) => o._id)).toEqual(["order-1", "order-2"]);
    });
});

describe("Order Service - getOrdersForAdmin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.orderInstances.length = 0;
    });

    it("應依條件查詢並格式化外送員資訊", async () => {
        const orders = [
            {
                _id: "order-1",
                deliveryPerson: { _id: "dp-1", name: "Alex", img: "img", phone: "0900" },
                createdAt: new Date("2024-01-01"),
            },
        ];

        const populate2 = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(orders) });
        const populate1 = vi.fn().mockReturnValue({ populate: populate2 });
        const limit = vi.fn().mockReturnValue({ populate: populate1 });
        const skip = vi.fn().mockReturnValue({ limit });
        const sort = vi.fn().mockReturnValue({ skip });
        mocks.findMock.mockReturnValue({ sort });

        const result = await getOrdersForAdmin("order-1", { completed: true, limit: 10, skip: 5, order: "asc" });

        expect(mocks.findMock).toHaveBeenCalledWith({
            _id: "order-1",
            $and: [{ customerStatus: "completed" }, { deliveryStatus: "completed" }],
        });
        expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
        expect(skip).toHaveBeenCalledWith(5);
        expect(limit).toHaveBeenCalledWith(10);
        expect(populate1).toHaveBeenCalledWith("user", "name img email");
        expect(result[0].deliveryPerson).toEqual({ _id: "dp-1", name: "Alex", img: "img", phone: "0900" });
    });
});

afterAll(() => {
    vi.unstubAllGlobals();
});
