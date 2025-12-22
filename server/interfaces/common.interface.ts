// server/interfaces/common.interface.ts

import type { Types } from "mongoose";

// --------------------
// DTO 相關
// --------------------

// 可接受的 ObjectId 型別
export type ObjectIdLike = string | Types.ObjectId;

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

/**
 * 包含時間戳記的介面
 */
export interface WithTimestamps {
    createdAt?: Date;
    updatedAt?: Date;
}

// --------------------
// 查詢、分頁相關
// --------------------

/**
 * 查詢分頁選項介面
 *
 * @property limit 每頁筆數
 * @property skip 跳過筆數
 * @property sortBy 排序方式 (例如 { createdAt: -1 } 表示依建立時間由新到舊排序)
 */
export interface QueryPaginationOptions {
    limit?: number;
    skip?: number;
    sortBy?: Record<string, 1 | -1>; // 例如 { createdAt: -1 }
}

// --------------------
// 其他
// --------------------

export type ImageURL = { imageURL?: string };

/**
 * 圖片檔案介面
 */
export interface ImageFile {
    data: Uint8Array;
    type?: string;
    filename?: string;
}
