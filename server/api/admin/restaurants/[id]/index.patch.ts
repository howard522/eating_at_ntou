// server/api/admin/restaurants/[id]/index.patch.ts

import type { IUpdateRestaurant } from "@server/interfaces/restaurant.interface";
import { updateRestaurantById } from "@server/services/restaurants.service";
import { parseForm } from "@server/utils/parseForm";

/**
 * @openapi
 * /api/admin/restaurants/{id}:
 *   patch:
 *     summary: 管理員 - 更新餐廳（支援圖片上傳與地理編碼）
 *     description: |
 *       僅限管理員使用。
 *
 *       用於更新餐廳主體資料（不含菜單）。
 *       若傳入地址，系統會自動根據地址取得地理座標。
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "海大食堂"
 *               address:
 *                 type: string
 *                 example: "基隆市中正區北寧路2號"
 *               phone:
 *                 type: string
 *                 example: "02-2462-2192"
 *               info:
 *                 type: string
 *                 example: "學生餐廳，供應中式與飲品"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["中式", "學生餐", "平價"]
 *               imageURL:
 *                 type: string
 *                 format: uri
 *                 description: 圖片的 URL
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 餐廳封面圖片（由後端自動上傳至 ImgBB）
 *     responses:
 *       200:
 *         description: 成功更新餐廳資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
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
    const id = getRouterParam(event, "id") as string;
    const form = await readMultipartFormData(event);
    const data = await parseForm<IUpdateRestaurant>(form, ["tags"]);

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: restaurant id.",
        });
    }

    if (data.imageURL) {
        data.image = data.imageURL;
        delete data.imageURL;
    }

    const restaurant = await updateRestaurantById(id, data);

    return {
        success: true,
        restaurant,
    };
});
