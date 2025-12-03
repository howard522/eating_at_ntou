import type { CartItemUpdateBody, ICartItemResponse, ICartResponse } from "@server/interfaces/cart.interface";
import type { ObjectIdLike } from "@server/interfaces/common.interface";
import Cart from "@server/models/cart.model";
import { calculateDeliveryFeeByDistance } from "@server/utils/calcPrice";
import { haversineDistance } from "@server/utils/distance";
import { getGeocodeFromAddress } from "@server/utils/nominatim";
import { getRestaurantsByQuery } from "./restaurants.service";

async function findCartByUserId(userId: ObjectIdLike) {
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
export async function createCartForUser(userId: ObjectIdLike) {
    // WARNING: 可能會導致重複建立購物車
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
export async function getCartByUserId(userId: ObjectIdLike): Promise<ICartResponse> {
    const cart = await findCartByUserId(userId);

    const restaurantIds = Array.from(new Set(cart.items.map((item) => item.restaurantId.toString())));

    const restaurants = await getRestaurantsByQuery({
        _id: { $in: restaurantIds },
    });

    const restaurantMap = new Map(restaurants.map((r) => [r._id!.toString(), r]));

    // 組合成 ICartItemResponse 陣列
    const items: ICartItemResponse[] = cart.items.map((it) => {
        const restaurant = restaurantMap.get(it.restaurantId.toString());
        const menuItem = restaurant?.menu.find((mi) => mi._id!.toString() === it.menuItemId.toString());

        if (!restaurant || !menuItem) {
            console.warn(
                `Warning: Missing restaurant or menu item for cart item. Restaurant ID: ${it.restaurantId}, Menu Item ID: ${it.menuItemId}`
            );
        }

        // QUESTION: 被刪除的餐廳、菜單項目怎麼辦？

        return {
            restaurantId: it.restaurantId,
            menuItemId: it.menuItemId,
            restaurantName: restaurant?.name ?? "未知餐廳",

            // 優先使用最新的菜單資訊
            name: menuItem?.name ?? it.name,
            price: menuItem?.price ?? it.price,
            image: menuItem?.image ?? "",
            info: menuItem?.info ?? "",

            quantity: it.quantity,
            options: it.options,
        };
    });

    return {
        ...cart.toObject<ICartResponse>(),
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
export async function updateCartByUserId(userId: ObjectIdLike, items: CartItemUpdateBody["items"]) {
    // 允許清空購物車
    if (!items.length) {
        return await clearCartByUserId(userId);
    }

    // Upsert cart for user
    const cart = await findCartByUserId(userId);

    // if cart is locked, disallow modifications
    if (cart.status === "locked") {
        throw createError({
            statusCode: 423,
            statusMessage: "Locked",
            message: "Cart is locked and cannot be modified.",
        });
    }

    // WARNING: name, price 等資料可能已過時或遭到竄改（尚未處理）

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
export async function clearCartByUserId(userId: ObjectIdLike) {
    // QUESTION: 如果被 Locked (已送出訂單) 但還沒完成，是否允許清空購物車？

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
export async function calculateDeliveryFee(userId: ObjectIdLike, address: string) {
    const cart = await findCartByUserId(userId);

    if (!cart.items.length) {
        // 沒點東西想白給外送費嗎？
        return 0;
    }

    const location = await getGeocodeFromAddress(address);
    if (!location) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Failed to get geocode from address",
        });
    }

    // 取得所有相關餐廳資料
    const restaurantIds = Array.from(new Set(cart.items.map((item) => item.restaurantId.toString())));
    const restaurants = await getRestaurantsByQuery({
        _id: { $in: restaurantIds },
    });

    // 計算每個餐廳到使用者地址的距離，然後取平均值
    // 可能未來改成取最遠距離或其他規則
    let totalDistance = 0;
    restaurants.forEach((restaurant) => {
        const dis = haversineDistance(restaurant.locationGeo!.coordinates, location.coordinates);
        totalDistance += dis;

        console.log(`Distance from restaurant ${restaurant.name} to address: ${dis.toFixed(2)} meters`);
    });
    const avgDistance = totalDistance / cart.items.length / 1000; // 轉換為公里

    console.log(`Calculated average delivery distance: ${avgDistance.toFixed(2)} km`);

    const fee = calculateDeliveryFeeByDistance(avgDistance);

    return {
        distance: avgDistance,
        fee,
    };
}
