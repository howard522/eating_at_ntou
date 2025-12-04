// server/models/KeelongAddressMap.ts

import type { IKeelongAddressMap } from "@server/interfaces/address.interfece";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

// 文件類型定義

type KeelongAddressMapDocument = HydratedDocument<IKeelongAddressMap>;

// --------------------
// 基隆地址對應表
// --------------------

const KeelongAddressMapSchema = new mongoose.Schema<KeelongAddressMapDocument>(
    {
        originalAddress: { type: String, index: true },
        normalizedAddress: { type: String, index: true, unique: true },
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    { timestamps: true }
);

// --------------------
// Model export
// --------------------

const KeelongAddressMap =
    (mongoose.models.KeelongAddressMap as Model<KeelongAddressMapDocument>) ||
    mongoose.model<KeelongAddressMapDocument>("KeelongAddressMap", KeelongAddressMapSchema);

export default KeelongAddressMap;
