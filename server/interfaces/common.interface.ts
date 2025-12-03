// server/interfaces/common.interface.ts

/**
 * 建立資料的通用型別
 *
 * T: 資料型別
 * K: 必填欄位的鍵值
 */
export type CreateBody<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

/**
 * 更新資料的通用型別
 *
 * T: 資料型別
 */
export type UpdateBody<T> = Partial<T>;

export type ImageURL = { imageURL?: string };

/**
 * 查詢分頁選項介面
 */
export interface QueryPaginationOptions {
    limit?: number;
    skip?: number;
}
