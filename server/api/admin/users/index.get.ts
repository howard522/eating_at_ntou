// server/api/admin/users/index.get.ts

import type { UserRole } from "@server/interfaces/user.interface";
import { searchUsers } from "@server/services/user.service";

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: 管理員 - 查詢所有使用者
 *     description: |
 *       列出使用者清單，支援分頁、角色篩選、email/name 關鍵字查詢與排序。
 *     tags:
 *       - Admin - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         description: 依角色篩選
 *         schema:
 *           type: string
 *           enum: [admin, multi, banned]
 *       - name: q
 *         in: query
 *         description: 依 name 或 email 進行模糊查詢
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 最大回傳筆數（預設 50，上限 200）
 *         schema:
 *           type: integer
 *       - name: skip
 *         in: query
 *         description: 跳過筆數（用於分頁）
 *         schema:
 *           type: integer
 *       - name: sortBy
 *         in: query
 *         description: 排序欄位，預設 createdAt
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email]
 *       - name: order
 *         in: query
 *         description: 排序方向，預設 desc
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: 成功回傳使用者清單
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    const role = query.role as UserRole | undefined;

    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 200;

    let limit = Number(query.limit) || DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT);
    const skip = Number(query.skip) || 0;

    const sortBy = (query.sortBy as string | undefined) || "createdAt";
    const order = (query.order as "asc" | "desc" | undefined) || "desc";

    const users = await searchUsers({
        role,
        query: query.q as string | undefined,
        limit,
        skip,
        sortBy: { [sortBy]: order === "asc" ? 1 : -1 },
    });

    return {
        success: true,
        count: users.length,
        data: users,
    };
});
