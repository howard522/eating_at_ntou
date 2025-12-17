// test/__mocks__/utils/object.mock.ts

import { vi } from "vitest";

const cleanObjectMock = vi.fn().mockImplementation((obj: any) => {
    return obj; // 簡單模擬，直接回傳原物件
});

export const mockObjectUtils = () => {
    vi.mock("@server/utils/object", () => ({
        cleanObject: cleanObjectMock,
    }));
};
