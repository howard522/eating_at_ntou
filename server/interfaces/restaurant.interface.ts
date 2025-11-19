// server/interfaces/restaurant.interface.ts

import type { IGeoPoint } from "@server/interfaces/geoPoint.interface";

// 菜單項目介面
export interface IMenuItem {
    name: string;
    price: number;
    image: string;
    info: string;
}

// 餐廳介面
export interface IRestaurant {
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

// 更新菜單項目用（新 API 用）
export type UpdateMenuItemBody = Partial<IMenuItem>;

// 更新餐廳資訊用
export type UpdateRestaurantBody = Partial<IRestaurant>;

// 建立餐廳用
export type CreateRestaurantBody = Pick<IRestaurant, "name" | "address" | "phone"> &
    Partial<Omit<IRestaurant, "name" | "address" | "phone">>;
