// server/api/admin/restaurants/[id]/menu/[menuId].delete.ts

import { deleteMenuItemById } from "@server/services/restaurants.service";

/**
 * @openapi
 * /api/admin/restaurants/{id}/menu/{menuId}:
 *   delete:
 *     summary: 管理員 - 刪除菜單項目
 *     description: |
 *       僅限管理員使用。
 *
 *       會從該餐廳的 `menu` 陣列中移除指定的項目。
 *       若該餐廳或菜單項目不存在，則回傳 404。
 *     tags:
 *       - Admin - Restaurants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 餐廳 ID
 *         schema:
 *           type: string
 *       - name: menuId
 *         in: path
 *         required: true
 *         description: 菜單項目 ID
 *         schema:
 *           type: string
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
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
