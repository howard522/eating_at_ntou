// server/models/order.model.ts

import mongoose from "mongoose";
import { calculateTotalPrice } from "@server/utils/calcPrice";
import type { Model } from "mongoose";
import type { IOrder, IOrderItem } from "@server/interfaces/order.interface";

const { Schema, model } = mongoose;

/**
 * 單一商品快照 (orderItemSchema)
 * 完全保留下單時的狀態，避免日後商品或餐廳資料變更影響舊訂單。
 */
const orderItemSchema = new Schema<IOrderItem>({
    // 商品快照
    menuItemId: {
        type: Schema.Types.ObjectId,
        ref: "MenuItem",
        required: false,
    },
    name: { type: String, required: true },
    image: String,
    info: String,

    // 價格快照
    price: { type: Number, required: true }, // 單價
    quantity: { type: Number, default: 1 },

    // 餐廳快照
    restaurant: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: false, index: true }, //index方便查詢某餐廳的訂單
        name: { type: String },
        phone: { type: String },
        address: { type: String }, // 新增 address 欄位
    },
});

/**
 * 訂單主體 (orderSchema)
 * 以購物車內容為基礎生成。
 */
const orderSchema = new Schema<IOrder>(
    {
        // 下單者
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // 外送員（可為空，表示尚未接單）(外送員聯絡方式打api)
        deliveryPerson: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        // 商品快照陣列
        items: { type: [orderItemSchema], default: [] },

        // 結帳資訊
        total: { type: Number, required: true }, // 總金額
        deliveryFee: { type: Number, required: true }, // 外送費
        currency: { type: String, default: "TWD" },
        arriveTime: { type: Date, required: true }, // 預計到達時間

        // 外送資訊（配送地址／聯絡方式）
        deliveryInfo: {
            address: String,
            contactName: String,
            contactPhone: String,
            note: String,
            location: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },

        // 訂單雙角色狀態
        customerStatus: {
            type: String,
            enum: ["preparing", "on_the_way", "received", "completed"],
            default: "preparing",
        },
        deliveryStatus: {
            type: String,
            enum: ["preparing", "on_the_way", "delivered", "completed"],
            default: "preparing",
        },
    },
    { timestamps: true }
);

/**
 * pre-save hook：可根據 items 自動計算 total
 * （保險起見，即使前端算好，後端仍重新驗算一次）
 */
orderSchema.pre("save", function (next) {
    try {
        if (Array.isArray(this.items)) {
            const subtotal = calculateTotalPrice(this.items);
            this.total = subtotal + (this.deliveryFee ?? 0);
        }
        next();
    } catch (e) {
        next(e as any);
    }
});

export default (mongoose.models.Order as Model<IOrder>) || model<IOrder>("Order", orderSchema);
