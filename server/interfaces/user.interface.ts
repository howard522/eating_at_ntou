// server/interfaces/user.interface.ts

import type { CreateBody, ObjectIdLike, UpdateBody, WithTimestamps } from "./common.interface";

export type UserRole = "admin" | "multi" | "banned"; // 權限身份組
export type ActiveUserRole = "customer" | "delivery"; // 使用者目前的活躍角色

// --------------------
// 使用者介面
// --------------------

/**
 * 使用者介面
 *
 * 由於安全性考量，在一般情況下不會回傳密碼欄位。
 */
export interface IUser extends WithTimestamps {
    _id: ObjectIdLike;
    id: ObjectIdLike;
    name: string;
    email: string;
    role: UserRole;
    img?: string;
    address?: string;
    phone?: string;
    // activeRole?: "customer" | "delivery" | null;
}

/**
 * 使用者介面（包含密碼欄位）
 */
export type IUserWithPassword = IUser & { password: string };

/**
 * 使用者文件方法介面
 */
export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// --------------------
// 使用者相關 DTO
// --------------------

export type IUserSummary = Pick<IUser, "id" | "_id" | "name" | "img">;

export type IUserLogin = Pick<IUserWithPassword, "email" | "password">;

export type IUserCreate = CreateBody<IUserWithPassword, "email" | "password">;

export type IUserUpdate = UpdateBody<IUser>;

export type IUserResponse = IUser;

export interface UpdatePasswordBody {
    currentPassword: string;
    newPassword: string;
}

// --------------------
// JWT 負載介面
// --------------------

export interface JwtPayload {
    id: string;
    role?: UserRole;
    iat?: number;
    exp?: number;
}
