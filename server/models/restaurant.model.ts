// server/models/restaurant.model.ts

import type { IMenuItem, IRestaurant } from "$interfaces/restaurant.interface";
import type { HydratedDocument, Model, Types } from "mongoose";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// 文件類型定義
type MenuItemSubdocument = HydratedDocument<IMenuItem>;
type RestaurantDocument = Omit<HydratedDocument<IRestaurant>, "menu"> & {
    menu: Types.DocumentArray<MenuItemSubdocument>;
};

// 菜單項目子文件結構
const menuItemSchema = new Schema<MenuItemSubdocument>({
    name: String,
    price: Number,
    image: String,
    info: String,
});

// 餐廳文件結構
const restaurantSchema = new Schema<RestaurantDocument>({
    name: String,
    address: String,
    phone: String,
    image: String,
    info: String,
    tags: { type: [String], default: [] },
    menu: { type: [menuItemSchema], default: [] },
    rating: { type: Number, default: 0, index: true },

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

export const Restaurant =
    (mongoose.models.Restaurant as Model<RestaurantDocument>) ||
    model<RestaurantDocument>("Restaurant", restaurantSchema);

export default Restaurant;
