import { defineEventHandler, getQuery, createError } from 'h3'
import connectDB from '@server/utils/db'
import User from '@server/models/user.model'
import { verifyJwtFromEvent, toPublicUser } from '@server/utils/auth'

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
    await connectDB()
    await verifyJwtFromEvent(event) // middleware/admin.global.ts 會再檢查是否為 admin

    try {
        const query = getQuery(event) as Record<string, any>
        const mongoQuery: any = {}

        // 角色篩選
        if (query.role) {
            mongoQuery.role = query.role
        }

        // name 或 email 模糊搜尋
        if (query.q) {
            const q = String(query.q).trim()
            const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
            mongoQuery.$or = [{ name: re }, { email: re }]
        }

        const DEFAULT_LIMIT = 50
        const MAX_LIMIT = 200

        let limit = Number(query.limit) || DEFAULT_LIMIT
        limit = Math.min(limit, MAX_LIMIT)
        const skip = Number(query.skip) || 0

        const sortBy = query.sortBy || 'createdAt'
        const order = query.order === 'asc' ? 1 : -1

        const users = await User.find(mongoQuery)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .lean()

        const data = users.map((u: any) => toPublicUser(u))

        return { success: true, count: data.length, data }
    } catch (err) {
        console.error('Admin list users failed:', err)
        throw createError({ statusCode: 500, statusMessage: 'Failed to list users' })
    }
})

