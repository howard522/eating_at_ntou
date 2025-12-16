// test/__mocks__/queryMock.ts

import { vi } from "vitest";

type ChainMethods = "populate" | "select" | "sort" | "skip" | "limit" | "lean";

/**
 * 建立支援鏈式呼叫的 mock 查詢物件
 * 包含 populate, select, sort, skip, limit, lean 方法
 * 並可檢查呼叫順序
 *
 * @param returnValue 查詢最終應回傳的值
 */
export function createChainedQueryMock<T>(returnValue: T) {
    // 定義理想的呼叫順序
    const idealOrder: ChainMethods[] = ["populate", "select", "sort", "skip", "limit", "lean"];
    const calls: ChainMethods[] = [];

    // 先宣告方法變數物件
    const methods: Partial<Record<ChainMethods, any>> = {};

    // 為每個方法建立 mock 實作
    idealOrder.forEach((method) => {
        if (method === "lean") {
            methods[method] = vi.fn(async () => {
                calls.push(method);
                return returnValue;
            });
        } else {
            methods[method] = vi.fn(() => {
                calls.push(method);
                return methods;
            });
        }
    });

    // 驗證呼叫順序的方法
    function verifyOrder() {
        const expected = idealOrder.filter((m) => calls.includes(m)); // 只檢查被呼叫過的方法
        if (JSON.stringify(calls) !== JSON.stringify(expected)) {
            throw new Error(`鏈式方法呼叫順序錯誤。實際: [${calls.join(", ")}], 預期: [${expected.join(", ")}]`);
        }
    }

    return { ...methods, verifyOrder };
}
