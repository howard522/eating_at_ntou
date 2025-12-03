//目的：從 Authorization Bearer token 解析使用者並回傳，供受保護路由使用
// ============================================================================
import type { JwtPayload } from "@server/interfaces/user.interface";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// --------------------
// JWT 處理
// --------------------

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

// --------------------
// 密碼處理
// --------------------

/**
 * 生成密碼 Hash
 * @param password 密碼
 * @returns Hash 後的密碼
 */
export async function generatePasswordHash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

/**
 * 比對密碼與 Hash 是否相符
 * @param password 明文密碼
 * @param hashed Hash 後的密碼
 * @returns 是否相符
 */
export async function comparePassword(password: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(password, hashed);
}
