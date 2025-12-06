// server/api/admin/restaurants/[id]/menu/[menuId].patch.ts

import { updateMenuItemById } from "@server/services/restaurants.service";
import { parseForm } from "@server/utils/parseForm";
import type { UpdateMenuItemBody } from "@server/interfaces/restaurant.interface";

/**
 * @openapi
 * /api/admin/restaurants/{id}/menu/{menuId}:
 *   patch:
 *     summary: 更新餐廳菜單項目（支援圖片上傳）
 *     description: |
 *       僅限管理員使用。
 *       允許部分欄位更新，未提供的欄位將保持不變。
 *       若上傳圖片檔案，系統會自動上傳至 ImgBB 並更新該項目的 `image` URL。
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
 *         description: 菜單項目的 MongoDB ObjectId
 *         schema:
 *           type: string
 *           example: "6750b9fc97d3a11504e1d9a5"
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
 *                 description: 圖片的 URL
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 新圖片檔案，會自動上傳至 ImgBB 並更新 URL
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
 *         description: 無效請求或圖片上傳失敗
 *       401:
 *         description: 未登入或 Token 無效
 *       403:
 *         description: 權限不足（非管理員）
 *       404:
 *         description: 找不到餐廳或菜單項目
 *       500:
 *         description: 伺服器內部錯誤
 */
export default defineEventHandler(async (event) => {
    const restaurantId = getRouterParam(event, "id") as string;
    const menuId = getRouterParam(event, "menuId") as string;
    const form = await readMultipartFormData(event);
    const data = await parseForm<UpdateMenuItemBody>(form);

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
