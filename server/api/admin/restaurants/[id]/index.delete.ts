// server/api/admin/restaurants/[id]/index.delete.ts

import { deleteRestaurantById } from "@server/services/restaurants.service";

/**
 * @openapi
 * /api/admin/restaurants/{id}:
 *   delete:
 *     summary: 管理員 - 刪除餐廳
 *     description: |
 *       僅限管理員使用。
 * 
 *       會從資料庫中永久刪除指定餐廳及其所有關聯資料（例如菜單項目）。
 *       若該餐廳不存在，則回傳 404。
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
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id") as string;

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Restaurant id is required",
        });
    }

    await deleteRestaurantById(id);

    return {
        success: true,
        message: "Restaurant deleted successfully",
    };
});
