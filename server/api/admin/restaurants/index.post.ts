// server/api/admin/restaurants/index.post.ts

import type { ICreateRestaurant } from "@server/interfaces/restaurant.interface";
import { createRestaurant } from "@server/services/restaurants.service";
import { parseForm } from "@server/utils/parseForm";

/**
 * @openapi
 * /api/admin/restaurants:
 *   post:
 *     summary: 管理員 - 新增餐廳（支援圖片上傳與地理編碼）
 *     description: |
 *       僅限管理員使用。
 *
 *       可建立新的餐廳資料。
 *       系統會自動根據地址取得地理座標。
 *       若傳入圖片，系統會自動上傳至 ImgBB 並回傳圖片 URL。
 *     tags:
 *       - Admin - Restaurants
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: "海大炸雞專賣店"
 *               address:
 *                 type: string
 *                 example: "基隆市中正區北寧路2號"
 *               phone:
 *                 type: string
 *                 example: "02-2462-1234"
 *               info:
 *                 type: string
 *                 example: "現炸雞排、鹽酥雞、魷魚圈等夜宵好夥伴"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["炸物", "夜宵", "學生最愛"]
 *               imageURL:
 *                 type: string
 *                 format: uri
 *                 description: 直接使用圖片的 URL
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 餐廳封面圖片（由後端自動上傳至 ImgBB）
 *     responses:
 *       201:
 *         description: 成功建立餐廳
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
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const form = await readMultipartFormData(event);
    const data = await parseForm<ICreateRestaurant>(form, ["tags"]);

    // 檢查必填欄位
    if (!data.name || !data.address || !data.phone) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required fields: name, address, phone",
        });
    }

    if (data.imageURL) {
        data.image = data.imageURL;
        delete data.imageURL;
    }

    const restaurant = await createRestaurant(data);

    setResponseStatus(event, 201); // 201 Created

    return {
        success: true,
        restaurant,
    };
});
