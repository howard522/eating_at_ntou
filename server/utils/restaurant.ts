import Restaurant from '../models/restaurant.model'

export async function updateRestaurantById(id: string, data: any) {
    try {
        const updated = await Restaurant.findByIdAndUpdate(
            id, data, {
            new: true, // return the updated document
            runValidators: true // run schema validators
        })
    } catch (error) {
        console.error('Error updating restaurant: ', error)
        throw error
    }
}