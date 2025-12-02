//目的：從 Authorization Bearer token 解析使用者並回傳，供受保護路由使用
// ============================================================================
import jwt from "jsonwebtoken";
import User from "@server/models/user.model";
import connectDB from "./db";
import type { H3Event } from "h3";
import type { JwtPayload } from "@server/interfaces/jwt.interface";
import type { IUser, UserResponse } from "@server/interfaces/user.interface";

export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * 使用指定的 payload 產生 JWT 字串。
 *
 * @param payload JWT 負載資料
 * @param options jwt.SignOptions 可選參數
 * @returns 產生的 JWT 字串
 */
export function signJwt(userId: string, role?: string): string {
    const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });
    return token;
}

/**
 * 驗證並解析 JWT，回傳 payload 或 null（若驗證失敗）。
 *
 * @param token JWT 字串
 * @returns JwtPayload 或 null
 */
export function verifyJwt(token: string): JwtPayload | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload as JwtPayload;
    } catch (err) {
        console.error("JWT verification error:", err);
        return null;
    }
}

/**
 * 從 Event 中解析並驗證 Bearer JWT，回傳 payload。
 * 統一處理 Authorization header 的大小寫、格式檢查與 jwt.verify 的錯誤。
 */
export async function verifyJwtFromEvent(event: H3Event) {
    const headers = event.node.req.headers || {};
    // headers 可能是小寫或大寫鍵，直接取 authorization（Node 下通常為小寫）
    const rawAuth = (headers.authorization as string) || (headers.Authorization as string) || "";
    if (!rawAuth || typeof rawAuth !== "string") {
        throw createError({ statusCode: 401, statusMessage: "未登入" });
    }
    const m = rawAuth.match(/Bearer\s+(.+)/i);
    if (!m) {
        throw createError({ statusCode: 401, statusMessage: "未登入" });
    }
    const token = m[1] as string;
    let payload: any;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw createError({ statusCode: 401, statusMessage: "錯誤 token" });
    }
    if (!payload || !payload.id) {
        throw createError({ statusCode: 401, statusMessage: "錯誤 token" });
    }
    return payload as JwtPayload;
}

export async function getUserFromEvent(event: H3Event) {
    const payload = await verifyJwtFromEvent(event);
    await connectDB();
    const user = await User.findById(payload.id);
    if (!user) throw createError({ statusCode: 401, statusMessage: "找不到使用者" });
    if (user.role === "banned") throw createError({ statusCode: 403, statusMessage: "帳號已被封鎖" });
    return user;
}

export function toPublicUser(u: IUser): UserResponse {
    return {
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role, // admin | multi | banned
        img: u.img || "",
        address: u.address || "",
        phone: u.phone || "",
        //activeRole: u.activeRole ?? null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
    };
}

// 檢查 payload 是否被封鎖
export function assertNotBanned(payload: JwtPayload) {
    if (payload.role === "banned") {
        throw createError({ statusCode: 403, statusMessage: "帳號已被封鎖" });
    }
}
