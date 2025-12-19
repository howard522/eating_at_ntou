// test/__mocks__/query.mock.ts

import { vi } from "vitest";
import { createDocumentMock } from "./document.mock";

type ChainMethods = "populate" | "select" | "sort" | "skip" | "limit" | "lean";

/**
 * 建立模擬 Mongoose 鏈式查詢的 mock 物件
 * 支援 populate, select, sort, skip, limit, lean 方法
 * 並且可驗證方法呼叫順序是否正確
 *
 * @param returnValue 最終要回傳的值
 * @param resolveMethods 哪些方法應該回傳最終值（預設為 lean）
 */
export function createChainedQueryMock<T extends object | null>(
    returnValue: T,
    resolveMethods: ChainMethods[] = ["lean"]
) {
    // 定義理想的呼叫順序
    const idealOrder: ChainMethods[] = ["populate", "select", "sort", "skip", "limit", "lean"];
    const calls: ChainMethods[] = [];

    type QueryMockType = {
        [K in ChainMethods]: (...args: any[]) => any;
    } & {
        verifyOrder: () => void;
    };

    const queryMock: Partial<QueryMockType> = {};

    // 為每個方法建立 mock 實作
    idealOrder.forEach((method) => {
        if (resolveMethods.includes(method)) {
            queryMock[method] = vi.fn(async () => {
                calls.push(method);

                // 已經是 Document 了，直接返回
                if (returnValue && returnValue.save && returnValue.toObject) {
                    return returnValue;
                }

                // 如果是 `lean`，返回純物件
                if (method === "lean") return returnValue;

                // 如果返回的是陣列，則將每個元素模擬為 Document
                if (Array.isArray(returnValue)) {
                    // 如果陣列元素已經是 Document，則不需要再包一層
                    return returnValue.map((doc) => (doc && doc.save && doc.toObject ? doc : createDocumentMock(doc)));
                }

                // 如果返回的是單一對象，則將其模擬為 Document
                if (returnValue) {
                    return createDocumentMock(returnValue);
                }

                // 如果沒有返回值，則返回 null（模擬查無結果）
                return null;
            });
        } else {
            queryMock[method] = vi.fn((...args: any[]) => {
                calls.push(method);
                return queryMock;
            });
        }
    });

    // 驗證呼叫順序的方法
    queryMock.verifyOrder = () => {
        const expected = idealOrder.filter((m) => calls.includes(m)); // 只檢查被呼叫過的方法
        if (JSON.stringify(calls) !== JSON.stringify(expected)) {
            throw new Error(`鏈式方法呼叫順序錯誤。實際: [${calls.join(", ")}], 預期: [${expected.join(", ")}]`);
        }
    };

    return queryMock as QueryMockType;
}
