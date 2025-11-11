import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import Restaurant from '@server/models/restaurant.model'
import { geocodeAddress } from '@server/utils/nominatim'

/**
 * @openapi
 * /api/admin/restaurants:
 *   post:
 *     summary: 新增餐廳（支援圖片上傳與地理編碼）
 *     description: >
 *       僅限管理員使用。  
 *       可建立新的餐廳資料。若提供地址，系統會自動透過 Nominatim API 取得地理座標。  
 *       若上傳圖片，會自動上傳至 Imgbb 並回傳圖片 URL。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []   # JWT 驗證
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: "海大炸雞專賣店"
 *               address:
 *                 type: string
 *                 example: "基隆市中正區北寧路2號"
 *               phone:
 *                 type: string
 *                 example: "02-2462-1234"
 *               info:
 *                 type: string
 *                 example: "現炸雞排、鹽酥雞、魷魚圈等夜宵好夥伴"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["炸物", "夜宵", "學生最愛"]
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 餐廳封面圖片，上傳後會自動轉為 URL 儲存
 *     responses:
 *       201:
 *         description: 成功建立餐廳
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
 *         description: 缺少必要欄位或無效資料
 *       401:
 *         description: 未登入或 Token 無效
 *       403:
 *         description: 權限不足（非管理員）
 *       500:
 *         description: 伺服器內部錯誤
 */

/** 
 * 關於檢查使用者是否為管理員的 middleware，已在上層路由處理
 * 此處專注於處理餐廳建立邏輯
 */

export default defineEventHandler(async (event) => {
    const form = await readMultipartFormData(event)
    const data: Record<string, any> = {}

    // 逐項處理 multipart 欄位
    for (const field of form || []) {
        if (field.name === 'image' && field.type?.startsWith('image/')) {
            // 上傳封面圖到 Imgbb
            const blob = new Blob([new Uint8Array(field.data)], { type: field.type })
            const fd = new FormData()
            fd.append('image', blob, field.filename)

            const res = await fetch(
                `https://api.imgbb.com/1/upload?key=${process.env.IMAGEBB_API_KEY}`,
                { method: 'POST', body: fd }
            )
            const json = await res.json()
            if (json.success) data.image = json.data.url
        } else {
            const val = field.data.toString().trim()
            if (val !== '') data[field.name] = val
        }
    }

    // 檢查必填欄位
    if (!data.name || !data.address || !data.phone) {
        throw createError({
            statusCode: 400,
            message: 'Missing required fields: name, address, phone',
        })
    }

    // 自動地理定位
    try {
        const coords = await geocodeAddress(data.address)
        if (coords) {
            data.locationGeo = {
                type: 'Point',
                coordinates: [coords.lon, coords.lat],
            }
        }
    } catch (err) {
        console.warn('Geocoding failed:', err)
    }

    try {
        const restaurant = new Restaurant(data)
        await restaurant.save()
        return { success: true, restaurant }
    } catch (err) {
        console.error('Create restaurant failed:', err)
        throw createError({ statusCode: 500, message: 'Failed to create restaurant' })
    }
})
