// FILE: server/api/auth/me.get.ts
// ============================================================================

import { toPublicUser } from "@server/utils/auth";
import { getUser } from "@server/utils/getUser";

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: 取得已登入使用者資料
 *     tags: [Auth]
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
 *         description: 未授權
 */
export default defineEventHandler(async (event) => {
    const user = getUser(event);

    return { success: true, user };
});
