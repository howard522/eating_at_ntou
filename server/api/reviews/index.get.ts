import { defineEventHandler, getQuery, createError, type H3Event } from 'h3'
import connectDB from '@server/utils/db'
import Review from '@server/models/review.model'

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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
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
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       400:
 *         description: 缺少餐廳 ID
 */
export default defineEventHandler(async (event: H3Event) => {
    await connectDB()
    const query = getQuery(event)
    const restaurantId = query.restaurantId
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const sort = query.sort as string || 'newest'

    if (!restaurantId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required parameter: restaurantId'
        })
    }

    let sortOptions: any = { createdAt: -1 }
    if (sort === 'highest') {
        sortOptions = { rating: -1, createdAt: -1 }
    } else if (sort === 'lowest') {
        sortOptions = { rating: 1, createdAt: -1 }
    }

    const skip = (page - 1) * limit

    const total = await (Review as any).countDocuments({ restaurant: restaurantId })
    const reviews = await (Review as any).find({ restaurant: restaurantId })
        .populate('user', 'name img')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)

    return {
        success: true,
        data: {
            items: reviews,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    }
})
