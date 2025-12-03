// server/interfaces/user.interface.ts

import type { CreateBody, ObjectIdLike, UpdateBody } from "./common.interface";

export type UserRole = "admin" | "multi" | "banned";

// --------------------
// 使用者介面
// --------------------

export interface IUser {
    id: ObjectIdLike; // QUESTION: 會必須存在嗎？
    name: string;
    email: string;
    password: string;
    role: UserRole;
    img?: string;
    address?: string;
    phone?: string;
    // activeRole?: "customer" | "delivery" | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// --------------------
// 使用者相關 DTO
// --------------------

export type LoginBody = Pick<IUser, "email" | "password">;

export type RegisterBody = CreateBody<IUser, "email" | "password">;

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
