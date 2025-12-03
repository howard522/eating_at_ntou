// FILE: server/api/auth/me/password.patch.ts  (新增/更新)
// ============================================================================

import type { UpdatePasswordBody } from "@server/interfaces/user.interface";
import { changeUserPassword } from "@server/services/auth.service";
import { getUser } from "@server/utils/getUser";

/**
 * @openapi
 * /api/auth/me/password:
 *   patch:
 *     summary: 變更我的密碼
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: 已更新 }
 *       400: { description: 參數錯誤 }
 *       401: { description: 密碼不正確 / 未授權 }
 */
export default defineEventHandler(async (event) => {
    const userId = getUser(event).id;

    const { currentPassword, newPassword } = await readBody<UpdatePasswordBody>(event);

    if (!currentPassword || !newPassword) {
        throw createError({ statusCode: 400, message: "currentPassword and newPassword are required" });
    }

    await changeUserPassword(userId, currentPassword, newPassword);

    return { success: true };
});
