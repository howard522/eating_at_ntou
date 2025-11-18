import { defineEventHandler, createError } from 'h3'
import connectDB from '@server/utils/db'
import User from '@server/models/user.model'
import { getUserFromEvent } from '@server/utils/auth'

/**
 * @openapi
 * /api/admin/users/{id}/ban:
 *   patch:
 *     summary: 管理員停用會員帳號
 *     description: >
 *       將指定會員帳號標記為停用狀態（role = "banned"）。
 *       停用後，該會員無法登入、下單或接單。
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
 */
export default defineEventHandler(async (event) => {
    await connectDB()

    // 取得呼叫者（必須是 admin）
    const me = await getUserFromEvent(event)
    if (me.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: '無權限' })
    }

    const id = event.context.params?.id
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: '缺少使用者 ID' })
    }

    // 不能 ban 自己，也不能 ban 其他 admin，防止admin耍白痴
    if (String(me._id) === String(id)) {
        throw createError({ statusCode: 400, statusMessage: '不可停用自己的帳號' })
    }

    const user = await User.findById(id)
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: '找不到使用者' })
    }

    if (user.role === 'admin') {
        throw createError({ statusCode: 400, statusMessage: '不可停用管理員帳號' })
    }

    user.role = 'banned'
    await user.save()

    return {
        success: true,
        userId: String(user._id),
        role: user.role,
    }
})
