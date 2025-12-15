// server/services/order.service.ts

import type { ObjectIdLike } from "@server/interfaces/common.interface";
import type { IOrder, OrderInfo, UpdateOrderStatusBody } from "@server/interfaces/order.interface";
import Cart from "@server/models/cart.model";
import Order from "@server/models/order.model";
import { haversineDistance } from "@server/utils/distance";
import type { FilterQuery } from "mongoose";
import { clearCartByUserId } from "./cart.service";
import { getRestaurantsByQuery } from "./restaurants.service";

/**
 * 判斷使用者是否為訂單的擁有者或外送員
 *
 * @param orderId 訂單 ID
 * @param userId 使用者 ID
 * @returns 回傳一個物件，包含 isOwner 和 isDeliveryPerson 布林值
 */
export async function getOrderOwnership(orderId: ObjectIdLike, userId: ObjectIdLike) {
    const order = await Order.findById(orderId).select("user deliveryPerson");

    if (!order)
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Order not found",
        });

    return {
        isOwner: String(order.user) === String(userId),
        isDeliveryPerson: order.deliveryPerson && String(order.deliveryPerson) === String(userId),
    };
}

/**
 * 取得訂單狀態
 *
 * @param orderId 訂單 ID
 * @returns 訂單的顧客狀態和外送員狀態
 */
export async function getOrderStatus(orderId: ObjectIdLike) {
    const order = await Order.findById(orderId).select("customerStatus deliveryStatus");

    if (!order)
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "Order not found",
        });

    return {
        customerStatus: order.customerStatus,
        deliveryStatus: order.deliveryStatus,
    };
}

/**
 * 建立新訂單
 *
 * @param userId 使用者 ID
 */
export async function createOrder(userId: ObjectIdLike, OrderInfo: OrderInfo) {
    const { deliveryInfo, arriveTime } = OrderInfo;

    const deliveryFee = Math.max(Number(OrderInfo.deliveryFee) || 0, 0);

    if (deliveryInfo.address) {
        try {
            const coords = await geocodeAddress(deliveryInfo.address);
            if (coords) {
                deliveryInfo.location = { lat: coords.lat, lng: coords.lon };
            }
        } catch (err) {
            console.warn("Failed to geocode delivery address", deliveryInfo.address, err);
        }
    }

    const cart = await Cart.findOne({ user: userId }).populate(
        "items.restaurantId",
        "name phone menu address locationGeo"
    );
    if (!cart || cart.items.length === 0) {
        throw createError({ statusCode: 400, message: "購物車為空，無法建立訂單" });
    }

    if (cart.status !== "open") {
        throw createError({ statusCode: 400, message: "購物車狀態不正確，無法建立訂單" });
    }

    const restaurantGeoCache = new Map<string, { lat: number; lng: number }>();
    const detailedItems = await Promise.all(
        cart.items.map(async (it: any) => {
            const restaurant = it.restaurantId;
            const menuItem = restaurant?.menu?.find((m: any) => String(m._id) === String(it.menuItemId));
            let restaurantLocation: { lat: number; lng: number } | null = null;
            const cacheKey = restaurant?._id?.toString() || restaurant?.address;
            if (cacheKey && restaurantGeoCache.has(cacheKey)) {
                restaurantLocation = restaurantGeoCache.get(cacheKey) || null;
            } else {
                if (
                    Array.isArray(restaurant?.locationGeo?.coordinates) &&
                    restaurant.locationGeo.coordinates.length === 2
                ) {
                    const [lon, lat] = restaurant.locationGeo.coordinates;
                    restaurantLocation = { lat, lng: lon };
                } else if (restaurant?.address) {
                    try {
                        const coords = await geocodeAddress(restaurant.address);
                        if (coords) {
                            restaurantLocation = { lat: coords.lat, lng: coords.lon };
                        }
                    } catch (err) {
                        console.warn("Failed to geocode restaurant address", restaurant?.address, err);
                    }
                }

                if (cacheKey && restaurantLocation) {
                    restaurantGeoCache.set(cacheKey, restaurantLocation);
                }
            }

            return {
                menuItemId: it.menuItemId,
                name: menuItem?.name || it.name,
                image: menuItem?.image || null,
                info: menuItem?.info || null,
                price: menuItem?.price || it.price,
                quantity: it.quantity,
                restaurant: {
                    id: restaurant?._id,
                    name: restaurant?.name || "(未知餐廳)",
                    phone: restaurant?.phone || "",
                    address: restaurant?.address || "",
                    location: restaurantLocation || undefined,
                },
            };
        })
    );

    const newOrder = new Order({
        user: userId,
        items: detailedItems,
        total: cart.total + deliveryFee,
        deliveryFee,
        arriveTime,
        currency: cart.currency,
        deliveryInfo,
    });

    await newOrder.save();

    // 鎖定購物車，防止重複下單
    cart.status = "locked";
    await cart.save();
    // 清空使用者購物車
    await clearCartByUserId(userId);

    return newOrder;
}

export async function getOrderById(orderId: ObjectIdLike) {
    // OPTIMIZE: 待整理

    // 將外送員回傳必要欄位：name, img, phone
    const order = await Order.findById(orderId)
        .populate("user", "name img email")
        .populate("deliveryPerson", "name img phone")
        .populate("items.restaurant.id", "locationGeo")
        .lean();
    // items.restaurant.phone 已存為 snapshot，無需額外 populate

    if (!order) throw createError({ statusCode: 404, statusMessage: "Order not found" });

    // 補上餐廳經緯度
    if (order.items) {
        order.items.forEach((item) => {
            if (
                item.restaurant &&
                item.restaurant.id &&
                item.restaurant.id.locationGeo &&
                item.restaurant.id.locationGeo.coordinates
            ) {
                const [lng, lat] = item.restaurant.id.locationGeo.coordinates;
                item.restaurant.location = { lat, lng };
                item.restaurant.id = item.restaurant.id._id;
            }
        });
    }

    // 正規化 deliveryPerson：考慮可能為 null（尚未被外送員接單）或未被 populate
    try {
        if (order.deliveryPerson) {
            // 若為 populated object，取必要欄位；若僅為 id（未 populate），只回傳 id
            const dp: any = order.deliveryPerson;
            order.deliveryPerson = {
                _id: dp._id || dp,
                name: dp.name || null,
                img: dp.img || "",
                phone: dp.phone || "",
            };
        } else {
            order.deliveryPerson = null;
        }
    } catch (e) {
        // 若任何情況發生錯誤，保險起見設為 null
        order.deliveryPerson = null;
    }

    // restaurant phone 已在 order.snapshot (items[].restaurant.phone)，不需額外處理

    return order;
}

/**
 * 根據使用者角色獲取訂單列表
 *
 * @param userId 使用者的 MongoDB ObjectId
 * @param role 使用者角色 ("customer" 或 "delivery")
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @returns 符合條件的訂單列表
 */
export async function getOrdersByUserRole(
    userId: ObjectIdLike,
    role: "customer" | "delivery",
    options?: { limit?: number; skip?: number }
): Promise<IOrder[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;

    const query: FilterQuery<IOrder> = {};
    if (role === "customer") {
        query.user = userId;
    } else if (role === "delivery") {
        query.deliveryPerson = userId;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);

    // for (let i = 0; i < orders.length; i++) {
    //     orders[i]?.items.forEach((item, j) => {
    //         const menu = getMenuItemById(
    //             item
    //         )
    //         orders[i]?.items[j]?.menuItemId;
    //         item.tot = item.quantity * item.unitPrice;
    //         orders[i].items[j] = item;
    //     });
    // }

    return orders;
}

/**
 * 取得外送員可接的訂單列表
 *
 * @param lat 外送員當前緯度（可選）
 * @param lon 外送員當前經度（可選）
 * @param keyword 關鍵字搜尋（可選）
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @param options.orderBy 排序欄位（預設 createdAt）
 * @param options.order 排序方式（asc 或 desc，預設 desc）
 * @returns 符合條件的訂單列表
 */
export async function getAvailableOrdersForDeliveryPerson(
    lat?: number,
    lon?: number,
    keyword?: string,
    options?: {
        limit?: number;
        skip?: number;
        sortBy?: "createdAt" | "deliveryFee" | "arriveTime" | "distance";
        order?: "asc" | "desc";
    }
) {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;
    const sortBy = options?.sortBy ?? "createdAt";
    const order = (options?.order ?? "desc") === "asc" ? 1 : -1;

    // // 查詢尚未接單的訂單（支援 skip / limit）
    // const orders = await Order.find({
    //     deliveryPerson: null,
    //     deliveryStatus: 'preparing'
    // })
    //     .sort({ createdAt: -1 })
    //     .skip(skip)
    //     .limit(limit)
    //     .lean()

    // 可接的訂單：
    const filter: FilterQuery<IOrder> = {
        deliveryPerson: null,
        deliveryStatus: "preparing",
    };

    // 若有關鍵字，先找出符合餐廳，再用餐廳 ID 過濾訂單
    if (keyword) {
        const matched = await getRestaurantsByQuery({ name: { $regex: keyword, $options: "i" } });

        const restaurantIds = matched.map((r) => r._id.toString());

        if (restaurantIds.length === 0) {
            return [];
        }

        filter["items.restaurant.id"] = { $in: restaurantIds };
    }

    let orders = await Order.find(filter)
        .populate("items.restaurant.id", "name locationGeo phone address")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

    // 若有經緯度，計算外送員與餐廳的距離
    const distance: Map<ObjectIdLike, number> = new Map();
    if (lat && lon) {
        const userPos: [number, number] = [lon, lat];

        // 使用到每間餐廳的距離平均值作為訂單距離
        orders.forEach((order) => {
            let dis_sum = 0;
            order.items.forEach((item) => {
                const restaurant = item.restaurant?.id;
                const coord = restaurant?.locationGeo?.coordinates;
                if (coord) {
                    let dis = haversineDistance(userPos, coord);
                    dis_sum += dis;
                }
            });
            distance.set(order._id, dis_sum / order.items.length);
        });
    }

    // 排序
    orders.sort((a, b) => {
        switch (sortBy) {
            case "deliveryFee":
                return order * ((a.deliveryFee || 0) - (b.deliveryFee || 0));
            case "arriveTime":
                return order * (new Date(a.arriveTime!).getTime() - new Date(b.arriveTime!).getTime());
            case "distance":
                return order * ((distance.get(a._id) ?? Infinity) - (distance.get(b._id) ?? Infinity) || 0);
            case "createdAt":
            default:
                return order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
    });

    return orders;

    // 現在功能是完整的了，但我覺得現在的距離處理有效能疑慮，
    // 因為是先抓訂單再算距離，若訂單量大時會很慢，
    // 不過有分頁應該還好，一頁就最多 100 筆訂單。
}

/**
 * 取得管理員用的訂單列表
 *
 * @param orderId 根據訂單 ID 查詢
 * @param options.completed 訂單是否完成
 * @param options.from 起始日期
 * @param options.to 結束日期
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @param options.sortBy 排序欄位（預設 createdAt）
 * @param options.order 排序方式（asc 或 desc，預設 desc）
 * @returns 符合條件的訂單列表
 */
export async function getOrdersForAdmin(
    orderId?: ObjectIdLike,
    options?: {
        completed?: boolean;
        from?: Date;
        to?: Date;
        limit?: number;
        skip?: number;
        sortBy?: "createdAt" | "total" | "deliveryFee";
        order?: "asc" | "desc";
    }
) {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;
    const sortBy = options?.sortBy ?? "createdAt";
    const order = (options?.order ?? "desc") === "asc" ? 1 : -1;

    const filter: FilterQuery<IOrder> = {};

    if (orderId) {
        filter._id = orderId;
    }

    if (options?.completed !== undefined) {
        const completed = !!options.completed; // 強制轉布林值

        if (completed) {
            filter.$and = [{ customerStatus: "completed" }, { deliveryStatus: "completed" }];
        } else {
            filter.$or = [{ customerStatus: { $ne: "completed" } }, { deliveryStatus: { $ne: "completed" } }];
        }
    }

    // 日期區間查詢
    if (options?.from || options?.to) {
        filter.createdAt = {};
        if (options?.from) {
            filter.createdAt.$gte = options.from;
        }
        if (options?.to) {
            filter.createdAt.$lte = options.to;
        }
    }

    let orders = await Order.find(filter)
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit)
        .populate("user", "name img email")
        .populate("deliveryPerson", "name img phone")
        .lean();

    // 整理 deliveryPerson 格式
    orders = orders.map((order) => {
        const o = order;
        try {
            if (o.deliveryPerson) {
                const dp: any = o.deliveryPerson;
                o.deliveryPerson = {
                    _id: dp._id || dp,
                    name: dp.name || null,
                    img: dp.img || "",
                    phone: dp.phone || "",
                };
            } else {
                o.deliveryPerson = null;
            }
        } catch (e) {
            o.deliveryPerson = null;
        }
        return o;
    });

    return orders;
}

/**
 * 更新訂單的外送員
 *
 * @param orderId 訂單 ID
 * @param deliveryPersonId 外送員 ID
 * @returns 更新後的訂單
 */
export async function updateOrderDeliveryPerson(orderId: ObjectIdLike, deliveryPersonId: ObjectIdLike) {
    const order = await Order.findById(orderId);

    if (!order) throw createError({ statusCode: 404, statusMessage: "Order not found" });

    if (order.deliveryPerson) {
        throw createError({ statusCode: 409, message: "Order already accepted" });
    }

    order.deliveryPerson = deliveryPersonId;
    order.deliveryStatus = "on_the_way";

    await order.save();

    // populate deliveryPerson so API 回傳格式與其他 endpoint 一致（含 name/img/phone）
    try {
        await order.populate("deliveryPerson", "name img phone");
    } catch (e) {
        // ignore populate errors
    }

    return order;
}

/**
 * 更新訂單狀態
 *
 * @param orderId 訂單 ID
 * @param status 訂單狀態更新物件
 * @returns 更新後的訂單
 */
export async function updateOrderStatusById(orderId: ObjectIdLike, status: UpdateOrderStatusBody) {
    const order = await Order.findById(orderId);

    if (!order) throw createError({ statusCode: 404, statusMessage: "Order not found" });

    // 更新狀態
    if (status.customerStatus) order.customerStatus = status.customerStatus;
    if (status.deliveryStatus) order.deliveryStatus = status.deliveryStatus;
    // 自動完成訂單
    const isCustomerDone = ["received", "completed"].includes(order.customerStatus);
    const isDeliveryDone = ["delivered", "completed"].includes(order.deliveryStatus);

    if (isCustomerDone && isDeliveryDone) {
        order.customerStatus = "completed";
        order.deliveryStatus = "completed";
    }

    await order.save();

    // 若有外送員，populate deliveryPerson 以回傳 name/img/phone（與其他 endpoint 保持一致）
    try {
        if (order.deliveryPerson) await order.populate("deliveryPerson", "name img phone");
    } catch (e) {
        // ignore
    }

    return order;
}
