import { defineEventHandler, createError } from 'h3'
import connectDB from '@server/utils/db'
import User from '@server/models/user.model'
import { getUserFromEvent, toPublicUser } from '@server/utils/auth'

/**
 * @openapi
 * /api/admin/users/{id}:
 *   get:
 *     summary: 由管理員取得單一使用者資料
 *     description: 管理員專用：依使用者 ID 取得 user 的公開欄位（不包含密碼）。
 *     tags:
 *       - Admin
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
 */
export default defineEventHandler(async (event: any) => {
    await connectDB()

    // 取得呼叫者並驗證為 admin
    const me = await getUserFromEvent(event)
    if (me.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: '無權限' })
    }

    const id = event.context.params?.id
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: '缺少使用者 ID' })
    }

    const user = await (User.findById as any)(id).lean()
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: '找不到使用者' })
    }

    return { success: true, data: toPublicUser(user) }
})
