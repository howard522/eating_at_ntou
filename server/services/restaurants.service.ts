import Restaurant from "@server/models/restaurant.model";
import { cleanObject } from "@server/utils/cleanObject";
import type { FilterQuery } from "mongoose";
import type { CreateRestaurantBody, IRestaurant, UpdateRestaurantBody } from "@server/interfaces/restaurant.interface";

/**
 * 建立新的餐廳
 *
 * @param data 餐廳資料
 * @returns 新建立的餐廳資料
 */
export async function createRestaurant(data: CreateRestaurantBody) {
    const restaurant = new Restaurant(data);
    await restaurant.save();
    return restaurant;
}

/**
 * 透過 ID 獲取餐廳資料
 *
 * @param id 餐廳的唯一 MongoDB ObjectId
 * @returns 餐廳資料
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
 * 透過查詢條件獲取餐廳清單，支援分頁
 *
 * @param query 查詢條件
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @returns 餐廳清單
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
 * 更新餐廳資料，會自動略過空字串、null、undefined、空陣列
 *
 * @param id 餐廳的唯一 MongoDB ObjectId
 * @param data 要更新的餐廳資料
 * @returns 更新後的餐廳資料或 `null`（若找不到）
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
 * 透過 ID 刪除餐廳
 *
 * @param id 餐廳的唯一 MongoDB ObjectId
 * @returns 被刪除的餐廳資料
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
