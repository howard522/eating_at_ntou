// server/api/reviews/index.post.ts

import { getRestaurantById } from "@server/services/restaurants.service";
import { createReview } from "@server/services/reviews.service";
import { getCurrentUser } from "@server/utils/getCurrentUser";

/**
 * @openapi
 * /api/reviews:
 *   post:
 *     summary: 建立新評論
 *     description: 使用者對餐廳建立新的評論
 *     tags:
 *       - Reviews
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - rating
 *               - content
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 description: 餐廳 ID
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 評分 (1-5)
 *               content:
 *                 type: string
 *                 description: 評論內容
 *     responses:
 *       201:
 *         description: 評論建立成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 未授權
 *       404:
 *         description: 找不到餐廳
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
export default defineEventHandler(async (event) => {
    const userId = getCurrentUser(event).id;

    const body = await readBody(event);

    const { restaurantId, rating, content } = body;

    if (!restaurantId || !rating || !content) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required fields: restaurantId, rating, content",
        });
    }

    if (rating < 1 || rating > 5) {
        throw createError({
            statusCode: 422,
            statusMessage: "Unprocessable Entity",
            message: "Rating must be between 1 and 5",
        });
    }

    const restaurant = await getRestaurantById(restaurantId);
    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: "Restaurant not found",
        });
    }

    const review = await createReview({
        restaurant: restaurantId,
        user: userId,
        rating,
        content,
    });

    return {
        success: true,
        data: review,
    };
});
