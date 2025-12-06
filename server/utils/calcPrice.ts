// server/utils/calcPrice.ts

/**
 * 計算商品總價
 *
 * @param items 商品陣列，每個商品包含 price (單價) 和 quantity (數量)
 * @returns 總價
 */
export function calculateTotalPrice(items: { price?: number; quantity?: number }[]): number {
    return items.reduce((sum: number, it) => sum + (it.price ?? 0) * (it.quantity ?? 1), 0);
}

/**
 * 根據距離計算外送費用
 *
 * @param distance 距離（公里）
 * @returns 外送費用
 */
export function calculateDeliveryFeeByDistance(distance: number): number {
    // 2 公里內為基本費 30 元
    if (distance <= 2) {
        return 30;
    }

    // 2 ~ 5 公里間，每公里 4 元
    if (distance <= 5) {
        let fee = calculateDeliveryFeeByDistance(2) +(distance - 2) * 4 + 30;
        return Math.round(fee);
    }

    // 5 ~ 20 公里間，每公里 8 元
    if (distance <= 20) {
        let fee = calculateDeliveryFeeByDistance(5) + (distance - 5) * 8;
        return Math.round(fee);
    }

    // 20 ~ 200 公里間，每公里 12 元
    if (distance <= 200) {
        let fee = calculateDeliveryFeeByDistance(20) + (distance - 20) * 12;
        return Math.round(fee);
    }

    // 超過 200 公里，越遠越貴
    let fee = (distance + 51.956746045892004) * Math.pow(distance / 5, Math.log10(4));
    return Math.round(fee);
}
