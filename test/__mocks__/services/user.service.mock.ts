// test/__mocks__/services/user.service.mock.ts

import { vi } from "vitest";

const userServiceMocks = vi.hoisted(() => ({
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    verifyUserPasswordById: vi.fn(),
    getUserById: vi.fn(),
    updateUserPasswordById: vi.fn(),
    updateUser: vi.fn(),
}));

export const mockUserService = () => {
    vi.mock("@server/services/user.service", () => ({
        getUserByEmail: userServiceMocks.getUserByEmail,
        createUser: userServiceMocks.createUser,
        verifyUserPasswordById: userServiceMocks.verifyUserPasswordById,
        getUserById: userServiceMocks.getUserById,
        updateUserPasswordById: userServiceMocks.updateUserPasswordById,
        updateUser: userServiceMocks.updateUser,
    }));
};

export { userServiceMocks };
