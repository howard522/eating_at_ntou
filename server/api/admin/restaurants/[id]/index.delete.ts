import { defineEventHandler, createError } from 'h3'
import Restaurant from '../../../../models/restaurant.model'

/**
 * @openapi
 * /api/admin/restaurants/{id}:
 *   delete:
 *     summary: 刪除指定餐廳（僅限管理員）
 *     description: >
 *       僅限管理員使用。  
 *       會從資料庫中永久刪除指定餐廳及其所有關聯資料（例如菜單項目）。  
 *       若該餐廳不存在，則回傳 404。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []   # JWT 驗證
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 餐廳的唯一 MongoDB ObjectId
 *         schema:
 *           type: string
 *           example: "6731e8adfb75b5f214ecb321"
 *     responses:
 *       200:
 *         description: 成功刪除餐廳
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Restaurant deleted successfully"
 *       401:
 *         description: 未登入或 Token 無效
 *       403:
 *         description: 權限不足（非管理員）
 *       404:
 *         description: 找不到指定餐廳
 *       500:
 *         description: 伺服器內部錯誤
 */


export default defineEventHandler(async (event) => {
    const id = event.context.params?.id as string

    try {
        const deleted = await Restaurant.findByIdAndDelete(id)

        if (!deleted) {
            throw createError({ statusCode: 404, message: 'Restaurant not found' })
        }

        return {
            success: true,
            message: 'Restaurant deleted successfully',
        }
    } catch (err: any) {
        console.error('Delete restaurant failed:', err)
        throw createError({
            statusCode: 500,
            message: 'Failed to delete restaurant',
        })
    }
})
