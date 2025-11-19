// server/utils/parseForm.ts

import { getGeocodeFromAddress } from "@server/utils/nominatim";
import { uploadImageToImageBB } from "@server/utils/uploadImage";
import type { UpdateRestaurantBody } from "@server/interfaces/restaurant.interface";

/**
 * 解析表單欄位，將 JSON 字串轉換為物件、陣列或字串
 *
 * @param field 欄位值
 * @returns 解析後的值
 */
export function parseFormField(field: string): any {
    let val = field.trim();
    if (val.startsWith("{") || val.startsWith("[")) {
        try {
            val = JSON.parse(val);
        } catch {
            return field; // 回傳原始字串
        }
    }
    return val;
}

/**
 * 解析餐廳更新表單，處理圖片上傳與地理編碼
 *
 * @param form 請求傳入的 multipart/form-data 表單資料
 * @returns 餐廳更新資料物件
 */
export async function parseRestaurantForm(
    form: Awaited<ReturnType<typeof readMultipartFormData>>
): Promise<UpdateRestaurantBody> {
    const data: UpdateRestaurantBody = {};

    for (const field of form ?? []) {
        // 餐廳封面圖
        if (field.name === "image" && typeof field.type === "string" && field.type.startsWith("image/")) {
            const imageURL = await uploadImageToImageBB({
                type: field.type,
                data: field.data,
            });
            if (imageURL) {
                data.image = imageURL;
            }
            continue;
        }

        // 文字欄位
        let val = field.data.toString();
        data[field.name as keyof UpdateRestaurantBody] = parseFormField(val);
    }

    // 自動地理編碼
    if (data.address) {
        data.locationGeo = await getGeocodeFromAddress(data.address);
    }

    return data;
}
