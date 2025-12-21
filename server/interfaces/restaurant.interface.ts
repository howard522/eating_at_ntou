// server/interfaces/restaurant.interface.ts

import type { CreateBody, ImageURL, ObjectIdLike, UpdateBody } from "./common.interface";
import type { IGeoPoint } from "./geo.interface";

// --------------------
// 菜單項目介面
// --------------------

export interface IMenuItem {
    _id: ObjectIdLike;
    name: string;
    price: number;
    image: string;
    info: string;
}

// --------------------
// 餐廳介面
// --------------------

/**
 * 餐廳介面
 */
export interface IRestaurant {
    _id: ObjectIdLike;
    name: string;
    address: string;
    phone: string;
    image: string;
    info: string;
    tags: string[];
    menu: IMenuItem[];
    rating: number;
    isActive: boolean;
    locationGeo: IGeoPoint;
}

// --------------------
// 餐廳相關 DTO
// --------------------

/**
 * 回應菜單項目資料
 */
export type IMenuItemResponse = IMenuItem;

/**
 * 新增菜單項目
 */
export type ICreateMenuItem = CreateBody<IMenuItem, "name" | "price"> & ImageURL;

/**
 * 更新菜單項目
 */
export type IUpdateMenuItem = UpdateBody<IMenuItem> & ImageURL;

/**
 * 回應餐廳資料
 */
export type IRestaurantResponse = IRestaurant;

/**
 * 新增餐廳
 */
export type ICreateRestaurant = CreateBody<IRestaurant, "name" | "address" | "phone"> & ImageURL;

/**
 * 更新餐廳
 */
export type IUpdateRestaurant = UpdateBody<IRestaurant> & ImageURL;
