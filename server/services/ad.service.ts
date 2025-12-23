// server/services/ad.service.ts

import type { IAd, IAdResponse, IAdUpdate } from "$interfaces/ad.interface";
import Ad from "$models/ad.model";

/**
 * 建立新的廣告
 *
 * @param adData 廣告資料
 * @returns 建立的廣告
 */
export async function createAd(adData: Partial<IAd>) {
    const ad = new Ad(adData);
    await ad.save();

    return ad.toObject<IAdResponse>();
}

/**
 * 根據 ID 取得廣告
 *
 * @param adId 廣告 ID
 * @returns 廣告資料或 null
 */
export async function getAdById(id: string) {
    const ad = await Ad.findById(id).lean<IAdResponse>();
    return ad;
}

/**
 * 取得隨機廣告
 *
 * @returns 隨機廣告
 */
export async function getRandomAd() {
    const ads = await Ad.aggregate<IAdResponse>([{ $sample: { size: 1 } }]);
    return ads[0];
}

/**
 * 取得所有廣告
 *
 * @returns 廣告列表
 */
export async function getAllAds() {
    const ads = await Ad.find().sort({ createdAt: -1 }).lean<IAdResponse[]>();
    return ads;
}

/**
 * 更新廣告
 * @param adId 廣告 ID
 * @param updateData 更新資料
 * @returns 更新後的廣告或 null
 */
export async function updateAd(adId: string, updateData: IAdUpdate) {
    const ad = await Ad.findByIdAndUpdate(adId, updateData, { new: true }).lean<IAdResponse>();
    return ad;
}

/**
 * 刪除廣告
 * @param adId 廣告 ID
 * @returns 刪除結果
 */
export async function deleteAd(adId: string) {
    const result = await Ad.findByIdAndDelete(adId);
    return result !== null;
}
