import Cart from "@server/models/cart.model";
import { getMenuItemById } from "./restaurants.service";
import type { ObjectId } from "mongoose";
import type { ICartResponse, ICartItem, ICartItemResponse } from "@server/interfaces/cart.interface";
import type { IRestaurant } from "@server/interfaces/restaurant.interface";

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
