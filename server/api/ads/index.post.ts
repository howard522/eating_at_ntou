// server/api/ads/index.post.ts

import { createAd } from "@server/services/ad.service";
import { parseForm } from "@server/utils/parseForm";
import type { IAd } from "@server/interfaces/ad.interface";

/**
 * @openapi
 * /api/ads:
 *   post:
 *     summary: 新增廣告（支援圖片上傳）
 *     description: |
 *       用於建立新的廣告資料。
 *       若上傳圖片，後端會將圖片存放並轉換為可用的 imageUrl。
 *       所有廣告預設會包含 createdAt 與 updatedAt。
 *     tags:
 *       - Ads
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "雙11年度優惠活動"
 *               text:
 *                 type: string
 *                 example: "全館 5 折起，限時三天！"
 *               linkUrl:
 *                 type: string
 *                 example: "https://example.com/1111-sale"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               imageUrl:
 *                 type: string
 *                 example: "https://cdn.example.com/uploads/ad-123.jpg"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 廣告圖片，上傳後會被轉為 imageUrl
 *     responses:
 *       201:
 *         description: 成功建立廣告
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "68fa96d1f2460b7033ab3b6b"
 *                     title:
 *                       type: string
 *                       example: "雙11年度優惠活動"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://cdn.example.com/uploads/ad-123.jpg"
 *                     linkUrl:
 *                       type: string
 *                       example: "https://example.com/1111-sale"
 *                     text:
 *                       type: string
 *                       example: "全館 5 折起，限時三天！"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-23T20:57:53.449Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-23T20:57:53.449Z"
 *       400:
 *         description: 缺少必要欄位或無效資料
 *       500:
 *         description: 伺服器內部錯誤
 */
export default defineEventHandler(async (event) => {
    const form = await readMultipartFormData(event);
    const data = await parseForm<IAd>(form);

    const ad = await createAd(data);

    return {
        success: true,
        data: ad,
    };
});
