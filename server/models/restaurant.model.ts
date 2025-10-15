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
    menu: [menuItemSchema]
})

// GeoJSON location for geospatial queries. Keep separate to avoid breaking existing code.
restaurantSchema.add({
    locationGeo: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] } // [lon, lat]
    }
});

// 2dsphere index for geospatial queries
restaurantSchema.index({ locationGeo: '2dsphere' });

export default mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);