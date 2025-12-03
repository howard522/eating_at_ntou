// server/interfaces/restaurant.interface.ts

import type { CreateBody, ImageURL, UpdateBody } from "@server/interfaces/common.interface";
import type { IGeoPoint } from "@server/interfaces/geo.interface";
import type { Types } from "mongoose";

/**
 * 菜單項目介面
 */
export interface IMenuItem {
    _id?: Types.ObjectId;
    name: string;
    price: number;
    image: string;
    info: string;
}

/**
 * 餐廳介面
 */
export interface IRestaurant {
    _id?: Types.ObjectId;
    name: string;
    address: string;
    phone: string;
    image: string;
    info: string;
    tags: string[];
    menu: IMenuItem[];
    isActive: boolean;
    locationGeo?: IGeoPoint;
}

/**
 * 新增菜單項目 DTO
 */
export type CreateMenuItemBody = CreateBody<IMenuItem, "name" | "price"> & ImageURL;

/**
 * 更新菜單項目 DTO
 */
export type UpdateMenuItemBody = UpdateBody<IMenuItem> & ImageURL;

/**
 * 新增餐廳 DTO
 */
export type CreateRestaurantBody = CreateBody<IRestaurant, "name" | "address" | "phone"> & ImageURL;

/**
 * 更新餐廳 DTO
 */
export type UpdateRestaurantBody = UpdateBody<IRestaurant> & ImageURL;
