import mongoose from "mongoose";

const KeelongAddressMapSchema = new mongoose.Schema({
    originalAddress: { type: String, index: true },
    normalizedAddress: { type: String, index: true, unique: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.KeelongAddressMap || mongoose.model('KeelongAddressMap', KeelongAddressMapSchema);