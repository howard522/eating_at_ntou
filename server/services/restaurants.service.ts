// server/services/restaurants.service.ts

import Restaurant from "@server/models/restaurant.model";
import { cleanObject } from "@server/utils/cleanObject";
import type { FilterQuery } from "mongoose";
import type {
    CreateMenuItemBody,
    CreateRestaurantBody,
    IMenuItem,
    IRestaurant,
    UpdateMenuItemBody,
    UpdateRestaurantBody,
} from "@server/interfaces/restaurant.interface";

/**
 * 新增餐廳
 *
 * @param data 餐廳資料
 * @returns 新增的餐廳
 */
export async function createRestaurant(data: CreateRestaurantBody) {
    const restaurant = new Restaurant(data);
    await restaurant.save();
    return restaurant;
}

/**
 * 獲取指定的餐廳
 *
 * @param id 餐廳的 MongoDB ObjectId
 * @returns 餐廳
 */
export async function getRestaurantById(id: string) {
    const restaurant = await Restaurant.findById(id);

    // 找不到餐廳拋出 404 錯誤
    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: "Restaurant not found",
        });
    }

    return restaurant;
}

/**
 * 透過查詢條件獲取餐廳，支援分頁
 *
 * @param query 查詢條件
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @returns 符合條件的餐廳列表
 */
export async function getRestaurantsByQuery(
    query: FilterQuery<IRestaurant>,
    options?: { limit?: number; skip?: number }
) {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;

    const restaurants = await Restaurant.find(query).limit(limit).skip(skip);

    return restaurants;
}

/**
 * 更新指定的餐廳，會自動忽略 `null`、`undefined`、空字串、空陣列
 *
 * @param id 餐廳的 MongoDB ObjectId
 * @param data 要更新的餐廳資料
 * @returns 更新後的餐廳
 */
export async function updateRestaurantById(id: string, data: UpdateRestaurantBody) {
    // 過濾掉空欄位
    const cleaned = cleanObject(data);

    // 更新資料庫
    const restaurant = await Restaurant.findByIdAndUpdate(id, cleaned, {
        new: true,
        runValidators: true,
    });

    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: "Restaurant not found",
        });
    }

    return restaurant;
}

/**
 * 刪除指定的餐廳
 *
 * @param id 餐廳的 MongoDB ObjectId
 * @returns 被刪除的餐廳
 */
export async function deleteRestaurantById(id: string) {
    const restaurant = await Restaurant.findByIdAndDelete(id);

    // 找不到餐廳拋出 404 錯誤
    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: "Restaurant not found",
        });
    }

    return restaurant;
}

/**
 * 新增菜單項目到指定餐廳
 *
 * @param restaurantId 餐廳的 MongoDB ObjectId
 * @param data 菜單項目資料
 * @returns 新增的菜單項目
 */
export async function createMenuItem(restaurantId: string, data: CreateMenuItemBody) {
    const restaurant = await getRestaurantById(restaurantId);
    const menuItem = restaurant.menu.create(data);

    restaurant.menu.push(menuItem);
    await restaurant.save();

    return menuItem;
}

/**
 * 獲取指定的菜單項目
 *
 * @param restaurantId 餐廳的 MongoDB ObjectId
 * @param menuId 菜單項目的 MongoDB ObjectId
 * @returns 指定的菜單項目
 */
export async function getMenuItemById(restaurantId: string, menuId: string) {
    const restaurant = await getRestaurantById(restaurantId);
    const menuItem = restaurant.menu.id(menuId);

    if (!menuItem) {
        throw createError({
            statusCode: 404,
            statusMessage: "Menu item not found",
        });
    }

    return menuItem;
}

/**
 * 更新指定的菜單項目
 *
 * @param restaurantId 餐廳的 MongoDB ObjectId
 * @param menuId 菜單項目的 MongoDB ObjectId
 * @param data 要更新的菜單項目資料
 * @returns 更新後的菜單項目
 */
export async function updateMenuItemById(
    restaurantId: string,
    menuId: string,
    data: UpdateMenuItemBody
): Promise<IMenuItem> {
    const restaurant = await getRestaurantById(restaurantId);
    const menuItem = restaurant.menu.id(menuId);

    if (!menuItem) {
        throw createError({
            statusCode: 404,
            statusMessage: "Menu item not found",
        });
    }

    // 更新欄位
    Object.assign(menuItem, cleanObject(data));

    await restaurant.save();

    return menuItem;
}

/**
 * 刪除指定的菜單項目
 *
 * @param restaurantId 餐廳的 MongoDB ObjectId
 * @param menuId 菜單項目的 MongoDB ObjectId
 */
export async function deleteMenuItemById(restaurantId: string, menuId: string) {
    const restaurant = await getRestaurantById(restaurantId);
    const menuItem = restaurant.menu.id(menuId);

    if (!menuItem) {
        throw createError({
            statusCode: 404,
            statusMessage: "Menu item not found",
        });
    }

    menuItem.deleteOne();
    await restaurant.save();
}
