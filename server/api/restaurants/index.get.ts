import Restaurant from '../../models/restaurant.model'
import connectDB from "../../utils/db";

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     summary: 搜尋餐廳
 *     description: 根據關鍵字（name / info / address / menu.name）進行不區分大小寫的搜尋
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字(無則回傳所有餐廳)
 *     responses:
 *       200:
 *         description: 成功回傳餐廳清單
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 */
export default defineEventHandler(async (event) => {
    await connectDB();
    // Search for restaurants in the database
    const query = getQuery(event);
    const keyword = query.search as string || '';// Default to empty string if no keyword provided
    console.log('Searching for restaurants with keyword:', keyword);
    const restaurants = await Restaurant.find({
        $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { info: { $regex: keyword, $options: 'i' } },
            { address: { $regex: keyword, $options: 'i' } },
            { 'menu.name': { $regex: keyword, $options: 'i' } }
        ]
    });// Case-insensitive search
    return {
        success: true,
        count: restaurants.length,
        data: restaurants
    }
});
