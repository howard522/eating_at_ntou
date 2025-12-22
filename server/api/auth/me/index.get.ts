// server/api/auth/me.get.ts

import { getCurrentUser } from "$utils/getCurrentUser";

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: 取得已登入使用者資料
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 user:
 *                   $ref: '#/components/schemas/UserPublic'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const user = getCurrentUser(event);

    return {
        success: true,
        user,
    };
});
