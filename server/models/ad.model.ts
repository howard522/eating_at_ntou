// server/models/ad.model.ts

import mongoose from "mongoose";
import type { Model } from "mongoose";
import type { IAd } from "@server/interfaces/ad.interface";

const { Schema, model } = mongoose;

const adSchema = new Schema<IAd>(
    {
        title: { type: String, required: true },
        imageUrl: { type: String, required: false },
        linkUrl: { type: String, required: false },
        text: { type: String, required: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default (mongoose.models.Ad as Model<IAd>) || model<IAd>("Ad", adSchema);
