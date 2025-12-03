// server/services/user.service.ts

import type { ObjectIdLike, QueryPaginationOptions } from "@server/interfaces/common.interface";
import type { IUser, RegisterBody, UserRole } from "@server/interfaces/user.interface";
import User from "@server/models/user.model";
import type { FilterQuery } from "mongoose";

/**
 * 很奇妙的，唯獨在使用者這邊，我們需要使用 `id` 屬性來代表使用者 ID，
 * 但在資料庫模型中，使用的是 `_id` 屬性。
 * 因此，我們需要一個輔助函式來將 Mongoose 文件轉換為包含 `id` 屬性的物件。
 *
 * @param user Mongoose 使用者文件
 * @returns 包含 `id` 屬性的使用者物件
 */
function replaceIdField(user: Omit<IUser, "id"> & { _id: ObjectIdLike }): IUser {
    const id = user._id;
    return { id, ...user };
}

// --------------------

/**
 * 驗證使用者密碼是否正確
 *
 * 注意：出於安全性考量，平常 CRUD 查詢都不會回傳密碼欄位。
 * 這個函式是例外，會查詢使用者密碼以便進行驗證。
 *
 * @param userId 使用者 ID
 * @param password 要驗證的密碼
 * @returns 密碼是否正確
 * @throws 若使用者不存在則拋出錯誤
 */
export async function verifyUserPasswordById(userId: ObjectIdLike, password: string) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
        return false;
    }

    return await user.comparePassword(password);
}

/**
 * 變更使用者密碼
 *
 * @param userId 使用者 ID
 * @param newPassword 新密碼
 * @returns 回傳更新後的使用者資料物件，若找不到使用者則回傳 null
 */
export async function updateUserPasswordById(userId: ObjectIdLike, newPassword: string) {
    const user = await User.findByIdAndUpdate(userId, { password: newPassword }, { new: true }).select("-password");

    if (!user) {
        return null;
    }

    return replaceIdField(user.toObject<IUser>());
}

/**
 * 建立新使用者帳號
 *
 * @param data 使用者註冊資料
 * @returns 回傳建立的使用者資料物件
 */
export async function createUser(data: RegisterBody): Promise<IUser> {
    // 預設不指定 img/address/phone?
    const user = new User(data);

    await user.save();

    return replaceIdField(user.toObject<IUser>());
}

/**
 * 透過使用者 ID 獲取使用者資料
 *
 * @param userId 使用者 ID
 * @returns 回傳使用者資料物件，若找不到則回傳 null
 */
export async function getUserById(userId: ObjectIdLike) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
        return null;
    }

    return replaceIdField(user.toObject<IUser>());
}

/**
 * 透過電子郵件獲取使用者資料
 *
 * @param email 使用者的電子郵件地址
 * @returns 回傳使用者資料物件，若找不到則回傳 null
 */
export async function getUserByEmail(email: string) {
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
        return null;
    }

    return replaceIdField(user.toObject<IUser>());
}

/**
 * 搜尋使用者
 * @param options.role 使用者角色篩選
 * @param options.query 關鍵字查詢（搜尋 name 或 email）
 * @param options.limit 限制回傳數量
 * @param options.skip 跳過的數量（分頁用）
 * @param options.sortBy 排序方式
 * @returns 符合條件的使用者資料陣列
 */
export async function searchUsers(
    options: QueryPaginationOptions & {
        role?: UserRole;
        query?: string;
    }
) {
    const limit = options.limit ?? 50;
    const skip = options.skip ?? 0;
    const sortBy = options.sortBy ?? { createdAt: -1 };

    const filter: FilterQuery<IUser> = {};

    // 角色篩選
    if (options.role) {
        filter.role = options.role;
    }

    // 關鍵字查詢
    if (options.query) {
        const re = new RegExp(options.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: { $regex: re } }, { email: { $regex: re } }];
    }

    const users = await User.find(filter).select("-password").sort(sortBy).skip(skip).limit(limit);

    const data = users.map((user) => replaceIdField(user.toObject<IUser>()));

    return data;
}

export async function updateUser(userId: ObjectIdLike, updateData: Partial<IUser>) {
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    if (!user) {
        return null;
    }

    return replaceIdField(user.toObject<IUser>());
}
