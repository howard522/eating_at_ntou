// server/interfaces/user.interface.ts

// 使用者介面
export interface IUser {
    name: string;
    email: string;
    password: string;
    role: "admin" | "multi" | "banned";
    img?: string;
    address?: string;
    phone?: string;
    // activeRole?: "customer" | "delivery" | null;
    createdAt?: Date;
    updatedAt?: Date;
}
