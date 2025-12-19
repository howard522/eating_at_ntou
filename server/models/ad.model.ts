// server/models/ad.model.ts

import type { IAd } from "$interfaces/ad.interface";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// 文件類型定義
type AdDocument = HydratedDocument<IAd>;

// --------------------
// 廣告
// --------------------

const adSchema = new Schema<AdDocument>(
    {
        title: { type: String, required: true },
        imageUrl: { type: String, required: false },
        linkUrl: { type: String, required: false },
        text: { type: String, required: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// --------------------
// Model export
// --------------------

export const Ad = (mongoose.models.Ad as Model<AdDocument>) || model<AdDocument>("Ad", adSchema);
export default Ad;
