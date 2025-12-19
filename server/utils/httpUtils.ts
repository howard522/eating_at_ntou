// server/utils/httpUtils.ts

import { HttpStatus, HttpStatusMessage } from "$interfaces/httpStatus";

/**
 * 建立 HTTP 錯誤物件的輔助函式
 *
 * @param status HTTP 狀態碼
 * @param message 錯誤訊息
 * @returns HTTP 錯誤物件
 */
export function createHttpError(status: HttpStatus, message: string) {
    const statusMessage = HttpStatusMessage[status] || "Unknown Error";

    return createError({ statusCode: status, statusMessage, message });
}

export { HttpStatus }; // 重新導出 HttpStatus 列舉，以便其他模組使用
