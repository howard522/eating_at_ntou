// server/api/admin/restaurants/[id]/menu/index.post.ts

import { createMenuItem } from "@server/services/restaurants.service";
import { parseForm } from "@server/utils/parseForm";
import type { CreateMenuItemBody } from "@server/interfaces/restaurant.interface";

/**
 * @openapi
 * /api/admin/restaurants/{id}/menu:
 *   post:
 *     summary: 管理員 - 新增菜單項目（支援圖片上傳）
 *     description: |
 *       僅限管理員使用。
 *
 *       可新增一個菜單項目。
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "牛肉湯麵"
 *               price:
 *                 type: number
 *                 example: 120
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
 *       201:
 *         description: 成功建立新菜單項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 menuItem:
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
    const form = await readMultipartFormData(event);
    const data = await parseForm<CreateMenuItemBody>(form);

    if (!restaurantId) {
        throw createError({ statusCode: 400, statusMessage: "Bad Request", message: "Missing required parameter: id" });
    }

    // 檢查必填欄位
    if (!data.name || !data.price) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required fields: name, price",
        });
    }

    if (data.imageURL) {
        data.image = data.imageURL;
        delete data.imageURL;
    }

    const menuItem = await createMenuItem(restaurantId, data);

    setResponseStatus(event, 201); // 201 Created

    return {
        success: true,
        menuItem,
    };
});
