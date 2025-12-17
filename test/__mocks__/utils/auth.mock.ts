// test/__mocks__/utils/auth.mock.ts

import { vi } from "vitest";

const signJwtMock = vi.fn();

export const mockAuthUtils = () => {
    vi.mock("@server/utils/auth", () => ({
        signJwt: signJwtMock,
    }));
};

export { signJwtMock };
