import Restaurant from '../../models/restaurant.model'
import connectDB from "../../utils/db";

/**
 * @openapi
 * /api/restaurants/{id}:
 *   get:
 *     summary: 取得單一餐廳
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 餐廳 ID
 *     responses:
 *       200:
 *         description: 成功回傳餐廳
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: 找不到餐廳
 */
export default defineEventHandler(async (event) => {
    await connectDB();
    const id = getRouterParam(event, 'id');
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Restaurant not found'
        });
    }
    return {
        success: true,
        count: 1,
        data: restaurant
    }
})