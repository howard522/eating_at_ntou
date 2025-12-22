// test/vitest.setup.ts

import { mockAdModel } from "@mocks/models/ad.model.mock";
import { mockCartModel } from "@mocks/models/cart.model.mock";
import { mockChatMessageModel } from "@mocks/models/chatMessage.model.mock";
import { mockRestaurantModel } from "@mocks/models/restaurant.model.mock";
import { mockReviewModel } from "@mocks/models/review.model.mock";
import { mockUserModel } from "@mocks/models/user.model.mock";
import { afterAll, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定全域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

mockAdModel();
mockCartModel();
mockChatMessageModel();
mockRestaurantModel();
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
