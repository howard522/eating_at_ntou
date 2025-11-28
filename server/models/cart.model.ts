// server/models/cart.model.ts

import mongoose from "mongoose";
import { calculateTotalPrice } from "@server/utils/calcPrice";
import type { Model } from "mongoose";
import type { ICart, ICartItem } from "@server/interfaces/cart.interface";

const { Schema, model } = mongoose;

const cartItemSchema = new Schema<ICartItem>({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: false,
    },
    menuItemId: {
        type: Schema.Types.ObjectId,
        ref: "MenuItem",
        required: false,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // price snapshot in cents
    quantity: { type: Number, default: 1 },
    options: { type: Schema.Types.Mixed }, // arbitrary options / modifiers
});

const cartSchema = new Schema<ICart>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: { type: [cartItemSchema], default: [] },
        currency: { type: String, default: "TWD" },
        total: { type: Number, default: 0 }, // total in cents
        // status meanings:
        // - 'open': 使用者正在編輯購物車 (仍可修改)
        // - 'locked': 使用者已送出下單請求，購物車暫時鎖定（後續會有訂單流程把該購物車清空或轉為訂單）
        status: {
            type: String,
            enum: ["open", "locked"],
            default: "open",
        },
    },
    { timestamps: true }
);

// calculate total before save if items changed
cartSchema.pre("save", function (next) {
    try {
        if (this.items && Array.isArray(this.items)) {
            this.total = calculateTotalPrice(this.items);
        }
        next();
    } catch (e) {
        next(e as any);
    }
});

export default (mongoose.models.Cart as Model<ICart>) || model<ICart>("Cart", cartSchema);
