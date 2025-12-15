// server/models/geoCache.model.ts

import type { IGeoCache } from "@server/interfaces/address.interfece";
import type { HydratedDocument, Model } from "mongoose";
import mongoose from "mongoose";

// 文件類型定義
type GeoCacheDocument = HydratedDocument<IGeoCache>;

// --------------------
// 地理位置快取
// --------------------

const geoCacheSchema = new mongoose.Schema<GeoCacheDocument>(
    {
        address: { type: String, index: true, unique: true },
        lat: Number,
        lon: Number,
    },
    { timestamps: true }
);

// --------------------
// Model export
// --------------------

const GeoCache =
    (mongoose.models.GeoCache as Model<GeoCacheDocument>) ||
    mongoose.model<GeoCacheDocument>("GeoCache", geoCacheSchema);

export default GeoCache;
