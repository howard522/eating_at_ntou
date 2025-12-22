// server/api/admin/users/[id]/ban.patch.ts

import { banUser } from "$services/auth.service";

/**
 * @openapi
 * /api/admin/users/{id}/ban:
 *   patch:
 *     summary: 管理員 - 停用會員帳號
 *     description: |
 *       將指定會員帳號標記為停用狀態（role = "banned"）。
 *       停用後，該會員無法登入、下單或接單。
 *     tags:
 *       - Admin - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 目標會員的使用者 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 停用成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                 role:
 *                   type: string
 *                   example: banned
 *       400:
 *         description: 不允許對 admin 停用或自身操作
 *       401:
 *         description: 未登入或 token 無效
 *       403:
 *         description: 非管理員無權操作
 *       404:
 *         description: 找不到目標使用者
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    // 取得呼叫者（必須是 admin）
    // NOTE: 已在 middleware 驗證過呼叫者權限

    const userId = getRouterParam(event, "id");
    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: user id.",
        });
    }

    const { userId: bannedUserId, role } = await banUser(userId);

    return {
        success: true,
        userId: bannedUserId,
        role: role,
    };
});
