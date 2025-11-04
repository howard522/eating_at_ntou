// api/admin/restaurants/[id].patch.ts
import { defineEventHandler, readBody } from 'h3';
import { updateRestaurantById } from "../../../utils/restaurant";

/**
 * 
 */

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id as string;
    const data = await readBody(event);

    try {
        const updatedRestaurant = await updateRestaurantById(id, data);
        return updatedRestaurant;
    } catch (error) {
        console.error('Error updating restaurant: ', error);
        throw error;
    }
});