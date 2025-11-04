import { defineEventHandler, createError } from 'h3'
import Restaurant from '../../../../models/restaurant.model'

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id as string

    try {
        const deleted = await Restaurant.findByIdAndDelete(id)

        if (!deleted) {
            throw createError({ statusCode: 404, message: 'Restaurant not found' })
        }

        return {
            success: true,
            message: 'Restaurant deleted successfully',
        }
    } catch (err: any) {
        console.error('Delete restaurant failed:', err)
        throw createError({
            statusCode: 500,
            message: 'Failed to delete restaurant',
        })
    }
})
