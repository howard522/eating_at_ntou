// server/api/admin/users/[id]/index.get.ts

import { getUserById } from "@server/services/user.service";

/**
 * @openapi
 * /api/admin/users/{id}:
 *   get:
 *     summary: 管理員 - 取得單一使用者資料
 *     description: |
 *       管理員專用：依使用者 ID 取得 user 的公開欄位（不包含密碼）。
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
 *         description: 使用者 ID
 *     responses:
 *       200:
 *         description: 成功回傳使用者資料
 *       401:
 *         description: 未登入或 token 無效
 *       403:
 *         description: 非管理員無權限
 *       404:
 *         description: 找不到使用者
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: user id.",
        });
    }

    const user = await getUserById(id);

    // TODO: 應該在 service 處理比較好
    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "User does not exist.",
        });
    }

    return {
        success: true,
        data: user,
    };
});
