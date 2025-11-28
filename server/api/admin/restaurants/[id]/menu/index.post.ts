// server/api/admin/restaurants/[id]/menu/index.post.ts

import { createMenuItem } from "@server/services/restaurants.service";
import { parseForm } from "@server/utils/parseForm";
import type { CreateMenuItemBody } from "@server/interfaces/restaurant.interface";

/**
 * @openapi
 * /api/admin/restaurants/{id}/menu:
 *   post:
 *     summary: 為指定餐廳新增菜單項目（支援圖片上傳）
 *     description: |
 *       僅限管理員使用。
 *       可新增一個菜單項目，若上傳圖片，系統會自動上傳至 ImgBB 並儲存其 URL。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 餐廳的唯一 MongoDB ObjectId
 *         schema:
 *           type: string
 *           example: "6731e8adfb75b5f214ecb321"
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
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 上傳圖片檔案，會自動上傳至 ImgBB 並回傳 URL
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
 *         description: 無效的請求資料或圖片上傳失敗
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
    const restaurantId = getRouterParam(event, "id") as string;
    const form = await readMultipartFormData(event);
    const data = await parseForm<CreateMenuItemBody>(form);

    // 檢查必填欄位
    if (!data.name || !data.price) {
        throw createError({ statusCode: 400, message: "Missing required fields: name, price" });
    }

    const menuItem = await createMenuItem(restaurantId, data);

    setResponseStatus(event, 201); // 201 Created
    return {
        success: true,
        menuItem,
    };
});
