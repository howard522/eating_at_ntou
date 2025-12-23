// server/api/reviews/index.get.ts

import { getReviewsByRestaurantId } from "@server/services/reviews.service";

/**
 * @openapi
 * /api/reviews:
 *   get:
 *     summary: 取得餐廳評論
 *     description: 取得特定餐廳的評論列表，包含使用者資訊（暱稱、頭像），支援排序與分頁
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: 餐廳 ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: ['newest', 'highest', 'lowest']
 *           default: newest
 *         description: "排序方式 (newest: 最新, highest: 最高分, lowest: 最低分)"
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 跳過筆數
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁筆數
 *     responses:
 *       200:
 *         description: 成功取得評論列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         skip:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       400:
 *         description: 缺少餐廳 ID
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const restaurantId = query.restaurantId as string;
    const skip = parseInt(query.skip as string) || 0;
    const limit = parseInt(query.limit as string) || 10;
    const sort = (query.sort as "newest" | "highest" | "lowest" | undefined) || "newest";

    if (!restaurantId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: restaurantId.",
        });
    }

    const { total, reviews } = await getReviewsByRestaurantId(restaurantId, sort, { skip, limit });

    return {
        success: true,
        count: reviews.length,
        reviews,
    };
});
