// FILE: server/api/auth/register.post.ts

import type { RegisterBody } from "@server/interfaces/user.interface";
import { registerUser } from "@server/services/auth.service";

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 使用者註冊
 *     description: 建立新帳號（email 唯一），成功回傳 JWT 與使用者資料（不回傳密碼）。
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             sample:
 *               summary: 註冊範例
 *               value:
 *                 name: 郭浩
 *                 email: howhow@example.com
 *                 password: howhowissohandsome
 *     responses:
 *       201:
 *         description: 註冊成功
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
 *                     img: ""
 *                     address: ""
 *                     phone: ""
 *       400:
 *         description: 請求不正確或 email 已存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 400 }
 *                 statusMessage: { type: string, example: email already in use }
 */
export default defineEventHandler(async (event) => {
    const body = await readBody<RegisterBody>(event);
    const name = body.name || "這個人很懶，不想取暱稱";
    const email = body.email;
    const password = body.password;
    const role = body.role || "multi";

    if (!email || !password) {
        throw createError({ statusCode: 400, statusMessage: "缺少電子信箱或密碼" });
    }

    const { user, token } = await registerUser(name, email, password, role);

    return { success: true, token, user };
});
