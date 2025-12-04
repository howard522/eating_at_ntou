// server/services/restaurants.service.ts

import type { ObjectIdLike, QueryPaginationOptions } from "@server/interfaces/common.interface";
import type {
    CreateMenuItemBody,
    CreateRestaurantBody,
    IMenuItem,
    IRestaurant,
    UpdateMenuItemBody,
    UpdateRestaurantBody,
} from "@server/interfaces/restaurant.interface";
import Restaurant from "@server/models/restaurant.model";
import { buildRestaurantSearchQuery } from "@server/utils/mongoQuery";
import { getGeocodeFromAddress } from "@server/utils/nominatim";
import { cleanObject } from "@server/utils/object";
import type { FilterQuery, ObjectId, PipelineStage } from "mongoose";

async function findRestaurantDocumentById(restaurantId: ObjectIdLike) {
    const restaurant = await Restaurant.findById(restaurantId);

    // 找不到餐廳拋出 404 錯誤
    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Restaurant with id "${restaurantId}" not found`,
        });
    }

    return restaurant;
}

// --------------------
// 餐廳相關服務
// --------------------

/**
 * 新增餐廳
 *
 * @param data 餐廳資料
 * @returns 新增的餐廳
 */
export async function createRestaurant(data: CreateRestaurantBody): Promise<IRestaurant> {
    // 自動地理編碼
    if (data.address) {
        const geocode = await getGeocodeFromAddress(data.address);
        if (geocode) {
            data.locationGeo = geocode;
        } else {
            // 地址無法成功地理編碼
            console.warn(`Geocoding failed for address: ${data.address}`);

            throw createError({ statusCode: 400, message: "Bad Address for Geocoding" });
        }
    }

    const restaurant = new Restaurant(data);
    await restaurant.save();

    return restaurant.toObject<IRestaurant>(); // return as plain object
}

/**
 * 獲取指定的餐廳
 *
 * @param id 餐廳 ID
 * @returns 餐廳
 */
export async function getRestaurantById(id: ObjectIdLike): Promise<IRestaurant> {
    const restaurant = await findRestaurantDocumentById(id);

    return restaurant.toObject<IRestaurant>();
}

/**
 * 更新指定的餐廳，會自動忽略 `null`、`undefined`、空字串、空陣列
 *
 * @param id 餐廳 ID
 * @param data 要更新的餐廳資料
 * @returns 更新後的餐廳
 */
export async function updateRestaurantById(id: ObjectIdLike, data: UpdateRestaurantBody): Promise<IRestaurant> {
    data = cleanObject(data); // 清理空白欄位

    // 自動地理編碼
    if (data.address) {
        const geocode = await getGeocodeFromAddress(data.address);
        if (geocode) {
            data.locationGeo = geocode;
        } else {
            // 地址無法成功地理編碼
            console.warn(`Geocoding failed for address: ${data.address}`);

            throw createError({ statusCode: 400, message: "Bad Address for Geocoding" });
        }
    }

    // 更新資料庫
    const restaurant = await Restaurant.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });

    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Restaurant with id "${id}" not found`,
        });
    }

    return restaurant.toObject<IRestaurant>();
}

/**
 * 刪除指定的餐廳
 *
 * @param id 餐廳 ID
 * @returns 被刪除的餐廳
 */
export async function deleteRestaurantById(id: string | ObjectId): Promise<void> {
    if (!id) {
        throw createError({ statusCode: 400, message: "Restaurant ID is required" });
    }

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Restaurant with id "${id}" not found`,
        });
    }
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
    options?: QueryPaginationOptions
): Promise<IRestaurant[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;

    const restaurants = await Restaurant.find(query).limit(limit).skip(skip);

    return restaurants.map((r) => r.toObject<IRestaurant>());
}

/**
 * 透過提供的關鍵字搜尋餐廳，支援分頁
 *
 * @param search 關鍵字搜尋字串
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @param options.activeOnly 是否只搜尋上架的餐廳，預設為 true
 * @returns 符合條件的餐廳列表
 */
export async function searchRestaurants(
    search: string,
    options?: QueryPaginationOptions & { activeOnly?: boolean }
): Promise<IRestaurant[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;
    const activeOnly = options?.activeOnly ?? true; // 預設只搜尋上架的餐廳
    const maxTerms = 5;
    const maxTermLength = 50;

    // 關鍵字查詢條件
    const mongoQuery = buildRestaurantSearchQuery(search, { maxTerms, maxTermLength });

    // 只搜尋上架的餐廳
    if (activeOnly) {
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
 * @param options.limit 最大回傳筆數（預設 50）
 * @param options.skip 跳過筆數（預設 0）
 * @param options.maxDistance 最大搜尋距離（公尺），選填
 * @param options.activeOnly 是否只搜尋上架的餐廳，預設為 true
 * @returns 符合條件的餐廳列表，包含 distance 欄位（單位：公尺）
 */
export async function searchRestaurantsNearByAddress(
    address: string,
    search: string,
    options?: QueryPaginationOptions & { maxDistance?: number; activeOnly?: boolean }
): Promise<IRestaurant[]> {
    const limit = options?.limit ?? 50;
    const skip = options?.skip ?? 0;
    const maxDistance = options?.maxDistance;
    const activeOnly = options?.activeOnly ?? true; // 預設只搜尋上架的餐廳
    const maxTerms = 5;
    const maxTermLength = 50;

    const geocode = await getGeocodeFromAddress(address);

    if (!geocode) {
        throw createError({ statusCode: 400, message: "Failed to geocode the provided address" });
    }

    // 關鍵字查詢條件
    const mongoQuery = buildRestaurantSearchQuery(search, { maxTerms, maxTermLength });

    // 只搜尋上架的餐廳
    if (activeOnly) {
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

// --------------------
// 菜單項目相關服務
// --------------------

/**
 * 新增菜單項目到指定餐廳
 *
 * @param restaurantId 餐廳 ID
 * @param data 菜單項目資料
 * @returns 新增的菜單項目
 */
export async function createMenuItem(restaurantId: ObjectIdLike, data: CreateMenuItemBody): Promise<IMenuItem> {
    // 使用 imageURL 更新圖片欄位
    if (data.imageURL) {
        data.image = data.imageURL;
        delete data.imageURL;
    }

    const restaurant = await findRestaurantDocumentById(restaurantId);
    const menuItem = restaurant.menu.create(data);

    restaurant.menu.push(menuItem);
    await restaurant.save();

    return menuItem.toObject<IMenuItem>();
}

/**
 * 獲取指定的菜單項目
 *
 * @param restaurantId 餐廳 ID
 * @param menuId 菜單項目 ID
 * @returns 指定的菜單項目
 */
export async function getMenuItemById(restaurantId: ObjectIdLike, menuId: ObjectIdLike): Promise<IMenuItem> {
    const restaurant = await findRestaurantDocumentById(restaurantId);
    const menuItem = restaurant.menu.id(menuId);

    if (!menuItem) {
        throw createError({ statusCode: 404, message: "Menu item not found" });
    }

    if (!menuItem) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Menu item with id "${menuId}" not found`,
        });
    }

    return menuItem.toObject<IMenuItem>();
}

/**
 * 更新指定的菜單項目
 *
 * @param restaurantId 餐廳 ID
 * @param menuId 菜單項目 ID
 * @param data 要更新的菜單項目資料
 * @returns 更新後的菜單項目
 */
export async function updateMenuItemById(
    restaurantId: ObjectIdLike,
    menuId: ObjectIdLike,
    data: UpdateMenuItemBody
): Promise<IMenuItem> {
    // 使用 imageURL 更新圖片欄位
    if (data.imageURL) {
        data.image = data.imageURL;
        delete data.imageURL;
    }

    data = cleanObject(data); // 清理空白欄位

    const restaurant = await findRestaurantDocumentById(restaurantId);
    const menuItem = restaurant.menu.id(menuId);

    if (!menuItem) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Menu item with id "${menuId}" not found`,
        });
    }

    // 更新欄位
    Object.assign(menuItem, data);
    await restaurant.save();

    return menuItem.toObject<IMenuItem>();
}

/**
 * 刪除指定的菜單項目
 *
 * @param restaurantId 餐廳 ID
 * @param menuId 菜單項目 ID
 */
export async function deleteMenuItemById(restaurantId: ObjectIdLike, menuId: ObjectIdLike): Promise<void> {
    const restaurant = await findRestaurantDocumentById(restaurantId);
    const menuItem = restaurant.menu.id(menuId);

    if (!menuItem) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: `Menu item with id "${menuId}" not found`,
        });
    }

    restaurant.menu.pull(menuItem); // 移除菜單項目
    await restaurant.save();
}
