// server/models/ntouLocation.model.ts

import type { INTOULocation } from "$interfaces/address.interfece";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

// 文件類型定義

type NTOULocationDocument = HydratedDocument<INTOULocation>;

// --------------------
// NTOU 地點資料
// --------------------

const NTOULocationSchema = new mongoose.Schema<NTOULocationDocument>(
    {
        code: { type: String, index: true, unique: true },
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    { timestamps: true }
);

// --------------------
// Model export
// --------------------

const NTOULocation =
    (mongoose.models.NTOULocation as Model<NTOULocationDocument>) ||
    mongoose.model<NTOULocationDocument>("ntoulocation", NTOULocationSchema);

export default NTOULocation;
