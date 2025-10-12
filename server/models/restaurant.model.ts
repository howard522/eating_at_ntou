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
    menu: [menuItemSchema]
})

export default mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);