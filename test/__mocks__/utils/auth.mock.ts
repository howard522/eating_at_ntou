// test/__mocks__/utils/auth.mock.ts

import { vi } from "vitest";

const authUtilsMocks = vi.hoisted(() => ({
    signJwt: vi.fn(),
}));

export const mockAuthUtils = () => {
    vi.mock("@server/utils/auth", () => ({
        signJwt: authUtilsMocks.signJwt,
    }));
};

export { authUtilsMocks };
