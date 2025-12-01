import type { ICartItem, ICartItemResponse, ICartResponse } from "@server/interfaces/cart.interface";
import type { IRestaurant } from "@server/interfaces/restaurant.interface";
import Cart from "@server/models/cart.model";
import { calculateDeliveryFeeByDistance } from "@server/utils/calcPrice";
import { haversineDistance } from "@server/utils/distance";
import { getGeocodeFromAddress } from "@server/utils/nominatim";
import type { ObjectId } from "mongoose";
import { getMenuItemById, getRestaurantById } from "./restaurants.service";

async function findCartByUserId(userId: string | ObjectId) {
    const cart = await Cart.findOne({ user: userId });

    // 沒有購物車就創建一個新的
    if (!cart) {
        // console.log("No cart found, creating a new one for user:", userId);
        return await createCartForUser(userId);
    }

    return cart;
}

/**
 * 為使用者建立新的購物車
 *
 * @param userId 使用者的 ID
 * @returns 新建立的購物車
 */
export async function createCartForUser(userId: string | ObjectId) {
    // FIXME: 可能會導致重複建立購物車
    // const existingCart = await findCartByUserId(userId);

    // if (existingCart) {
    //     throw new Error("Cart already exists for this user");
    // }

    const cart = new Cart({ user: userId, items: [] });
    await cart.save();

    return cart;
}

/**
 * 根據使用者 ID 獲取購物車
 *
 * @param userId 使用者的 ID
 * @returns 購物車
 */
export async function getCartByUserId(userId: string | ObjectId): Promise<ICartResponse | null> {
    const cart = await findCartByUserId(userId);

    const cartResponse: ICartResponse = {
        _id: cart._id.toString(),
        user: cart.user.toString(),
        items: [],
        currency: cart.currency,
        total: cart.total,
        status: cart.status,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
    };

    cartResponse.items = await Promise.all(
        cart.items.map(async (it) => {
            const item: ICartItemResponse = {
                restaurantId: it.restaurantId.toString(),
                menuItemId: it.menuItemId.toString(),
                restaurantName: "未知餐廳",
                name: it.name,
                price: it.price,
                image: "",
                info: "",
                quantity: it.quantity,
                options: it.options,
            };

            try {
                // 購物車資訊可能過時，嘗試從菜單取得最新資訊
                const menuItem = await getMenuItemById(it.restaurantId, it.menuItemId);
                const restaurant = menuItem.parent() as IRestaurant;

                item.restaurantName = restaurant.name;
                item.name = menuItem.name;
                item.price = menuItem.price;
                item.image = menuItem.image;
                item.info = menuItem.info;

                return item;
            } catch (error) {
                // 如果取得菜單失敗，仍然回傳基本資訊
                // TODO: 可能是已被刪除的菜單項目
                // TODO: 若餐廳已被下架，還要不要顯示這個項目？
                console.warn(`Failed to fetch menu item ${it.menuItemId} in restaurant ${it.restaurantId}:`, error);
                return item;
            }
        })
    );

    return cartResponse;
}

/**
 * 根據使用者 ID 更新購物車
 *
 * @param userId 使用者的 ID
 * @param items 購物車項目陣列
 * @returns 更新後的購物車
 */
export async function updateCartByUserId(userId: string | ObjectId, items: Partial<ICartItem>[]) {
    if (!items.length) {
        // return { success: false, message: 'items array required' }
        // 允許清空購物車 好耶 (2025/11/02)
        return await clearCartByUserId(userId);
    }

    // Upsert cart for user
    const cart = await findCartByUserId(userId);

    // if cart is locked, disallow modifications
    if (cart.status === "locked") {
        throw new Error("Cart is locked and cannot be modified");
    }
    // naive merge: replace items with provided
    cart.items.splice(0, cart.items.length); // 清空陣列
    cart.items.push(...items); // 新增新項目

    await cart.save();

    return cart;
}

/**
 * 根據使用者 ID 清空購物車
 *
 * @param userId 使用者的 ID
 * @returns 清空後的購物車
 */
export async function clearCartByUserId(userId: string | ObjectId) {
    const cart = await findCartByUserId(userId);

    cart.items.splice(0, cart.items.length); // 清空陣列
    cart.total = 0;
    cart.status = "open";

    await cart.save();

    return cart;
}

/**
 * 根據使用者 ID 計算外送費用
 *
 * @param userId 使用者的 ID
 * @param address 使用者的外送地址
 * @returns 外送費用
 */
export async function calculateDeliveryFee(userId: string | ObjectId, address: string) {
    const cart = await findCartByUserId(userId);

    if (!cart.items.length) {
        return 0; // 沒有項目，暫時回傳 0
        // throw new Error("Cart is empty, cannot calculate delivery fee");
    }

    const location = await getGeocodeFromAddress(address);
    if (!location) {
        throw new Error("Failed to get geocode from address");
    }

    let totalDistance = 0;
    for (const item of cart.items) {
        const restaurant = await getRestaurantById(item.restaurantId);
        if (!restaurant) {
            throw new Error(`Restaurant with ID ${item.restaurantId} not found`);
        }

        let dis = haversineDistance(restaurant.locationGeo!.coordinates, location.coordinates);

        totalDistance += dis;
    }

    // 使用平均距離來計算外送費用
    const avgDistance = totalDistance / cart.items.length / 1000; // 轉換為公里

    console.log(`Calculated average delivery distance: ${avgDistance.toFixed(2)} km`);

    return {
        distance: avgDistance,
        fee: calculateDeliveryFeeByDistance(avgDistance),
    };
}
