// server/api/restaurants/[id].get.ts

import { getRestaurantById } from "@server/services/restaurants.service";

/**
 * @openapi
 * /api/restaurants/{id}:
 *
 *   get:
 *     summary: 取得單一餐廳
 *     tags:
 *       - Restaurants
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 餐廳 ID
 *         schema:
 *           type: string
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
    const id = getRouterParam(event, "id") as string;

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Restaurant id is required",
        });
    }

    const restaurant = await getRestaurantById(id);

    return {
        success: true,
        count: 1,
        data: restaurant,
    };
});
