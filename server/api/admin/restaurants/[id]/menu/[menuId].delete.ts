// server/api/admin/restaurants/[id]/menu/[menuId].delete.ts

import { deleteMenuItemById } from "@server/services/restaurants.service";

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
    const restaurantId = getRouterParam(event, "id") as string;
    const menuId = getRouterParam(event, "menuId") as string;

    if (!restaurantId || !menuId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameters: id, menuId",
        });
    }

    await deleteMenuItemById(restaurantId, menuId);

    return {
        success: true,
        message: "Menu item deleted successfully",
    };
});
