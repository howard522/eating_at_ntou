import Restaurant from '../models/restaurant.model'

/**
 * 更新餐廳資料，會自動略過空字串、null、undefined、空陣列
 */
export async function updateRestaurantById(id: string, data: any) {
    try {
        // 🧹 過濾掉空欄位
        const cleaned: Record<string, any> = {}
        for (const [key, val] of Object.entries(data)) {
            if (
                val === undefined ||
                val === null ||
                (typeof val === 'string' && val.trim() === '') ||
                (Array.isArray(val) && val.length === 0)
            ) {
                continue // skip empty
            }
            cleaned[key] = val
        }

        // 🔧 更新資料庫
        const updated = await Restaurant.findByIdAndUpdate(id, cleaned, {
            new: true,
            runValidators: true,
        })

        return updated
    } catch (error) {
        console.error('Error updating restaurant:', error)
        throw error
    }
}
