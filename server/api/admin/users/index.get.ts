import type { UserRole } from "@server/interfaces/user.interface";
import { searchUsers } from "@server/services/user.service";

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: 管理員查詢所有使用者
 *     description: 列出使用者清單，支援分頁、角色篩選、email/name 關鍵字查詢與排序。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, multi, banned]
 *         description: 依角色篩選
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 依 name 或 email 進行模糊查詢
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 最大回傳筆數（預設 50，上限 200）
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: 跳過筆數（用於分頁）
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email]
 *         description: 排序欄位，預設 createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向，預設 desc
 *     responses:
 *       200:
 *         description: 成功回傳使用者清單
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

    return { success: true, count: users.length, data: users };
});
