import type { IUser } from "@server/interfaces/user.interface";
import User from "@server/models/user.model";
import type { Types } from "mongoose";
import type { UserRole } from "@server/interfaces/user.interface";

/**
 * 建立新使用者帳號
 *
 * @param name 使用者名稱
 * @param email 使用者電子郵件（唯一）
 * @param password 使用者密碼（未加密）
 * @param role 使用者角色
 * @returns 回傳建立的使用者資料物件
 * @throws 若 email 已存在則拋出錯誤
 */
export async function createUser(name: string, email: string, password: string, role: UserRole) {
    // 建立新使用者
    const user = new User({
        name,
        email,
        password,
        role,
        // 預設不指定 img/address/phone
    });

    await user.save();

    return user;
}

/**
 * 透過使用者 ID 獲取使用者資料
 *
 * @param userId 使用者的唯一識別碼
 * @returns 回傳使用者資料物件，若找不到則回傳 null
 */
export async function getUserById(userId: string | Types.ObjectId) {
    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    return user;
}

/**
 * 透過電子郵件獲取使用者資料
 *
 * @param email 使用者的電子郵件地址
 * @returns 回傳使用者資料物件，若找不到則回傳 null
 */
export async function getUserByEmail(email: string) {
    const user = await User.findOne({ email });

    if (!user) {
        return null;
    }

    return user;
}

export async function updateUser(userId: string | Types.ObjectId, updateData: Partial<IUser>) {
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    return user;
}
