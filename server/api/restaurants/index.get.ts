import Restaurant from '../../models/restaurant.model'
import connectDB from "../../utils/db";

export default defineEventHandler(async (event) => {
    await connectDB();
    // Search for restaurants in the database
    const query = getQuery(event);
    const keyword = query.search as string || '';// Default to empty string if no keyword provided
    console.log('Searching for restaurants with keyword:', keyword);
    const restaurants = await Restaurant.find({
        $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { location: { $regex: keyword, $options: 'i' } },
            { 'menu.name': { $regex: keyword, $options: 'i' } }
        ]
    });// Case-insensitive search
    return {
        success: true,
        count: restaurants.length,
        data: restaurants
    }
});
