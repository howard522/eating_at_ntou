import Restaurant from '../models/restaurant.model'
import connectDB from "../utils/db";

export default defineEventHandler(async (event) => {
    await connectDB();
    const restaurants = await Restaurant.find();
    return restaurants;
});
