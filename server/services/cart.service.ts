import Cart from "@server/models/cart.model";
import { getMenuItemById } from "./restaurants.service";
import type { ObjectId } from "mongoose";
import type { ICartResponse, ICartItemResponse } from "@server/interfaces/cart.interface";
import type { IRestaurant } from "@server/interfaces/restaurant.interface";

async function fineCartByUserId(userId: string | ObjectId) {
    const cart = await Cart.findOne({ user: userId });

    return cart;
}

/**
 * 根據使用者 ID 獲取購物車
 *
 * @param userId - 使用者的 ID
 * @returns 購物車
 */
export async function getCartByUserId(userId: string | ObjectId): Promise<ICartResponse | null> {
    const cart = await fineCartByUserId(userId);

    if (!cart) {
        return null;
    }

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
            const menuItem = await getMenuItemById(it.restaurantId, it.menuItemId);

            const item: ICartItemResponse = {
                restaurantId: it.restaurantId.toString(),
                menuItemId: it.menuItemId.toString(),
                name: it.name,
                price: it.price,
                quantity: it.quantity,
                options: it.options,
            };

            if (!menuItem) {
                console.warn(`Menu item not found: restaurantId=${it.restaurantId}, menuItemId=${it.menuItemId}`);
                item.restaurantName = "未知餐廳";
            }

            const restaurant = menuItem.parent() as IRestaurant;

            item.restaurantName = restaurant.name;
            item.name = menuItem.name;
            item.price = menuItem.price;
            item.image = menuItem.image;
            item.info = menuItem.info;

            return item;
        })
    );

    return cartResponse;
}

// export async function createCart(userId: string, currency: string) {
//     const cart = new Cart({
//         user: userId,
//         items: [],
//         currency,
//         total: 0,
//         status: "open",
//     });

export async function clearCartByUserId(userId: string | ObjectId) {
    const cart = await fineCartByUserId(userId);

    if (!cart) {
        return null;
    }

    cart.items.splice(0, cart.items.length); // 清空陣列
    cart.total = 0;
    cart.status = "open";

    await cart.save();

    return cart;
}
