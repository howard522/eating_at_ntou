// test/__mocks__/utils/object.mock.ts

import { vi } from "vitest";

export const mockObjectUtils = () => {
    vi.mock("@server/utils/object", () => ({
        cleanObject: vi.fn(),
    }));
};
