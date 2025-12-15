// server/api/ads/random.get.ts

import { getRandomAd } from "@server/services/ad.service";

/**
 * @openapi
 * /api/ads/random:
 *   get:
 *     summary: 取得隨機廣告
 *     description: 回傳一則隨機的廣告資料。
 *     tags:
 *       - Ads
 *     responses:
 *       200:
 *         description: 成功回傳隨機廣告
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
 *                       example: "夏日特賣會"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://example.com/ad-image.jpg"
 *                     linkUrl:
 *                       type: string
 *                       example: "https://example.com/sale"
 *                     text:
 *                       type: string
 *                       example: "限時優惠，錯過不再！"
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
 *                       example: "2025-10-27T11:14:23.947Z"
 */
export default defineEventHandler(async (event) => {
    const ad = await getRandomAd();

    return {
        success: true,
        data: ad,
    };
});
