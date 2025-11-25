import { add, update } from "lodash-es";
import mongoose from "mongoose";

const geoCacheSchema = new mongoose.Schema({
    address: { type: String, index: true, unique: true },
    lat: Number,
    lon: Number,
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.GeoCache || mongoose.model('GeoCache', geoCacheSchema);