// server/utils/parseNumber.ts

/**
 * 將輸入值解析為整數，若無法解析則回傳預設值
 * @param value 要解析的值
 * @param defaultValue 預設值
 * @param minimum 可選的最小值限制
 * @param maximum 可選的最大值限制
 * @returns 解析後的整數或預設值
 */
export function parseInteger(value: any, defaultValue: number, minimum?: number, maximum?: number): number {
    let parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
        return defaultValue;
    }

    if (minimum !== undefined) {
        parsed = Math.max(parsed, minimum);
    }

    if (maximum !== undefined) {
        parsed = Math.min(parsed, maximum);
    }

    return parsed;
}

/**
 * 將輸入值解析為浮點數，若無法解析則回傳預設值
 * @param value 要解析的值
 * @param defaultValue 預設值
 * @param minimum 可選的最小值限制
 * @param maximum 可選的最大值限制
 * @returns 解析後的浮點數或預設值
 */
export function parseFloatNumber(value: any, defaultValue: number, minimum?: number, maximum?: number): number {
    let parsed = parseFloat(value);

    if (isNaN(parsed)) {
        return defaultValue;
    }

    if (minimum !== undefined) {
        parsed = Math.max(parsed, minimum);
    }

    if (maximum !== undefined) {
        parsed = Math.min(parsed, maximum);
    }

    return parsed;
}
