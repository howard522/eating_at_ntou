import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createUser,
    getUserByEmail,
    getUserById,
    searchUsers,
    updateUser,
    updateUserPasswordById,
    verifyUserPasswordById,
} from "./user.service";
import User from "@server/models/user.model";

const mocks = vi.hoisted(() => {
    return {
        findByIdMock: vi.fn(),
        findByIdAndUpdateMock: vi.fn(),
        findOneMock: vi.fn(),
        findMock: vi.fn(),
        userInstances: [] as any[],
    };
});

vi.mock("@server/models/user.model", () => {
    class UserMock {
        _id: any;
        password?: string;
        data: any;
        constructor(data: any) {
            this._id = data._id || "user-new";
            this.password = data.password;
            this.data = data;
            mocks.userInstances.push(this);
        }
        save = vi.fn().mockResolvedValue(undefined);
        toObject = () => ({ _id: this._id, ...this.data });
        comparePassword = vi.fn((pwd: string) => this.password === pwd);
        static findById = mocks.findByIdMock;
        static findByIdAndUpdate = mocks.findByIdAndUpdateMock;
        static findOne = mocks.findOneMock;
        static find = mocks.findMock;
    }
    return { default: UserMock };
});

const createErrorStub = (err: any) => Object.assign(new Error(err.message || "Error"), err);
vi.stubGlobal("createError", createErrorStub);

describe("user.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.userInstances.length = 0;
    });

    it("verifyUserPasswordById - return true when password matches", async () => {
        const userDoc = new (User as any)({ _id: "u1", password: "secret" });
        mocks.findByIdMock.mockReturnValue({ select: vi.fn().mockResolvedValue(userDoc) });

        const result = await verifyUserPasswordById("u1", "secret");

        expect(mocks.findByIdMock).toHaveBeenCalledWith("u1");
        expect(result).toBe(true);
    });

    it("verifyUserPasswordById - return false when user not found", async () => {
        mocks.findByIdMock.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

        const result = await verifyUserPasswordById("missing", "pwd");

        expect(result).toBe(false);
    });

    it("updateUserPasswordById - returns updated user when found", async () => {
        const userDoc = {
            _id: "u2",
            toObject: () => ({ _id: "u2", name: "A" }),
        } as any;
        mocks.findByIdAndUpdateMock.mockReturnValue({ select: vi.fn().mockResolvedValue(userDoc) });

        const result = await updateUserPasswordById("u2", "newpass");

        expect(mocks.findByIdAndUpdateMock).toHaveBeenCalledWith("u2", { password: "newpass" }, { new: true });
        expect(result).toEqual({ id: "u2", _id: "u2", name: "A" });
    });

    it("updateUserPasswordById - returns null when user missing", async () => {
        mocks.findByIdAndUpdateMock.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

        const result = await updateUserPasswordById("missing", "pwd");

        expect(result).toBeNull();
    });

    it("createUser - saves and returns object with id", async () => {
        const data = { name: "New", email: "n@test", password: "pwd" } as any;
        const result = await createUser(data);

        expect(mocks.userInstances).toHaveLength(1);
        expect(mocks.userInstances[0].save).toHaveBeenCalled();
        expect(result).toMatchObject({ id: "user-new", name: "New", email: "n@test" });
    });

    it("getUserById - returns object with id when found", async () => {
        const userDoc = { _id: "u3", toObject: () => ({ _id: "u3", name: "User" }) } as any;
        mocks.findByIdMock.mockReturnValue({ select: vi.fn().mockResolvedValue(userDoc) });

        const result = await getUserById("u3");

        expect(result).toEqual({ id: "u3", _id: "u3", name: "User" });
    });

    it("getUserById - returns null when not found", async () => {
        mocks.findByIdMock.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

        const result = await getUserById("missing");

        expect(result).toBeNull();
    });

    it("getUserByEmail - returns object with id when found", async () => {
        const userDoc = { _id: "u4", toObject: () => ({ _id: "u4", name: "User" }) } as any;
        mocks.findOneMock.mockReturnValue({ select: vi.fn().mockResolvedValue(userDoc) });

        const result = await getUserByEmail("u4@test");

        expect(mocks.findOneMock).toHaveBeenCalledWith({ email: "u4@test" });
        expect(result).toEqual({ id: "u4", _id: "u4", name: "User" });
    });

    it("getUserByEmail - returns null when not found", async () => {
        mocks.findOneMock.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

        const result = await getUserByEmail("missing@test");

        expect(result).toBeNull();
    });

    it("searchUsers - applies filters, pagination, and mapping", async () => {
        const docs = [
            { _id: "u5", toObject: () => ({ _id: "u5", name: "Ann" }) },
            { _id: "u6", toObject: () => ({ _id: "u6", name: "Bob" }) },
        ] as any;
        const limit = vi.fn().mockResolvedValue(docs);
        const skip = vi.fn().mockReturnValue({ limit });
        const sort = vi.fn().mockReturnValue({ skip });
        const select = vi.fn().mockReturnValue({ sort });
        mocks.findMock.mockReturnValue({ select });

        const result = await searchUsers({ role: "delivery", query: "An", limit: 2, skip: 1, sortBy: { createdAt: 1 } } as any);

        expect(mocks.findMock).toHaveBeenCalled();
        const filterArg = mocks.findMock.mock.calls[0][0];
        expect(filterArg.role).toBe("delivery");
        expect(filterArg.$or?.length).toBe(2);
        expect(select).toHaveBeenCalledWith("-password");
        expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
        expect(skip).toHaveBeenCalledWith(1);
        expect(limit).toHaveBeenCalledWith(2);
        expect(result).toEqual([
            { id: "u5", _id: "u5", name: "Ann" },
            { id: "u6", _id: "u6", name: "Bob" },
        ]);
    });

    it("updateUser - returns updated user or null", async () => {
        const userDoc = { _id: "u7", toObject: () => ({ _id: "u7", name: "New" }) } as any;
        const select = vi.fn().mockResolvedValue(userDoc);
        mocks.findByIdAndUpdateMock.mockReturnValue({ select });

        const result = await updateUser("u7", { name: "New" } as any);

        expect(mocks.findByIdAndUpdateMock).toHaveBeenCalledWith("u7", { name: "New" }, { new: true });
        expect(result).toEqual({ id: "u7", _id: "u7", name: "New" });

        select.mockResolvedValueOnce(null);
        const resultNull = await updateUser("u8", { name: "None" } as any);
        expect(resultNull).toBeNull();
    });
});
