// server/services/auth.service.ts

import type { UserRole } from "@server/interfaces/user.interface";
import { createUser, getUserByEmail, getUserById, updateUser } from "@server/services/user.service";
import { signJwt, toPublicUser } from "@server/utils/auth";
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";

export async function registerUser(name: string, email: string, password: string, role: UserRole = "multi") {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        throw createError({ statusCode: 400, message: "電子信箱已經註冊" });
    }

    if (password.length < 6) {
        throw createError({ statusCode: 400, message: "密碼長度至少 6 個字元" });
    }

    const user = await createUser(name, email, password, role);

    const token = signJwt(String(user._id), role);

    return { user: toPublicUser(user), token };
}

export async function loginUser(email: string, password: string) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw createError({ statusCode: 401, message: "帳號不存在" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw createError({ statusCode: 401, message: "密碼錯誤" });
    }

    if (user.role === "banned") {
        throw createError({ statusCode: 403, message: "帳號已被封鎖" });
    }

    const token = signJwt(String(user._id), user.role);

    return { user: toPublicUser(user), token };
}

export async function changeUserPassword(
    userId: string | Types.ObjectId,
    currentPassword: string,
    newPassword: string
) {
    const user = await getUserById(userId);

    if (!user) {
        throw createError({ statusCode: 401, message: "使用者不存在" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw createError({ statusCode: 401, message: "目前密碼錯誤" });
    }

    if (newPassword.length < 6) {
        throw createError({ statusCode: 400, message: "新密碼長度至少 6 個字元" });
    }

    await updateUser(user._id, { password: newPassword });
}
