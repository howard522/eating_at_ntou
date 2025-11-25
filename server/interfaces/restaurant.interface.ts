// server/interfaces/restaurant.interface.ts

import type { Document, Types } from "mongoose";
import type { IGeoPoint } from "@server/interfaces/geoPoint.interface";

// 菜單項目介面
export interface IMenuItem extends Document {
    name: string;
    price: number;
    image: string;
    info: string;
}

// 餐廳介面
export interface IRestaurant extends Document {
    name: string;
    address: string;
    phone: string;
    image: string;
    info: string;
    tags: string[];
    menu: Types.DocumentArray<IMenuItem>;
    isActive: boolean;
    locationGeo?: IGeoPoint;
}

// 新增菜單項目資料
export type CreateMenuItemBody = Pick<IMenuItem, "name" | "price"> & Partial<Omit<IMenuItem, "name" | "price">>;

// 更新菜單項目資料
export type UpdateMenuItemBody = Partial<IMenuItem>;

// 新增餐廳資料
export type CreateRestaurantBody = Pick<IRestaurant, "name" | "address" | "phone"> &
    Partial<Omit<IRestaurant, "name" | "address" | "phone">>;

// 更新餐廳資料
export type UpdateRestaurantBody = Partial<IRestaurant>;
