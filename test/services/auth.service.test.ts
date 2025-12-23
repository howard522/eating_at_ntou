// test/services/auth.service.test.ts

import { mockUserService, userServiceMocks as mocks } from "@mocks/services/user.service.mock";
import { authUtilsMocks, mockAuthUtils } from "@mocks/utils/auth.mock";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

mockUserService();
mockAuthUtils();

const signJwtMock = authUtilsMocks.signJwt;

// ---------------------------------------------------------------------
// Import 要測試的功能
// ---------------------------------------------------------------------

import { banUser, changeUserPassword, loginUser, registerUser, unbanUser } from "$services/auth.service";

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("auth.service - 使用者驗證相關", () => {
    describe("registerUser - 註冊使用者", () => {
        it("當 email 已存在時，應該拋出衝突錯誤", async () => {
            const user = { _id: "u1" };
            mocks.getUserByEmail.mockResolvedValue(user);

            const result = registerUser({ email: "a@test", password: "123456", name: "A", role: "multi" });

            expect(mocks.getUserByEmail).toHaveBeenCalledWith("a@test");
            expect(result).rejects.toHaveProperty("statusCode", 409);
        });

        it("當密碼過短時，應該拋出驗證錯誤", async () => {
            mocks.getUserByEmail.mockResolvedValue(null);

            const result = registerUser({ email: "a@test", password: "123", name: "A", role: "multi" });

            expect(mocks.getUserByEmail).toHaveBeenCalledWith("a@test");
            expect(result).rejects.toHaveProperty("statusCode", 422);
        });

        it("當註冊成功時，應該建立使用者並回傳 token", async () => {
            // 這裡應該要改成 _id 才對
            const user = { id: "u2", role: "multi" },
                token = "token-123";
            mocks.getUserByEmail.mockResolvedValue(null);
            mocks.createUser.mockResolvedValue(user);
            signJwtMock.mockReturnValue(token);

            const result = await registerUser({ email: "a@test", password: "123456", name: "A", role: "multi" });

            expect(mocks.getUserByEmail).toHaveBeenCalledWith("a@test");
            expect(mocks.createUser).toHaveBeenCalled();
            expect(signJwtMock).toHaveBeenCalledWith("u2", "multi");
            expect(result).toStrictEqual({ user, token });
        });
    });

    describe("loginUser - 登入使用者", () => {
        it("當使用者不存在時，應該拋出未授權錯誤", async () => {
            mocks.getUserByEmail.mockResolvedValue(null);

            const result = loginUser("a@test", "password");

            expect(mocks.getUserByEmail).toHaveBeenCalledWith("a@test");
            expect(result).rejects.toHaveProperty("statusCode", 401);
        });

        it("當密碼不匹配時，應該拋出未授權錯誤", async () => {
            const user = { _id: "u3", role: "multi" };
            mocks.getUserByEmail.mockResolvedValue(user);
            mocks.verifyUserCanLogin.mockResolvedValue({ result: true });
            mocks.verifyUserPasswordById.mockResolvedValue(false);

            const result = loginUser("a@test", "wrong_password");
            expect(mocks.getUserByEmail).toHaveBeenCalledWith("a@test");
            expect(result).rejects.toHaveProperty("statusCode", 401);
        });

        it("當使用者被封鎖時，應該拋出禁止存取錯誤", async () => {
            const user = { _id: "u4", role: "banned" };
            mocks.getUserByEmail.mockResolvedValue(user);
            mocks.verifyUserCanLogin.mockResolvedValue({ result: true });
            mocks.verifyUserPasswordById.mockResolvedValue(true);

            const result = loginUser("a@test", "password");

            expect(mocks.getUserByEmail).toHaveBeenCalledWith("a@test");
            expect(result).rejects.toHaveProperty("statusCode", 403);
        });

        it("當登入成功時，應該回傳 token", async () => {
            const user = { _id: "u5", role: "multi" },
                token = "token-xyz";
            mocks.getUserByEmail.mockResolvedValue(user);
            mocks.verifyUserCanLogin.mockResolvedValue({ result: true });
            mocks.verifyUserPasswordById.mockResolvedValue(true);
            mocks.incrementUserLoginFailureCount.mockResolvedValue(undefined);
            signJwtMock.mockReturnValue(token);

            const result = await loginUser("a@test", "password");

            expect(mocks.getUserByEmail).toHaveBeenCalledWith("a@test");
            expect(mocks.verifyUserPasswordById).toHaveBeenCalledWith("u5", "password");
            expect(signJwtMock).toHaveBeenCalledWith("u5", "multi");
            expect(result).toEqual({ user, token });
        });
    });

    describe("changeUserPassword - 更改使用者密碼", () => {
        it("當使用者不存在時，應該拋出未授權錯誤", async () => {
            mocks.getUserById.mockResolvedValue(null);

            const result = changeUserPassword("u1", "old", "newpass");

            expect(mocks.getUserById).toHaveBeenCalledWith("u1");
            expect(result).rejects.toHaveProperty("statusCode", 401);
        });

        it("當目前密碼錯誤時，應該拋出未授權錯誤", async () => {
            mocks.getUserById.mockResolvedValue({ _id: "u1" });
            mocks.verifyUserPasswordById.mockResolvedValue(false);

            const result = changeUserPassword("u1", "old", "newpass");

            expect(mocks.getUserById).toHaveBeenCalledWith("u1");
            expect(result).rejects.toHaveProperty("statusCode", 401);
        });

        it("當新密碼過短時，應該拋出錯誤", async () => {
            mocks.getUserById.mockResolvedValue({ _id: "u1" });
            mocks.verifyUserPasswordById.mockResolvedValue(true);

            const result = changeUserPassword("u1", "old", "123");

            expect(mocks.getUserById).toHaveBeenCalledWith("u1");
            expect(result).rejects.toHaveProperty("statusCode", 400);
        });

        it("當有效時，應該更新密碼", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1" });
            mocks.verifyUserPasswordById.mockResolvedValue(true);
            mocks.updateUserPasswordById.mockResolvedValue(undefined);

            await changeUserPassword("u1", "old", "newpass");

            expect(mocks.getUserById).toHaveBeenCalledWith("u1");
            expect(mocks.updateUserPasswordById).toHaveBeenCalledWith("u1", "newpass");
        });
    });
});

describe("auth.service - 使用者管理相關", () => {
    describe("banUser - 封鎖使用者", () => {
        it("當使用者不存在時，應該拋出找不到錯誤", async () => {
            mocks.getUserById.mockResolvedValue(null);

            const result = banUser("u1");

            expect(result).rejects.toHaveProperty("statusCode", 404);
        });

        it("當使用者為管理員時，應該拋出禁止存取錯誤", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "admin" });

            const result = banUser("u1");

            expect(result).rejects.toHaveProperty("statusCode", 403);
        });

        it("當使用者角色更新為封鎖時，應該成功更新", async () => {
            const new_user = { id: "u1", role: "banned" };
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "multi" });
            mocks.updateUser.mockResolvedValue(new_user);

            const result = await banUser("u1");

            expect(mocks.updateUser).toHaveBeenCalledWith("u1", { role: "banned" });
            expect(result).toStrictEqual({ userId: "u1", role: "banned" });
        });
    });

    describe("unbanUser - 解除封鎖使用者", () => {
        it("當使用者不存在時，應該拋出找不到錯誤", async () => {
            mocks.getUserById.mockResolvedValue(null);

            const result = unbanUser("u1");

            expect(result).rejects.toHaveProperty("statusCode", 404);
        });

        it("當使用者未被封鎖時，應該拋出錯誤", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "multi" });

            const result = unbanUser("u1");

            expect(result).rejects.toHaveProperty("statusCode", 400);
        });

        it("當解除封鎖成功時，應該更新角色為 multi", async () => {
            mocks.getUserById.mockResolvedValue({ id: "u1", role: "banned" });
            mocks.updateUser.mockResolvedValue({ id: "u1", role: "multi" });

            const result = await unbanUser("u1");

            expect(mocks.updateUser).toHaveBeenCalledWith("u1", { role: "multi" });
            expect(result).toEqual({ userId: "u1", role: "multi" });
        });
    });
});
