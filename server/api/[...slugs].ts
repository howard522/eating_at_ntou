// server/api/[...slugs].ts

import { HttpStatus } from "$interfaces/httpStatus";
import { createHttpError } from "$utils/httpUtils";

/**
 * 這個檔案用來處理所有未定義的 API 路由請求，並回傳 404 錯誤。
 * 這樣可以確保當用戶請求一個不存在的 API 路由時，會得到適當的錯誤回應。
 */
export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname;

    throw createHttpError(HttpStatus.NotFound, `No API route found for ${path}`);
});
