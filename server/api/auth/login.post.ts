// FILE: server/api/auth/login.post.ts

import type { LoginBody } from "@server/interfaces/user.interface";
import { loginUser } from "@server/services/auth.service";

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: 使用者登入
 *     description: 驗證 email 與密碼，成功回傳 JWT 與使用者資料。
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             sampleRequest:
 *               summary: 範例請求（Try it out 預填）
 *               value:
 *                 email: "test@example.com"
 *                 password: "secret123"
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: 成功範例
 *                 value:
 *                   success: true
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   user:
 *                     id: 68eba49d636458deb1664302
 *                     name: 郭浩
 *                     email: howhow@example.com
 *                     role: multi
 *                     img: https://example.com/avatar.png
 *                     address: 海洋大學資工系館
 *                     phone: "0912345678"
 *       401:
 *         description: 帳號不存在或密碼錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 401 }
 *                 statusMessage: { type: string, example: 帳號不存在或密碼錯誤 }
 */
export default defineEventHandler(async (event) => {
    const { email, password } = await readBody<LoginBody>(event);

    const { user, token } = await loginUser(email, password);

    return { success: true, token, user };
});
