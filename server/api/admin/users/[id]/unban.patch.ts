import { defineEventHandler, createError } from 'h3'
import connectDB from '@server/utils/db'
import User from '@server/models/user.model'
import { getUserFromEvent } from '@server/utils/auth'

/**
 * @openapi
 * /api/admin/users/{id}/unban:
 *   patch:
 *     summary: 管理員解除停用會員帳號
 *     description: 將指定會員從停用狀態恢復為一般會員（role = "multi"）。
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
 *         description: 目標會員的使用者 ID
 *     responses:
 *       200:
 *         description: 解除停用成功
 */
export default defineEventHandler(async (event) => {
    await connectDB()

    const me = await getUserFromEvent(event)
    if (me.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: '無權限' })
    }

    const id = event.context.params?.id
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: '缺少使用者 ID' })
    }

    const user = await User.findById(id)
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: '找不到使用者' })
    }

    if (user.role === 'admin') {
        throw createError({ statusCode: 400, statusMessage: '管理員帳號不可用此 API 修改' })
    }

    user.role = 'multi'
    await user.save()

    return {
        success: true,
        userId: String(user._id),
        role: user.role,
    }
})
