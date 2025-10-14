import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    info: String
})


const restaurantSchema = new mongoose.Schema({
    name: String,
    address: String,
    phone: String,
    image: String,
    info: String,
    tags: [String],
    menu: [menuItemSchema],
    // optional location field to store geocoded coordinates
    // 使用簡單的 lat/lon 結構以利測試與查詢
    location: {
        lat: Number,
        lon: Number
    }
})

export default mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);