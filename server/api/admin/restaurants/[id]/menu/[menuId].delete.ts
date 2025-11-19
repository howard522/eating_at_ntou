// server/api/admin/restaurants/[id]/menu/[menuId].delete.ts

import { defineEventHandler, createError } from 'h3'
import Restaurant from '@server/models/restaurant.model'

/**
 * @openapi
 * /api/admin/restaurants/{id}/menu/{menuId}:
 *   delete:
 *     summary: 刪除指定餐廳的菜單項目
 *     description: |
 *       僅限管理員使用。  
 *       會從該餐廳的 `menu` 陣列中移除指定的項目。  
 *       若該餐廳或菜單項目不存在，則回傳 404。
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
 *       - name: menuId
 *         in: path
 *         required: true
 *         description: 要刪除的菜單項目 ID
 *         schema:
 *           type: string
 *           example: "6750b9fc97d3a11504e1d9a5"
 *     responses:
 *       200:
 *         description: 成功刪除菜單項目
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
 *                   example: "Menu item deleted successfully"
 *       401:
 *         description: 未登入或 Token 無效
 *       403:
 *         description: 權限不足（非管理員）
 *       404:
 *         description: 找不到指定餐廳或菜單項目
 *       500:
 *         description: 伺服器內部錯誤
 */
export default defineEventHandler(async (event) => {
    const restaurantId = event.context.params?.id as string
    const menuId = event.context.params?.menuId as string

    try {
        const restaurant = await Restaurant.findById(restaurantId)
        if (!restaurant)
            throw createError({ statusCode: 404, message: 'Restaurant not found' })

        const menuItem = restaurant.menu.id(menuId)
        if (!menuItem)
            throw createError({ statusCode: 404, message: 'Menu item not found' })

        menuItem.deleteOne() // 從陣列中移除該項目
        await restaurant.save()

        return {
            success: true,
            message: 'Menu item deleted successfully',
        }
    } catch (err) {
        console.error('Delete menu item failed:', err)
        throw createError({
            statusCode: 500,
            message: 'Failed to delete menu item',
        })
    }
})
