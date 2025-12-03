// server/api/admin/users/[id]/unban.patch.ts

import { unbanUser } from "@server/services/auth.service";

/**
 * @openapi
 * /api/admin/users/{id}/unban:
 *   patch:
 *     summary: 管理員 - 解除停用會員帳號
 *     description: |
 *       將指定會員從停用狀態恢復為一般會員（role = "multi"）。
 *     tags:
 *       - Admin - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 目標會員的使用者 ID
 *     responses:
 *       200:
 *         description: 解除停用成功
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, "id");
    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: "缺少使用者 ID" });
    }

    const { userId: unbannedUserId, role } = await unbanUser(userId);

    return {
        success: true,
        userId: unbannedUserId,
        role: role,
    };
});
