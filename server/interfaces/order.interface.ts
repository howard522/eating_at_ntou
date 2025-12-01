// server/interfaces/order.interface.ts

import type { Document, Types } from "mongoose";

// 單一商品快照介面
export interface IOrderItem extends Document {
    // 商品快照
    menuItemId?: Types.ObjectId; // 可選，因為商品可能已被刪除
    name: string;
    image?: string;
    info?: string;

    // 價格快照
    price: number; // 單價
    quantity: number;

    // 餐廳快照
    restaurant: {
        id?: Types.ObjectId; // 可選，因為餐廳可能已被刪除
        name?: string;
        phone?: string;
        address?: string;
    };
}

export type CustomerStatus = "preparing" | "on_the_way" | "received" | "completed";
export type DeliveryStatus = "preparing" | "on_the_way" | "delivered" | "completed";

// 訂單主體介面
export interface IOrder extends Document {
    // 下單者
    user: Types.ObjectId;

    // 外送員（可為空，表示尚未接單）
    deliveryPerson?: Types.ObjectId | null;

    // 商品快照陣列
    items: Types.DocumentArray<IOrderItem>;

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
    customerStatus: CustomerStatus;
    deliveryStatus: DeliveryStatus;

    // 系統紀錄
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderStatusUpdate {
    customerStatus?: CustomerStatus;
    deliveryStatus?: DeliveryStatus;
}

export interface OrderInfo {
    deliveryInfo: {
        address: string;
        contactName: string;
        contactPhone: string;
        note?: string;
        location?: {
            lat: number;
            lng: number;
        };
    };
    deliveryFee: number;
    arriveTime?: Date;
}
