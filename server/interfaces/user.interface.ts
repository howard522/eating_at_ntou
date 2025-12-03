// server/interfaces/user.interface.ts

import type { CreateBody, ObjectIdLike, UpdateBody, WithTimestamps } from "./common.interface";

export type UserRole = "admin" | "multi" | "banned";

// --------------------
// 使用者介面
// --------------------

/**
 * 使用者介面
 *
 * 由於安全性考量，在一般情況下不會回傳密碼欄位。
 */
export interface IUser extends WithTimestamps {
    id: ObjectIdLike; // QUESTION: 會必須存在嗎？
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

export type LoginBody = Pick<IUserWithPassword, "email" | "password">;

export type RegisterBody = CreateBody<IUserWithPassword, "email" | "password">;

export interface UpdatePasswordBody {
    currentPassword: string;
    newPassword: string;
}

export type UpdateUserBody = UpdateBody<IUser>;

export type UserResponse = Required<IUser>;

// --------------------
// JWT 負載介面
// --------------------

export interface JwtPayload {
    id: string;
    role?: UserRole;
    iat?: number;
    exp?: number;
}
