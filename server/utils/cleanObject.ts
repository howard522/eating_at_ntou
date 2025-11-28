// server/utils/cleanObject.ts

/**
 * 清理物件，移除值為 undefined、null、空字串或空陣列的欄位
 *
 * @param obj 要清理的物件
 * @returns 清理後的物件
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => {
            if (v === undefined || v === null) return false;
            if (typeof v === "string" && v.trim() === "") return false;
            if (Array.isArray(v) && v.length === 0) return false;
            return true;
        })
    ) as Partial<T>;
}
