// server/utils/mongoQuery.ts

import type { FilterQuery } from "mongoose";
import type { IRestaurant } from "@server/interfaces/restaurant.interface";

const escapeRegex = (text: string) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * 根據搜尋字串建立 MongoDB 查詢物件
 *
 * 支援多個關鍵字（以空白分隔），並在 `name`、`info`、`address`、`menu.name` 欄位中進行模糊不區分大小寫的匹配。
 * @param search 搜尋字串
 * @param options.maxTerms 最大關鍵字數量（預設 5）
 * @param options.maxTermLength 單一關鍵字最大長度（預設 50）
 * @returns MongoDB 查詢物件
 */
export function buildRestaurantSearchQuery(
    search: string,
    options?: {
        maxTerms?: number;
        maxTermLength?: number;
    }
): FilterQuery<IRestaurant> {
    const MAX_TERMS = options?.maxTerms ?? 5;
    const MAX_TERM_LEN = options?.maxTermLength ?? 50;

    // 以空白拆詞（支援多個關鍵字），並限制數量與長度
    const terms = search
        .trim()
        .split(/\s+/)
        .map((t) => t.trim().slice(0, MAX_TERM_LEN))
        .filter(Boolean)
        .slice(0, MAX_TERMS);

    // 若沒有關鍵字，回傳空查詢
    if (terms.length === 0) {
        return {};
    }

    // 若任一關鍵字符合即可：把每個欄位的 match 都放入同一個 $or，
    // 使用者輸入多個關鍵字時，任何一個詞匹配就會被回傳。
    const orClauses = terms.flatMap((term) => {
        const re = new RegExp(escapeRegex(term), "i");
        return [
            { name: { $regex: re } },
            { info: { $regex: re } },
            { address: { $regex: re } },
            { "menu.name": { $regex: re } },
            // { tags: { $regex: re } },
            // { phone: { $regex: re } },
        ];
    });

    return { $or: orClauses };
}
