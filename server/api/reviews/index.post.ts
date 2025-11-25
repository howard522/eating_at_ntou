import { defineEventHandler, readBody, createError, type H3Event } from 'h3'
import connectDB from '@server/utils/db'
import Review from '@server/models/review.model'
import Restaurant from '@server/models/restaurant.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

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
 */

export default defineEventHandler(async (event: H3Event) => {
    await connectDB()
    const body = await readBody(event)
    const payload = await verifyJwtFromEvent(event)
    const userId = payload.id

    const { restaurantId, rating, content } = body

    if (!restaurantId || !rating || !content) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields: restaurantId, rating, content'
        })
    }

    if (rating < 1 || rating > 5) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Rating must be between 1 and 5'
        })
    }

    const restaurant = await (Restaurant as any).findById(restaurantId)
    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Restaurant not found'
        })
    }

    const review = new Review({
        user: userId,
        restaurant: restaurantId,
        rating,
        content
    })

    await review.save()

    return {
        success: true,
        data: review
    }
})
