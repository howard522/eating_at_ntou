// server/services/restaurants.service.ts

import Restaurant from "@server/models/restaurant.model";
import { cleanObject } from "@server/utils/cleanObject";
import type { FilterQuery, ObjectId, PipelineStage, Types } from "mongoose";
import type {
    CreateMenuItemBody,
    CreateRestaurantBody,
    IMenuItem,
    IRestaurant,
    UpdateMenuItemBody,
    UpdateRestaurantBody,
} from "@server/interfaces/restaurant.interface";
import { buildRestaurantSearchQuery } from "@server/utils/mongoQuery";
import { getGeocodeFromAddress, sleep, validateGeocode } from "@server/utils/nominatim";

type MenuItemSubdocument = Types.Subdocument<Types.ObjectId, IRestaurant, IMenuItem> & IMenuItem;

/**
 * 新增餐廳
 *
 * @param data 餐廳資料
 * @returns 新增的餐廳
 */
export async function createRestaurant(data: CreateRestaurantBody): Promise<IRestaurant> {
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
export async function getRestaurantById(id: string | ObjectId): Promise<IRestaurant> {
    if (!id) {
        throw createError({ statusCode: 400, message: "Restaurant ID is required" });
    }

    const restaurant = await Restaurant.findById(id);

    // 找不到餐廳拋出 404 錯誤
    if (!restaurant) {
        throw createError({ statusCode: 404, message: "Restaurant not found" });
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
): Promise<IRestaurant[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;

    const restaurants = await Restaurant.find(query).limit(limit).skip(skip);

    return restaurants;
}

/**
 * 透過提供的關鍵字搜尋餐廳，支援分頁
 *
 * @param search 關鍵字搜尋字串
 * @param isActive 是否只搜尋上架的餐廳，預設為 true
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 */
export async function searchRestaurants(
    search: string,
    isActive: boolean,
    options?: { limit?: number; skip?: number }
): Promise<IRestaurant[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;
    const maxTerms = 5;
    const maxTermLength = 50;

    isActive ??= true; // 預設只搜尋上架的餐廳

    // 關鍵字查詢條件
    const mongoQuery = buildRestaurantSearchQuery(search, { maxTerms, maxTermLength });

    // 只搜尋上架的餐廳
    if (isActive) {
        mongoQuery.isActive = true;
    }

    const restaurants = await getRestaurantsByQuery(mongoQuery, { limit, skip });

    return restaurants;
}

/**
 * 透過提供的地址、關鍵字等條件搜尋餐廳，支援分頁
 *
 * @param address 地址字串，用於地理編碼
 * @param search 關鍵字搜尋字串
 * @param isActive 是否只搜尋上架的餐廳，預設為 true
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @param options.maxDistance 最大搜尋距離（公尺），選填
 * @returns 符合條件的餐廳列表，包含 distance 欄位（單位：公尺）
 */
export async function searchRestaurantsNearByAddress(
    address: string,
    search: string,
    isActive: boolean,
    options?: { limit?: number; skip?: number; maxDistance?: number }
): Promise<IRestaurant[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;
    const maxDistance = options?.maxDistance;
    const maxTerms = 5;
    const maxTermLength = 50;

    isActive ??= true; // 預設只搜尋上架的餐廳

    const geocode = await getGeocodeFromAddress(address);

    if (!geocode) {
        throw createError({ statusCode: 400, message: "Failed to geocode the provided address" });
    }

    // 關鍵字查詢條件
    const mongoQuery = buildRestaurantSearchQuery(search, { maxTerms, maxTermLength });

    // 只搜尋上架的餐廳
    if (isActive) {
        mongoQuery.isActive = true;
    }

    // First, try to find nearby using aggregation with $geoNear
    const geoNearStage: PipelineStage = {
        $geoNear: {
            near: geocode,
            distanceField: "distance",
            spherical: true,
            distanceMultiplier: 1, // distance in meters when using $geoNear with meters depends on coords
        },
    };

    if (Number.isFinite(maxDistance)) {
        geoNearStage.$geoNear.maxDistance = maxDistance;
    }

    if (mongoQuery.$or?.length) {
        geoNearStage.$geoNear.query = mongoQuery;
    }

    const pipeline: PipelineStage[] = [geoNearStage, { $skip: skip }, { $limit: limit }];

    const results = await Restaurant.aggregate(pipeline);

    return results;
}

/**
 * 更新指定的餐廳，會自動忽略 `null`、`undefined`、空字串、空陣列
 *
 * @param id 餐廳的 MongoDB ObjectId
 * @param data 要更新的餐廳資料
 * @returns 更新後的餐廳
 */
export async function updateRestaurantById(id: string | ObjectId, data: UpdateRestaurantBody): Promise<IRestaurant> {
    if (!id) {
        throw createError({ statusCode: 400, message: "Restaurant ID is required" });
    }

    // 更新資料庫
    const restaurant = await Restaurant.findByIdAndUpdate(id, cleanObject(data), {
        new: true,
        runValidators: true,
    });

    if (!restaurant) {
        throw createError({ statusCode: 404, message: "Restaurant not found" });
    }

    return restaurant;
}

/**
 * 更新指定餐廳的經緯度資料（若地址存在且經緯度無效）
 *
 * @param id 餐廳的 MongoDB ObjectId
 * @returns 更新後的餐廳
 */
export async function updateRestaurantGeocodeById(id: string | ObjectId): Promise<IRestaurant> {
    if (!id) {
        throw createError({ statusCode: 400, message: "Restaurant ID is required" });
    }

    const restaurant = await getRestaurantById(id);

    if (!restaurant) {
        throw createError({ statusCode: 404, message: "Restaurant not found" });
    }

    // 檢查是否需要更新經緯度
    if (restaurant.address && !validateGeocode(restaurant.locationGeo)) {
        try {
            const geocode = await getGeocodeFromAddress(restaurant.address);
            if (geocode) {
                await restaurant.updateOne({ locationGeo: geocode });
            }
        } catch (e) {
            // ignore individual errors
            // console.error(e);
        }
        // 節流：Nominatim 建議每秒不要超過 1 次，這裡設 1.1 秒
        await sleep(1100);
    }

    return restaurant;
}

/**
 * 刪除指定的餐廳
 *
 * @param id 餐廳的 MongoDB ObjectId
 * @returns 被刪除的餐廳
 */
export async function deleteRestaurantById(id: string | ObjectId): Promise<IRestaurant | null> {
    if (!id) {
        throw createError({ statusCode: 400, message: "Restaurant ID is required" });
    }

    const restaurant = await Restaurant.findByIdAndDelete(id);

    // 找不到餐廳拋出 404 錯誤
    if (!restaurant) {
        throw createError({ statusCode: 404, message: "Restaurant not found" });
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
export async function createMenuItem(
    restaurantId: string | ObjectId,
    data: CreateMenuItemBody
): Promise<MenuItemSubdocument> {
    if (!restaurantId) {
        throw createError({ statusCode: 400, message: "Restaurant ID is required" });
    }

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
export async function getMenuItemById(
    restaurantId: string | ObjectId,
    menuId: string | ObjectId
): Promise<MenuItemSubdocument> {
    const restaurant = await getRestaurantById(restaurantId);
    const menuItem = restaurant.menu.id(menuId.toString());

    if (!menuItem) {
        throw createError({ statusCode: 404, message: "Menu item not found" });
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
    restaurantId: string | ObjectId,
    menuId: string | ObjectId,
    data: UpdateMenuItemBody
): Promise<MenuItemSubdocument> {
    const menuItem = await getMenuItemById(restaurantId, menuId);

    // 更新欄位
    Object.assign(menuItem, cleanObject(data));
    await menuItem.parent().save();

    return menuItem;
}

/**
 * 刪除指定的菜單項目
 *
 * @param restaurantId 餐廳的 MongoDB ObjectId
 * @param menuId 菜單項目的 MongoDB ObjectId
 */
export async function deleteMenuItemById(restaurantId: string | ObjectId, menuId: string | ObjectId): Promise<void> {
    const menuItem = await getMenuItemById(restaurantId, menuId);

    menuItem.deleteOne();
    await menuItem.parent().save();
}
