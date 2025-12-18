// server/models/cart.model.ts

import type { ICart, ICartItem } from "@server/interfaces/cart.interface";
import { calculateTotalPrice } from "@server/utils/calcPrice";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// 文件類型定義
type CartItemSubdocument = HydratedDocument<ICartItem>;
type CartDocument = Omit<HydratedDocument<ICart>, "items"> & {
    items: mongoose.Types.DocumentArray<CartItemSubdocument>;
};

// --------------------
// 購物車商品
// --------------------

const cartItemSchema = new Schema<CartItemSubdocument>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        menuItemId: {
            type: Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true }, // price snapshot in cents
        quantity: { type: Number, default: 1, min: 1 },
        options: { type: Schema.Types.Mixed }, // arbitrary options / modifiers
    },
    {
        id: false, // 不要自動產生虛擬的 id 欄位
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

cartItemSchema.virtual("restaurant", {
    ref: "Restaurant",
    localField: "restaurantId",
    foreignField: "_id",
    justOne: true,
});

// --------------------
// 購物車
// --------------------

const cartSchema = new Schema<CartDocument>(
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

// --------------------
// 自動計算總價
// --------------------

/**
 * INFO: ChatGPT 說
 * Pre-validate 比 pre-save 更安全：
 * - save() 會跑 validate + save
 * - create() 只跑 validate 不跑 save
 * - update 不會跑這段（你應該使用 findOneAndUpdate hooks）
 */
cartSchema.pre("save", function (next) {
    try {
        if (this.items) {
            this.total = calculateTotalPrice(this.items);
        }
        next();
    } catch (e) {
        next(e as any);
    }
});

// --------------------
// Model export
// --------------------

export const Cart = (mongoose.models.Cart as Model<CartDocument>) || model<CartDocument>("Cart", cartSchema);

export default Cart;
