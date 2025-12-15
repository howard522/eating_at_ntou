// server/api/admin/restaurants/[id]/menu/[menuId].patch.ts

import type { IUpdateMenuItem } from "@server/interfaces/restaurant.interface";
import { updateMenuItemById } from "@server/services/restaurants.service";
import { parseForm } from "@server/utils/parseForm";

/**
 * @openapi
 * /api/admin/restaurants/{id}/menu/{menuId}:
 *   patch:
 *     summary: 管理員 - 更新菜單項目（支援圖片上傳）
 *     description: |
 *       僅限管理員使用。
 *
 *       允許部分欄位更新，未提供的欄位將保持不變。
 *       若傳入圖片，系統會自動上傳至 ImgBB 並回傳圖片 URL。
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "滷肉飯（升級版）"
 *               price:
 *                 type: number
 *                 example: 85
 *               info:
 *                 type: string
 *                 example: "附湯與小菜，限午餐供應"
 *               imageURL:
 *                 type: string
 *                 format: uri
 *                 description: 直接使用圖片的 URL
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 菜單項目圖片（由後端自動上傳至 ImgBB）
 *     responses:
 *       200:
 *         description: 成功更新菜單項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 menu:
 *                   $ref: '#/components/schemas/MenuItem'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const restaurantId = getRouterParam(event, "id") as string;
    const menuId = getRouterParam(event, "menuId") as string;
    const form = await readMultipartFormData(event);
    const data = await parseForm<IUpdateMenuItem>(form);

    if (!restaurantId || !menuId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameters: id, menuId.",
        });
    }

    if (data.imageURL) {
        data.image = data.imageURL;
        delete data.imageURL;
    }

    const menu = await updateMenuItemById(restaurantId, menuId, data);

    return {
        success: true,
        menu,
    };
});
