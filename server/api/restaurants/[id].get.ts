//取得特定餐廳資訊
import Restaurant from '../../models/restaurant.model'
import connectDB from "../../utils/db";

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