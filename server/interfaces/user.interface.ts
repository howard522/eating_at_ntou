// server/interfaces/user.interface.ts

export type UserRole = "admin" | "multi" | "banned";

// 使用者介面
export interface IUser extends Document {
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

export interface LoginBody {
    email: string;
    password: string;
}

export interface RegisterBody {
    name?: string;
    email: string;
    password: string;
    role?: UserRole;
}

export interface UpdatePasswordBody {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateUserBody {
    name?: string;
    address?: string;
    phone?: string;
    img?: string;
    // activeRole?: "customer" | "delivery" | null;
}

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    img: string;
    address: string;
    phone: string;
    // activeRole?: "customer" | "delivery" | null;
    createdAt?: Date;
    updatedAt?: Date;
}
