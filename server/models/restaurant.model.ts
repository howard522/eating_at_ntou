// server/models/restaurant.model.ts

import mongoose from "mongoose";
import type { Model } from "mongoose";
import type { IMenuItem, IRestaurant } from "@server/interfaces/restaurant.interface";

const { Schema, model } = mongoose;

const menuItemSchema = new Schema<IMenuItem>({
    name: String,
    price: Number,
    image: String,
    info: String,
});

const restaurantSchema = new Schema<IRestaurant>({
    name: String,
    address: String,
    phone: String,
    image: String,
    info: String,
    tags: { type: [String], default: [] },
    menu: { type: [menuItemSchema], default: [] },

    // status: 營業狀態
    isActive: {
        type: Boolean,
        default: true, // 預設上架中
        index: true, // 常用查詢 index
    },
});

// GeoJSON location for geospatial queries. Keep separate to avoid breaking existing code.
restaurantSchema.add({
    locationGeo: {
        type: { type: String, enum: ["Point"] },
        coordinates: { type: [Number] }, // [lon, lat]
    },
});

// 2dsphere index for geospatial queries
restaurantSchema.index({ locationGeo: "2dsphere" });

export default (mongoose.models.Restaurant as Model<IRestaurant>) || model<IRestaurant>("Restaurant", restaurantSchema);
