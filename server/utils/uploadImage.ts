// server/utils/uploadImage.ts

import type { ImageFile } from "@server/interfaces/common.interface";

const IMAGEBB_API_KEY = process.env.IMAGEBB_API_KEY || "";

/**
 * 上傳圖片到 ImgBB 並回傳圖片 URL
 *
 * @param file 要上傳的圖片檔案
 * @returns 上傳後的圖片 URL，若失敗則回傳 null
 */
export async function uploadImageToImageBB(file: ImageFile): Promise<string | null> {
    const blob = new Blob([new Uint8Array(file.data)], { type: file.type ?? "image/jpeg" });
    const formData = new FormData();
    formData.append("image", blob, file.filename ?? "image.jpg");

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`, {
        method: "POST",
        body: formData,
    });

    const json = await response.json();

    if (json.success) {
        return json.data.url;
    } else {
        // 錯誤回傳 null，不要拋錯誤
        console.error("Image upload failed: ", json);
        return null;
        // throw new Error("Image upload failed");
    }
}
