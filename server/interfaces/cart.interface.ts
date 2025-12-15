// server/interfaces/order.interface.ts

import type { ObjectIdLike, WithTimestamps } from "./common.interface";
import type { IRestaurant } from "./restaurant.interface";

export type CartStatus = "open" | "locked";

// --------------------
// 購物車商品
// --------------------

/**
 * 購物車商品介面
 */
export interface ICartItem {
    _id: ObjectIdLike;
    restaurantId: ObjectIdLike;
    menuItemId: ObjectIdLike;
    restaurant?: Pick<IRestaurant, "_id" | "name" | "menu" | "locationGeo">;
    name: string;
    price: number;
    quantity: number;
    options?: any; // QUESTION: 這是什麼？
}

/**
 * 用於回應的購物車商品介面
 */
export type ICartItemResponse = Omit<ICartItem, "restaurant"> & {
    restaurantName: string;
    image: string;
    info: string;
};

// --------------------
// 購物車
// --------------------

/**
 * 購物車介面
 */
export interface ICart extends WithTimestamps {
    _id: ObjectIdLike;
    user: ObjectIdLike;
    items: ICartItem[];
    currency: string;
    total: number;
    status: CartStatus;
}

/**
 * 用於回應的購物車介面
 */
export type ICartResponse = Omit<ICart, "items"> & {
    items: ICartItemResponse[];
};

// --------------------
// 購物車相關 DTO
// --------------------

export interface ICartUpdate {
    items: ICartItem[];
}
