// test/__mocks__/services/user.service.mock.ts

import { vi } from "vitest";

const userServiceMocks = vi.hoisted(() => ({
    verifyUserCanLogin: vi.fn(),
    incrementUserLoginFailureCount: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    verifyUserPasswordById: vi.fn(),
    getUserById: vi.fn(),
    updateUserPasswordById: vi.fn(),
    updateUser: vi.fn(),
}));

export const mockUserService = () => {
    vi.mock("$services/user.service", () => ({
        verifyUserCanLogin: userServiceMocks.verifyUserCanLogin,
        incrementUserLoginFailureCount: userServiceMocks.incrementUserLoginFailureCount,
        getUserByEmail: userServiceMocks.getUserByEmail,
        createUser: userServiceMocks.createUser,
        verifyUserPasswordById: userServiceMocks.verifyUserPasswordById,
        getUserById: userServiceMocks.getUserById,
        updateUserPasswordById: userServiceMocks.updateUserPasswordById,
        updateUser: userServiceMocks.updateUser,
    }));
};

export { userServiceMocks };
