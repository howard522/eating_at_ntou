// server/services/auth.service.ts

import type { ObjectIdLike } from "@server/interfaces/common.interface";
import type { RegisterBody } from "@server/interfaces/user.interface";
import {
    createUser,
    getUserByEmail,
    getUserById,
    updateUser,
    updateUserPasswordById,
    verifyUserPasswordById,
} from "@server/services/user.service";
import { signJwt } from "@server/utils/auth";

/**
 * 註冊新使用者
 *
 * @param name 使用者名稱
 * @param email 電子信箱
 * @param password 密碼
 * @param role 使用者角色，預設為 "multi"
 * @returns 新註冊的使用者資料及 JWT token
 */
export async function registerUser(data: RegisterBody) {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
        throw createError({ statusCode: 409, statusMessage: "Conflict", message: "電子信箱已經註冊" });
    }

    if (data.password.length < 6) {
        throw createError({ statusCode: 422, statusMessage: "Unprocessable Entity", message: "密碼長度至少 6 個字元" });
    }

    const user = await createUser(data);

    const token = signJwt(String(user.id), data.role);

    return { user, token };
}

/**
 * 使用電子信箱與密碼登入
 *
 * @param email 電子信箱
 * @param password 密碼
 * @returns 登入的使用者資料及 JWT token
 */
export async function loginUser(email: string, password: string) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "帳號不存在" });
    }

    const isMatch = await verifyUserPasswordById(user.id, password);
    if (!isMatch) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "密碼錯誤" });
    }

    if (user.role === "banned") {
        throw createError({ statusCode: 403, statusMessage: "Forbidden", message: "帳號已被封鎖" });
    }

    const token = signJwt(String(user.id), user.role);

    return { user, token };
}

/**
 * 更改使用者密碼
 *
 * @param userId 使用者 ID
 * @param currentPassword 目前密碼
 * @param newPassword 新密碼
 */
export async function changeUserPassword(userId: ObjectIdLike, currentPassword: string, newPassword: string) {
    const user = await getUserById(userId);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "使用者不存在" });
    }

    const isMatch = await verifyUserPasswordById(user.id, currentPassword);
    if (!isMatch) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "目前密碼錯誤" });
    }

    if (newPassword.length < 6) {
        throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "新密碼長度至少 6 個字元" });
    }

    await updateUserPasswordById(user.id, newPassword);
}

/**
 * 封鎖使用者帳號
 *
 * @param userId 使用者 ID
 * @returns 封鎖後的使用者 ID 及角色
 */
export async function banUser(userId: ObjectIdLike) {
    const user = await getUserById(userId);

    if (!user) {
        throw createError({ statusCode: 404, statusMessage: "Not Found", message: "使用者不存在" });
    }

    // 不能封鎖 admin

    // NOTE: 不能封鎖自己、其他 admin，防止 admin 耍白痴
    //       但操作者屬於 admin，所以不必檢查是否為自己
    if (user.role === "admin") {
        throw createError({ statusCode: 403, statusMessage: "Forbidden", message: "不可封鎖管理員帳號" });
    }

    // QUESTION: 已被封鎖的 user 可以再次被封鎖嗎？
    // if (user.role === "banned") {
    //     throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "使用者已經被封鎖了，他覺得很心累" });
    // }

    await updateUser(user.id, { role: "banned" });

    // QUESTION: 都已經封鎖了，為什麼還要回傳 user.role？
    return { userId: String(user.id), role: "banned" };
}

/**
 * 解除封鎖使用者帳號
 *
 * @param userId 使用者 ID
 * @returns 解除封鎖後的使用者 ID 及角色
 */
export async function unbanUser(userId: ObjectIdLike) {
    const user = await getUserById(userId);

    if (!user) {
        throw createError({ statusCode: 404, statusMessage: "Not Found", message: "使用者不存在" });
    }

    if (user.role !== "banned") {
        throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "使用者並非封鎖狀態" });
    }

    await updateUser(user.id, { role: "multi" });

    return { userId: String(user.id), role: "multi" };
}
