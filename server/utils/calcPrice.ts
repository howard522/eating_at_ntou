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
