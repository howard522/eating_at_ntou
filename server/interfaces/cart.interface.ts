// server/interfaces/order.interface.ts

import type { Mixed, ObjectId } from "mongoose";

// 單一商品介面
export interface ICartItem {
    restaurantId: ObjectId | null;
    menuItemId: ObjectId | null;
    name: string;
    price: number;
    quantity: number;
    options?: Mixed;
}

// 購物車介面
export interface ICart {
    user: ObjectId;
    items: ICartItem[];
    currency: string;
    total: number;
    status: "open" | "locked";
    createdAt: Date;
    updatedAt: Date;
}
