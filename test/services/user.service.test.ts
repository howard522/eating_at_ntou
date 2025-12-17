// test/services/user.service.test.ts

import {
    createUser,
    getUserByEmail,
    getUserById,
    searchUsers,
    updateUser,
    updateUserPasswordById,
    verifyUserPasswordById,
} from "@server/services/user.service";
import { createDocumentMock } from "@test/__mocks__/document.mock";
import { createChainedQueryMock } from "@test/__mocks__/query.mock";
import { userMocks as mocks } from "@test/__mocks__/models/user.model.mock";
import { mockObjectUtils } from "@test/__mocks__/utils/object.mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------
// 在這裡設定區域的 mocks 或測試前置條件
// ---------------------------------------------------------------------

mockObjectUtils();

beforeEach(() => {
    mocks.userInstances.length = 0;
});

// ---------------------------------------------------------------------
// 測試開始
// ---------------------------------------------------------------------

describe("user.service - 密碼相關功能", () => {
    it("verifyUserPasswordById - 當使用者密碼正確時，應回傳 true", async () => {
        const user = new mocks.UserMock({ _id: "u1", password: "secret" });
        // 這裡是 select 需要回傳 user
        mocks.findById.mockReturnValue(createChainedQueryMock(user, ["select"]));

        const result = await verifyUserPasswordById("u1", "secret");

        expect(mocks.findById).toHaveBeenCalledWith("u1");
        expect(result).toBe(true);
    });

    it("verifyUserPasswordById - 當使用者密碼錯誤時，應回傳 false", async () => {
        const user = new mocks.UserMock({ _id: "u1", password: "secret" });
        // 這裡是 select 需要回傳 user
        mocks.findById.mockReturnValue(createChainedQueryMock(user, ["select"]));

        const result = await verifyUserPasswordById("u1", "wrongpwd");

        expect(mocks.findById).toHaveBeenCalledWith("u1");
        expect(result).toBe(false);
    });

    it("verifyUserPasswordById - 當使用者不存在時，應回傳 false", async () => {
        mocks.findById.mockReturnValue(createChainedQueryMock(null, ["select"]));

        const result = await verifyUserPasswordById("missing", "pwd");

        expect(mocks.findById).toHaveBeenCalledWith("missing");
        expect(result).toBe(false);
    });

    // -----------------------------

    it("updateUserPasswordById - 當使用者存在並成功更新密碼時，應回傳 true", async () => {
        const user = new mocks.UserMock({ _id: "u2", name: "A", password: "oldpass" });
        mocks.findById.mockResolvedValue(user); // 這裡沒有 chained query

        const result = await updateUserPasswordById("u2", "newpass");

        expect(mocks.findById).toHaveBeenCalledWith("u2");
        expect(user.password).toBe("hashed_newpass");
        expect(user.save).toHaveBeenCalled();
        expect(result).toEqual(true);
    });

    it("updateUserPasswordById - 當使用者不存在時，應回傳 false", async () => {
        mocks.findById.mockResolvedValue(null);

        const result = await updateUserPasswordById("missing", "pwd");

        expect(mocks.findById).toHaveBeenCalledWith("missing");
        expect(result).toEqual(false);
    });
});

// ---------------------------------------------------------------------

describe("user.service - CRUD 操作", () => {
    it("createUser - 當成功建立使用者時，應回傳包含 id 的使用者物件", async () => {
        const data = { name: "New", email: "n@test", password: "pwd" };
        const userDoc = createDocumentMock({ _id: "user-new", ...data }, { id: "user-new" }); // 假設儲存後的文件
        mocks.findById.mockReturnValue(createChainedQueryMock(userDoc, ["select"]));

        const result = await createUser(data);

        expect(mocks.userInstances).toHaveLength(1);
        expect(mocks.userInstances[0].save).toHaveBeenCalled();
        expect(result).toMatchObject({ id: "user-new", name: "New", email: "n@test" });
    });

    // -----------------------------

    it("getUserById - 當成功找到使用者時，應回傳包含 id、name 的使用者物件", async () => {
        // 這裡包含 virtual 屬性 id = _id
        const userDoc = createDocumentMock({ _id: "u3", name: "User" }, { id: "u3" });
        mocks.findById.mockReturnValue(createChainedQueryMock(userDoc, ["select"]));

        const result = await getUserById("u3");

        expect(mocks.findById).toHaveBeenCalledWith("u3");
        expect(mocks.findById().select).toHaveBeenCalledWith("-password");
        expect(userDoc.toObject).toHaveBeenCalled();
        expect(result).toEqual({ id: "u3", _id: "u3", name: "User" });
    });

    it("getUserById - 當找不到使用者時，應回傳 null", async () => {
        mocks.findById.mockReturnValue(createChainedQueryMock(null, ["select"]));

        const result = await getUserById("missing");

        expect(mocks.findById).toHaveBeenCalledWith("missing");
        expect(mocks.findById().select).toHaveBeenCalledWith("-password");
        expect(result).toBeNull();
    });

    // -----------------------------

    it("getUserByEmail - 當成功找到使用者時，應回傳包含 id、name、email 的使用者物件", async () => {
        const userDoc = createDocumentMock({ _id: "u4", name: "User", email: "u4@test" }, { id: "u4" });
        mocks.findOne.mockReturnValue(createChainedQueryMock(userDoc, ["select"]));

        const result = await getUserByEmail("u4@test");

        expect(mocks.findOne).toHaveBeenCalledWith({ email: "u4@test" });
        expect(result).toEqual({ id: "u4", _id: "u4", name: "User", email: "u4@test" });
    });

    it("getUserByEmail - 當找不到使用者時，應回傳 null", async () => {
        mocks.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

        const result = await getUserByEmail("missing@test");

        expect(result).toBeNull();
    });

    // -----------------------------

    it("searchUsers - 當應用過濾器、分頁與排序條件時，應回傳正確的使用者清單", async () => {
        const docs = [
            createDocumentMock({ _id: "u5", name: "Ann" }, { id: "u5" }),
            createDocumentMock({ _id: "u6", name: "Bob" }, { id: "u6" }),
        ];
        // 這裡不用真的模擬篩選邏輯，只要確保 chained query 正確被呼叫即可
        mocks.find.mockReturnValue(createChainedQueryMock(docs, ["limit"]));

        const result = await searchUsers({
            role: "multi",
            query: "An",
            limit: 2,
            skip: 1,
            sortBy: { createdAt: 1 },
        });

        expect(mocks.find).toHaveBeenCalled();
        const filterArg = mocks.find.mock.calls[0]?.[0];
        expect(filterArg.role).toBe("multi");
        expect(filterArg.$or?.length).toBe(2);
        expect(mocks.find().select).toHaveBeenCalledWith("-password");
        expect(mocks.find().sort).toHaveBeenCalledWith({ createdAt: 1 });
        expect(mocks.find().skip).toHaveBeenCalledWith(1);
        expect(mocks.find().limit).toHaveBeenCalledWith(2);
        expect(result).toEqual([
            { id: "u5", _id: "u5", name: "Ann" },
            { id: "u6", _id: "u6", name: "Bob" },
        ]);
    });

    // -----------------------------

    it("updateUser - 當成功更新使用者資料時，應回傳更新後的使用者物件", async () => {
        const userDoc = createDocumentMock({ _id: "u7", name: "New" }, { id: "u7" });
        mocks.findByIdAndUpdate.mockReturnValue(createChainedQueryMock(userDoc, ["select"]));

        const result = await updateUser("u7", { name: "New" });

        expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith("u7", { name: "New" }, { new: true });
        expect(result).toEqual({ id: "u7", _id: "u7", name: "New" });
    });

    it("updateUser - 當找不到使用者時，應回傳 null", async () => {
        mocks.findByIdAndUpdate.mockReturnValue(createChainedQueryMock(null, ["select"]));
        const resultNull = await updateUser("u8", { name: "None" });
        expect(resultNull).toBeNull();
    });
});
