// server/interfaces/order.interface.ts

import type { ObjectId } from "mongoose";

// 單一商品快照介面
export interface IOrderItem {
    // 商品快照
    menuItemId?: ObjectId; // 可選，因為商品可能已被刪除
    name: string;
    image?: string;
    info?: string;

    // 價格快照
    price: number; // 單價
    quantity: number;

    // 餐廳快照
    restaurant: {
        id?: ObjectId; // 可選，因為餐廳可能已被刪除
        name?: string;
        phone?: string;
        address?: string;
    };
}

// 訂單主體介面
export interface IOrder {
    // 下單者
    user: ObjectId;

    // 外送員（可為空，表示尚未接單）
    deliveryPerson?: ObjectId | null;

    // 商品快照陣列
    items: IOrderItem[];

    // 結帳資訊
    total: number; // 總金額
    deliveryFee: number; // 外送費
    currency: string;
    arriveTime?: Date; // 預計到達時間

    // 外送資訊（配送地址／聯絡方式）
    deliveryInfo: {
        address?: string;
        contactName?: string;
        contactPhone?: string;
        note?: string;
    };

    // 訂單雙角色狀態
    customerStatus: "preparing" | "on_the_way" | "received" | "completed";
    deliveryStatus: "preparing" | "on_the_way" | "delivered" | "completed";

    // 系統紀錄
    createdAt: Date;
    updatedAt: Date;
}
