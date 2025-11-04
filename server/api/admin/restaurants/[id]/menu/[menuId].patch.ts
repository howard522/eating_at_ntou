// api/admin/restaurants/[id]/menu/[menuId].patch.ts
import { defineEventHandler, readMultipartFormData } from 'h3'
import Restaurant from '../../../../../models/restaurant.model'
import type { UpdateMenuItemBody } from '../../../../../utils/types'

/**
 * @openapi
 * /api/admin/restaurants/{id}/menu/{menuId}:
 *   patch:
 *     summary: 新增或更新餐廳菜單項目（支援圖片上傳）
 *     description: >
 *       僅限管理員使用。  
 *       若傳入已存在的 `menuId`，則更新該菜單項目；  
 *       若傳入 `menuId` 為 "new" 或無效值，則自動新增新項目。  
 *       若上傳圖片檔案，系統會自動將其上傳至 Imgbb 並回傳圖片 URL。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []   # 🔒 需要 JWT 驗證
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 餐廳的唯一 MongoDB ObjectId
 *         schema:
 *           type: string
 *           example: "6731e8adfb75b5f214ecb321"
 *       - name: menuId
 *         in: path
 *         required: true
 *         description: >
 *           菜單項目的 MongoDB ObjectId。  
 *           若為 "new" 或無效值，則會自動新增新菜單項。
 *         schema:
 *           type: string
 *           example: "6750b9fc97d3a11504e1d9a5"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "滷肉飯"
 *               price:
 *                 type: number
 *                 example: 70
 *               info:
 *                 type: string
 *                 example: "附湯與小菜"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 菜單項目圖片（由後端自動上傳至 Imgbb）
 *     responses:
 *       200:
 *         description: 成功新增或更新菜單項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 menu:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: 無效請求
 *       401:
 *         description: 未登入或 Token 無效
 *       403:
 *         description: 權限不足（非管理員）
 *       404:
 *         description: 找不到指定餐廳或菜單項目
 *       500:
 *         description: 伺服器內部錯誤
 */



function cleanEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {}
    for (const [key, val] of Object.entries(obj)) {
        if (
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '')
        ) continue
        cleaned[key as keyof T] = val
    }
    return cleaned
}

export default defineEventHandler(async (event) => {
    const restaurantId = event.context.params?.id as string
    const menuId = event.context.params?.menuId
    const form = await readMultipartFormData(event)
    const data: Partial<UpdateMenuItemBody> = {}

    for (const field of form || []) {
        if (field.name === 'image' && field.type?.startsWith('image/')) {
            const blob = new Blob([new Uint8Array(field.data)], { type: field.type })
            const fd = new FormData()
            fd.append('image', blob, field.filename)
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMAGEBB_API_KEY}`, { method: 'POST', body: fd })
            const json = await res.json()
            if (json.success) data.image = json.data.url
        } else {
            data[field.name as keyof UpdateMenuItemBody] = field.data.toString()
        }
    }

    // 清除空值欄位
    const cleanedData = cleanEmptyFields(data)

    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) throw new Error('Restaurant not found')

    // 新增 or 更新邏輯
    const existingItem = restaurant.menu.id(menuId)
    if (existingItem) {
        Object.assign(existingItem, cleanedData)
    } else {
        restaurant.menu.push(cleanedData)
    }

    await restaurant.save()
    return { success: true, menu: restaurant.menu }
})
