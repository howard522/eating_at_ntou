// server/interfaces/order.interface.ts

import type { Document, Mixed, ObjectId, Types } from "mongoose";

// 單一商品介面
export interface ICartItem extends Document {
    restaurantId: ObjectId;
    menuItemId: ObjectId;
    name: string;
    price: number;
    quantity: number;
    options?: Mixed;
}

// 用於回應的購物車商品介面
export interface ICartItemResponse {
    restaurantId: string;
    menuItemId: string;
    restaurantName?: string;
    name: string;
    price: number;
    image?: string;
    info?: string;
    quantity: number;
    options?: Mixed;
}

// 購物車介面
export interface ICart extends Document {
    user: ObjectId;
    items: Types.DocumentArray<ICartItem>;
    currency: string;
    total: number;
    status: "open" | "locked";
    createdAt: Date;
    updatedAt: Date;
}

// 用於回應的購物車介面
export interface ICartResponse {
    _id: string;
    user: string;
    items: ICartItemResponse[];
    currency: string;
    total: number;
    status: "open" | "locked";
    createdAt: Date;
    updatedAt: Date;
}


export interface CartPostBody {
    items: Partial<ICartItem>[];
}