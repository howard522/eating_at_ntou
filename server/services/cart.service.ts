// server/services/cart.service.ts

import type { ICart, ICartResponse, ICartUpdate } from "$interfaces/cart.interface";
import type { ObjectIdLike } from "$interfaces/common.interface";
import Cart from "$models/cart.model";
import { calculateDeliveryFeeByDistance } from "$utils/calcPrice";
import { haversineDistance } from "$utils/distance";
import { omit } from "lodash-es";

/**
 * 建立新的購物車
 *
 * @param userId 使用者的 ID
 * @returns 新建立的購物車
 */
async function createCart(userId: ObjectIdLike) {
    const cart = new Cart({ user: userId, items: [] });
    await cart.save();

    return cart;
}

/**
 * 根據使用者 ID 獲取購物車文件
 *
 * @param userId 使用者的 ID
 * @returns 購物車文件
 */
async function findOrCreateCartDocByUserId(userId: ObjectIdLike) {
    const cart = await Cart.findOne({ user: userId })
        // .populate("user", "img name email") // 可能不需要
        .populate("items.restaurant", "name menu locationGeo");

    // 沒有購物車就創建一個新的
    if (!cart) {
        // console.log("No cart found, creating a new one for user:", userId);
        return createCart(userId);
    }

    return cart;
}

/**
 * 為使用者建立新的購物車
 *
 * @param userId 使用者的 ID
 * @returns 新建立的購物車
 */
export async function createCartForUser(userId: ObjectIdLike) {
    // 避免重複建立購物車
    const existingCart = await Cart.findOne({ user: userId });

    if (existingCart) {
        throw createError({
            statusCode: 409,
            statusMessage: "Conflict",
            message: "Cart already exists for this user.",
        });
    }

    const cart = await createCart(userId);

    return cart.toObject<ICart>();
}

/**
 * 根據使用者 ID 獲取購物車
 *
 * @param userId 使用者的 ID
 * @returns 購物車
 */
export async function getCartByUserId(userId: ObjectIdLike): Promise<ICartResponse> {
    const cart = (await findOrCreateCartDocByUserId(userId)).toObject<ICart>();

    // 組合成 ICartItemResponse 陣列
    const items = cart.items.map((it) => {
        const restaurant = it.restaurant;
        const menuItem = it.restaurant?.menu.find((mi) => String(mi._id) === String(it.menuItemId));

        if (!restaurant || !menuItem) {
            console.warn(
                `Warning: Missing restaurant or menu item for cart item. Restaurant ID: ${it.restaurantId}, Menu Item ID: ${it.menuItemId}`
            );
        }

        // QUESTION: 被刪除的餐廳、菜單項目怎麼辦？

        return {
            ...omit(it, ["restaurant"]), // 移除 mongoose virtual 屬性
            restaurantName: restaurant?.name ?? "未知餐廳",

            // 優先使用最新的菜單資訊
            name: menuItem?.name ?? it.name,
            price: menuItem?.price ?? it.price,
            image: menuItem?.image ?? "",
            info: menuItem?.info ?? "",
        };
    });

    return {
        ...cart,
        items,
    };
}

/**
 * 根據使用者 ID 更新購物車
 *
 * @param userId 使用者的 ID
 * @param items 購物車項目陣列
 * @returns 更新後的購物車
 */
export async function updateCartByUserId(userId: ObjectIdLike, items: ICartUpdate["items"]) {
    // 允許清空購物車
    if (!items.length) {
        return await clearCartByUserId(userId);
    }

    // 取得購物車（不存在就建立）
    const cart = await findOrCreateCartDocByUserId(userId);

    // 如果 cart 被鎖定，拒絕修改
    if (cart.status === "locked") {
        throw createError({
            statusCode: 423,
            statusMessage: "Locked",
            message: "Cart is locked and cannot be modified.",
        });
    }

    // WARNING: name, price 等資料可能已過時或遭到竄改（尚未處理）

    // naive merge: replace items with provided
    cart.items = items as any; // TODO: type casting

    await cart.save();

    return cart;
}

/**
 * 根據使用者 ID 清空購物車
 *
 * @param userId 使用者的 ID
 * @returns 清空後的購物車
 */
export async function clearCartByUserId(userId: ObjectIdLike) {
    // QUESTION: 如果被 Locked (已送出訂單) 但還沒完成，是否允許清空購物車？

    const cart = await findOrCreateCartDocByUserId(userId);

    cart.items.splice(0, cart.items.length); // 清空陣列
    cart.total = 0;
    cart.status = "open";

    await cart.save();

    return cart;
}

/**
 * 根據顧客位置與餐廳位置陣列計算外送費用
 *
 * @param customer 顧客的經緯度 [longitude, latitude]
 * @param restaurants 餐廳的經緯度陣列 [longitude, latitude][]
 * @returns 外送費用與平均距離 (公里)
 */
export function calculateDeliveryFee(customer: [number, number], restaurants: [number, number][]) {
    if (!restaurants.length) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "At least one restaurant coordinate is required to calculate delivery fee",
        });
    }

    // 計算每個餐廳到使用者地址的距離，然後加起來
    const totalDistance = restaurants.reduce((distanceSum, restaurantCoords) => {
        const distance = haversineDistance(restaurantCoords, customer);
        return distanceSum + distance;
    }, 0);

    const avgDistance = totalDistance / 1000; // 轉換為公里

    console.log(`Calculated average delivery distance: ${avgDistance.toFixed(2)} km`);

    const fee = calculateDeliveryFeeByDistance(avgDistance);

    return {
        distance: avgDistance,
        fee,
    };
}
