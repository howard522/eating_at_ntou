// server/interfaces/order.interface.ts

import type { Mixed } from "mongoose";
import type { ObjectIdLike, UpdateBody } from "./common.interface";

export type CartStatus = "open" | "locked";

// --------------------
// 購物車商品
// --------------------

/**
 * 購物車商品介面
 */
export interface ICartItem {
    _id?: ObjectIdLike;
    restaurantId: ObjectIdLike;
    menuItemId: ObjectIdLike;
    name: string;
    price: number;
    quantity: number;
    options?: Mixed; // QUESTION: 是 Record<string, any> 嗎？
}

/**
 * 用於回應的購物車商品介面
 */
export interface ICartItemResponse extends ICartItem {
    restaurantName?: string;
    image?: string;
    info?: string;
}

// --------------------
// 購物車
// --------------------

/**
 * 購物車介面
 */
export interface ICart {
    _id?: ObjectIdLike;
    user: ObjectIdLike;
    items: ICartItem[];
    currency: string;
    total: number;
    status: CartStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 用於回應的購物車介面
 */
export interface ICartResponse extends ICart {
    items: ICartItemResponse[];
}

// --------------------
// 購物車相關 DTO
// --------------------

type CartItemUpdate = UpdateBody<ICartItem>;

export interface CartItemUpdateBody {
    items: CartItemUpdate[];
}
