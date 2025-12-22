// server/services/user.service.ts

import type { ObjectIdLike, QueryPaginationOptions } from "$interfaces/common.interface";
import type { IUserCreate, IUserResponse, IUserUpdate, UserRole } from "$interfaces/user.interface";
import User from "$models/user.model";
import { cleanObject } from "$utils/object";
import type { FilterQuery } from "mongoose";

/**
 * 很奇妙的，唯獨在使用者這邊，我們需要使用 `id` 屬性來代表使用者 ID，
 * 但在資料庫模型中，使用的是 `_id` 屬性。
 * 因此，我們暫時使用 virtuals 解決
 */

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
 * @returns 是否成功變更密碼
 */
export async function updateUserPasswordById(userId: ObjectIdLike, newPassword: string) {
    const user = await User.findById(userId);

    if (!user) {
        return false;
    }

    user.password = newPassword;
    await user.save(); // 觸發 pre-save hook 進行密碼雜湊

    return true;
}

/**
 * 驗證使用者是否可以登入
 *
 * @param userId 使用者 ID
 * @returns 回傳物件，包含是否可以登入及鎖定到期時間（若有的話）
 */
export async function verifyUserCanLogin(userId: ObjectIdLike) {
    const user = await User.findById(userId).select("+loginLockExpiration");

    if (!user) {
        return { result: false };
    }

    // 若有設定登入鎖定到期時間，且尚未到期，則無法登入
    if (user.loginLockExpiration && user.loginLockExpiration > new Date()) {
        return { result: false, lockUntil: user.loginLockExpiration };
    }

    return { result: true };
}

/**
 * 增加使用者的登入失敗次數
 * 若達到一定次數，則鎖定帳號一段時間
 *
 * @param userId 使用者 ID
 */
export async function incrementUserLoginFailureCount(userId: ObjectIdLike) {
    const user = await User.findById(userId).select("+loginFailureCount +loginLockExpiration");

    if (!user) {
        return;
    }

    user.loginFailureCount++;

    // 若登入失敗次數達到 5 次，則鎖定帳號 5 分鐘
    if (user.loginFailureCount >= 5) {
        const lockDuration = 5 * 60 * 1000; // 5 分鐘
        user.loginLockExpiration = new Date(Date.now() + lockDuration);
    }

    await user.save();
}

/**
 * 建立新使用者帳號
 *
 * @param data 使用者註冊資料
 * @returns 回傳建立的使用者資料物件
 */
export async function createUser(data: IUserCreate) {
    // 預設不指定 img/address/phone?
    const user = new User(data);

    await user.save();

    // 避免回傳密碼欄位，所以重新查詢一次
    const savedUser = await getUserById(user._id);

    if (!savedUser) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: "Failed to retrieve created user.",
        });
    }

    return savedUser;
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

    return user.toObject<IUserResponse>();
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

    return user.toObject<IUserResponse>();
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

    const filter: FilterQuery<IUserResponse> = {};

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

    return users.map((user) => user.toObject<IUserResponse>());
}

export async function updateUser(userId: ObjectIdLike, updateData: IUserUpdate) {
    updateData = cleanObject(updateData);

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    if (!user) {
        return null;
    }

    return user.toObject<IUserResponse>();
}
