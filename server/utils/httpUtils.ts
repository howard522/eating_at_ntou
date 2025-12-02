import { HttpStatus, HttpStatusMessage } from "@server/interfaces/httpStatus";

/**
 * 建立 HTTP 錯誤物件的輔助函式
 *
 * @param status HTTP 狀態碼
 * @param message 錯誤訊息
 * @returns HTTP 錯誤物件
 */
export function createHttpError(status: HttpStatus, message: string) {
    return createError({ statusCode: status, statusMessage: HttpStatusMessage[status], message });
}
