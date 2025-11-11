// server/api/admin/restaurants/[id].patch.ts
import { defineEventHandler, readMultipartFormData } from 'h3'
import { updateRestaurantById } from '@server/utils/restaurant'
import { geocodeAddress } from '@server/utils/nominatim'
import type { UpdateRestaurantBody } from '@server/utils/types'
/**
 * @openapi
 * /api/admin/restaurants/{id}:
 *   patch:
 *     summary: 管理員更新指定餐廳資訊（自動地理編碼與圖片上傳）
 *     description: >
 *       僅限管理員使用，用於更新餐廳主體資料（不含菜單）。
 *       若傳入新的 `image` 圖片，系統會自動上傳至 Imgbb 並回傳圖片 URL。
 *       若提供新的 `address`，系統會自動透過 Nominatim API 取得地理座標並更新 `locationGeo` 欄位。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 餐廳的唯一 MongoDB ObjectId
 *         schema:
 *           type: string
 *           example: "6731e8adfb75b5f214ecb321"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "海大食堂"
 *               address:
 *                 type: string
 *                 example: "基隆市中正區北寧路2號"
 *               phone:
 *                 type: string
 *                 example: "02-2462-2192"
 *               info:
 *                 type: string
 *                 example: "學生餐廳，供應中式與飲品"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["中式", "學生餐", "平價"]
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 餐廳封面圖檔（由後端自動上傳至 Imgbb）
 *     responses:
 *       200:
 *         description: 成功更新餐廳資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: 無效的更新資料或地理編碼失敗
 *       401:
 *         description: 未登入或 Token 無效
 *       403:
 *         description: 權限不足（非管理員）
 *       404:
 *         description: 找不到指定餐廳
 *       500:
 *         description: 伺服器內部錯誤
 */


export default defineEventHandler(async (event) => {
    const form = await readMultipartFormData(event)
    const id = event.context.params?.id as string
    const data: Partial<UpdateRestaurantBody> = {}

    for (const field of form || []) {
        // 餐廳封面圖
        if (field.name === 'image' && typeof field.type === 'string' && field.type.startsWith('image/')) {
            const blob = new Blob([new Uint8Array(field.data)], { type: field.type })
            const formData = new FormData()
            formData.append('image', blob, field.filename)

            const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMAGEBB_API_KEY}`, {
                method: 'POST',
                body: formData
            })
            const json = await res.json()
            if (json.success) data.image = json.data.url
            continue
        }

        // 文字欄位
        if (field.name) {
            let val: any = field.data.toString()
            if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
                try { val = JSON.parse(val) } catch { }
            }
            data[field.name as keyof UpdateRestaurantBody] = val
        }
    }

    // 自動地理編碼
    if (data.address) {
        try {
            const coords = await geocodeAddress(data.address)
            if (coords) {
                data.locationGeo = {
                    type: 'Point',
                    coordinates: [coords.lon, coords.lat]
                }
            }
        } catch (err) {
            console.error('Geocoding failed:', err)
        }
    }

    const updated = await updateRestaurantById(id, data)
    if (!updated) throw new Error('Restaurant not found')
    return { success: true, restaurant: updated }
})
