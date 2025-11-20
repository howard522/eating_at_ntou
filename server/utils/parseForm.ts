// server/utils/parseForm.ts

import { uploadImageToImageBB } from "@server/utils/uploadImage";

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
 * 解析 multipart/form-data 表單資料，並處理圖片上傳
 * 支援泛型 T 以符合不同的資料結構
 *
 * @param form 表單資料
 * @returns 解析後的資料物件
 */
export async function parseForm<T extends Record<string, any>>(
    form: Awaited<ReturnType<typeof readMultipartFormData>>
): Promise<T> {
    const data: Partial<T> = {};

    for (const field of form ?? []) {
        // 圖片欄位要上傳到 ImgBB
        if (field.name === "image" && field.type?.startsWith("image/")) {
            const imageURL = await uploadImageToImageBB({
                type: field.type,
                data: field.data,
                filename: field.filename,
            });

            if (imageURL) {
                data["image" as keyof T] = imageURL as any;
            }

            continue;
        }

        // 文字欄位
        let val = field.data.toString();
        data[field.name as keyof T] = parseFormField(val);
    }

    return data as T;
}
