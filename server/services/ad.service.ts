// server/services/ad.service.ts

import Ad from "@server/models/ad.model";
import type { IAd } from "@server/interfaces/ad.interface";

/**
 * 建立新的廣告
 *
 * @param adData 廣告資料
 * @returns 建立的廣告
 */
export async function createAd(adData: Partial<IAd>): Promise<IAd> {
    const ad = new Ad(adData);
    await ad.save();

    return ad;
}

/**
 * 根據 ID 取得廣告
 *
 * @param adId 廣告 ID
 * @returns 廣告資料或 null
 */
export async function getAdById(id: string): Promise<IAd | null> {
    const ad = await Ad.findById(id);
    return ad;
}

/**
 * 取得隨機廣告
 *
 * @returns 隨機廣告
 */
export async function getRandomAd(): Promise<IAd> {
    const ads = await Ad.aggregate([{ $sample: { size: 1 } }]);
    return ads[0];
}

/**
 * 取得所有廣告
 *
 * @returns 廣告列表
 */
export async function getAllAds(): Promise<IAd[]> {
    const ads = await Ad.find().sort({ createdAt: -1 });
    return ads;
}

/**
 * 更新廣告
 * @param adId 廣告 ID
 * @param updateData 更新資料
 * @returns 更新後的廣告或 null
 */
export async function updateAd(adId: string, updateData: Partial<IAd>): Promise<IAd | null> {
    const ad = await Ad.findByIdAndUpdate(adId, updateData, { new: true });
    return ad;
}

/**
 * 刪除廣告
 * @param adId 廣告 ID
 * @returns 刪除結果
 */
export async function deleteAd(adId: string): Promise<boolean> {
    const result = await Ad.findByIdAndDelete(adId);
    return result !== null;
}
