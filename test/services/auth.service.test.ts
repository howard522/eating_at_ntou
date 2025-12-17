// test/services/auth.service.test.ts

import { mockAuthUtils, signJwtMock } from "@test/__mocks__/utils/auth.mock";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

const mocks = vi.hoisted(() => {
    return {
        getUserByEmail: vi.fn(),
        createUser: vi.fn(),
        verifyUserPasswordById: vi.fn(),
        getUserById: vi.fn(),
        updateUserPasswordById: vi.fn(),
        updateUser: vi.fn(),
    };
});

vi.mock("./user.service", () => ({
    getUserByEmail: mocks.getUserByEmail,
    createUser: mocks.createUser,
    verifyUserPasswordById: mocks.verifyUserPasswordById,
    getUserById: mocks.getUserById,
    updateUserPasswordById: mocks.updateUserPasswordById,
    updateUser: mocks.updateUser,
}));

mockAuthUtils();

// ---------------------------------------------------------------------
// Import 要測試的功能
// ---------------------------------------------------------------------

import { banUser, changeUserPassword, loginUser, registerUser, unbanUser } from "@server/services/auth.service";

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("auth.service", () => {
    describe("registerUser", () => {
        it("should throw conflict if email already exists", async () => {
            mocks.getUserByEmail.mockResolvedValue({ id: "u1" });

            await expect(
                registerUser({ email: "a@test", password: "123456", name: "A", role: "multi" })
            ).rejects.toHaveProperty("statusCode", 409);
        });

        it("should throw 422 for short password", async () => {
            mocks.getUserByEmail.mockResolvedValue(null);

            await expect(
                registerUser({ email: "a@test", password: "123", name: "A", role: "multi" })
            ).rejects.toHaveProperty("statusCode", 422);
        });

        it("should create user and return token", async () => {
            const user = { id: "u2", role: "multi" };
            mocks.getUserByEmail.mockResolvedValue(null);
            mocks.createUser.mockResolvedValue(user);
            signJwtMock.mockReturnValue("token-123");

            const result = await registerUser({ email: "a@test", password: "123456", name: "A", role: "multi" });

            expect(mocks.createUser).toHaveBeenCalled();
            expect(signJwtMock).toHaveBeenCalledWith("u2", "multi");
            expect(result).toEqual({ user, token: "token-123" });
        });
    });

    describe("loginUser", () => {
        it("should 401 when user missing", async () => {
            mocks.getUserByEmail.mockResolvedValue(null);

            await expect(loginUser("a@test", "pwd")).rejects.toHaveProperty("statusCode", 401);
        });

        it("should 401 when password mismatch", async () => {
            const user = { id: "u3", role: "multi" };
            mocks.getUserByEmail.mockResolvedValue(user);
            mocks.verifyUserPasswordById.mockResolvedValue(false);

            await expect(loginUser("a@test", "pwd")).rejects.toHaveProperty("statusCode", 401);
        });

        it("should 403 when user banned", async () => {
            const user = { id: "u4", role: "banned" };
            mocks.getUserByEmail.mockResolvedValue(user);
            mocks.verifyUserPasswordById.mockResolvedValue(true);

            await expect(loginUser("a@test", "pwd")).rejects.toHaveProperty("statusCode", 403);
        });

        it("should return token when ok", async () => {
            const user = { id: "u5", role: "delivery" };
            mocks.getUserByEmail.mockResolvedValue(user);
            mocks.verifyUserPasswordById.mockResolvedValue(true);
            signJwtMock.mockReturnValue("token-xyz");

            const result = await loginUser("a@test", "pwd");

            expect(mocks.verifyUserPasswordById).toHaveBeenCalledWith("u5", "pwd");
            expect(signJwtMock).toHaveBeenCalledWith("u5", "delivery");
            expect(result).toEqual({ user, token: "token-xyz" });
        });
    });

    describe("changeUserPassword", () => {
        it("should 401 when user missing", async () => {
            mocks.getUserById.mockResolvedValue(null);

            await expect(changeUserPassword("u1", "old", "newpass")).rejects.toHaveProperty("statusCode", 401);
        });

        it("should 401 when current password wrong", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1" });
            mocks.verifyUserPasswordById.mockResolvedValue(false);

            await expect(changeUserPassword("u1", "old", "newpass")).rejects.toHaveProperty("statusCode", 401);
        });

        it("should 400 when new password too short", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1" });
            mocks.verifyUserPasswordById.mockResolvedValue(true);

            await expect(changeUserPassword("u1", "old", "123")).rejects.toHaveProperty("statusCode", 400);
        });

        it("should update password when valid", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1" });
            mocks.verifyUserPasswordById.mockResolvedValue(true);
            mocks.updateUserPasswordById.mockResolvedValue(undefined);

            await changeUserPassword("u1", "old", "newpass");

            expect(mocks.updateUserPasswordById).toHaveBeenCalledWith("u1", "newpass");
        });
    });

    describe("banUser", () => {
        it("should 404 when user missing", async () => {
            mocks.getUserById.mockResolvedValue(null);

            await expect(banUser("u1")).rejects.toHaveProperty("statusCode", 404);
        });

        it("should 403 when user admin", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "admin" });

            await expect(banUser("u1")).rejects.toHaveProperty("statusCode", 403);
        });

        it("should update role to banned", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "multi" });
            mocks.updateUser.mockResolvedValue({ id: "u1", role: "banned" });

            const result = await banUser("u1");

            expect(mocks.updateUser).toHaveBeenCalledWith("u1", { role: "banned" });
            expect(result).toEqual({ userId: "u1", role: "banned" });
        });
    });

    describe("unbanUser", () => {
        it("should 404 when user missing", async () => {
            mocks.getUserById.mockResolvedValue(null);

            await expect(unbanUser("u1")).rejects.toHaveProperty("statusCode", 404);
        });

        it("should 400 when not banned", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "multi" });

            await expect(unbanUser("u1")).rejects.toHaveProperty("statusCode", 400);
        });

        it("should set role to multi", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "banned" });
            mocks.updateUser.mockResolvedValue({ id: "u1", role: "multi" });

            const result = await unbanUser("u1");

            expect(mocks.updateUser).toHaveBeenCalledWith("u1", { role: "multi" });
            expect(result).toEqual({ userId: "u1", role: "multi" });
        });
    });
});
