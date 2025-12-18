// server/api/auth/register.post.ts

import type { IUserCreate } from "@server/interfaces/user.interface";
import { registerUser } from "@server/services/auth.service";

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 使用者註冊
 *     description: |
 *       建立新帳號（email 唯一），成功回傳 JWT 與使用者資料（不回傳密碼）。
 *     tags:
 *       - Auth
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
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const body = await readBody<IUserCreate>(event);
    body.name ??= "這個人很懶，不想取暱稱";
    body.role ??= "multi";

    if (!body.email || !body.password) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required fields: email, password.",
        });
    }

    const { user, token } = await registerUser(body);

    setResponseStatus(event, 201); // 201 Created

    return {
        success: true,
        token,
        user,
    };
});
