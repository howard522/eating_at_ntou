import Restaurant from "$models/restaurant.model";
import Review from "$models/review.model";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
    throw new Error("Please define the MONGO_URI environment variable inside .env");
}

async function updateRestaurantRating(restaurantId: mongoose.Types.ObjectId) {
    const stats = await Review.aggregate([
        { $match: { restaurant: restaurantId } },
        { $group: { _id: "$restaurant", averageRating: { $avg: "$rating" } } },
    ]);

    const averageRating = stats.length > 0 ? stats[0].averageRating : 0;

    // Round to 1 decimal place if needed, or keep as float. 
    // Usually ratings are displayed with 1 decimal, but storing more precision is fine.
    // Let's keep it as is from the service logic.

    await Restaurant.findByIdAndUpdate(restaurantId, { rating: averageRating });
    return averageRating;
}

async function main() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const restaurants = await Restaurant.find({});
        console.log(`Found ${restaurants.length} restaurants.`);

        for (const restaurant of restaurants) {
            const rating = await updateRestaurantRating(restaurant._id);
            console.log(`Updated restaurant "${restaurant.name}" (${restaurant._id}) rating to ${rating}`);
        }

        console.log("All restaurants updated.");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

main();
