// test/vitest.setup.ts

import { mockReviewModel } from "@test/__mocks__/review.model.mock";
import { mockUserModel } from "@test/__mocks__/user.model.mock";
import { beforeEach, vi, afterAll } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定全域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

mockReviewModel();
mockUserModel();

// mock createError
vi.stubGlobal("createError", (err: any) => {
    return Object.assign(new Error(err.message || "Error"), err);
});

// 在每個測試前清除所有 mocks
beforeEach(() => {
    vi.clearAllMocks();
    // 避免測試時出現多餘的 console 輸出
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // 假設系統時間從 2025-05-14T11:45:14.000Z 開始執行
    const mockDate = new Date("2025-05-14T11:45:14.000Z");
    vi.useFakeTimers().setSystemTime(mockDate);
});

// 在所有測試結束後恢復真實時間
afterAll(() => {
    vi.useRealTimers();
});
