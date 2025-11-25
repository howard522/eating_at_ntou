// api/admin/restaurants/[id]/menu.post.ts
import { defineEventHandler, readMultipartFormData } from 'h3'
import Restaurant from '@server/models/restaurant.model'
/**
 * @openapi
 * /api/admin/restaurants/{id}/menu:
 *   post:
 *     summary: 為指定餐廳新增菜單項目（支援圖片上傳）
 *     description: >
 *       僅限管理員使用。  
 *       可新增一個菜單項目，若上傳圖片，系統會自動上傳至 Imgbb 並儲存其 URL。
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
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "牛肉湯麵"
 *               price:
 *                 type: number
 *                 example: 120
 *               info:
 *                 type: string
 *                 example: "附湯與小菜，限午餐供應"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 上傳圖片檔案，會自動上傳至 Imgbb 並回傳 URL
 *     responses:
 *       201:
 *         description: 成功建立新菜單項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 menuItem:
 *                   $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: 無效的請求資料或圖片上傳失敗
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

    const restaurantId = event.context.params?.id as string
    const form = await readMultipartFormData(event)

    const data: { name?: string; price?: string; info?: string; image?: string } = {}
    const allowedFields = ['name', 'price', 'info', 'image']

    for (const field of form || []) {
        // 忽略不允許或沒有名稱的欄位
        if (!field.name || !allowedFields.includes(field.name)) {
            continue
        }

        if (field.name === 'image' && field.type?.startsWith('image/')) {
            try {
                const blob = new Blob([new Uint8Array(field.data)], { type: field.type })
                const fd = new FormData()
                fd.append('image', blob, field.filename)
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMAGEBB_API_KEY}`, {
                    method: 'POST',
                    body: fd
                })
                const json = await res.json()
                if (json.success) {
                    data.image = json.data.url
                } else {
                    console.error('ImgBB upload failed:', json)
                }
            } catch (error) {
                console.error('Error uploading image to ImgBB:', error)
            }
        } else if (field.name !== 'image') { // 處理其他允許的文字欄位
            data[field.name as 'name' | 'price' | 'info'] = field.data.toString().trim()
        }
    }

    // 驗必填
    if (!data.name || !data.price) {
        throw createError({ statusCode: 400, message: 'name and price are required' })
    }

    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) throw createError({ statusCode: 404, message: 'Restaurant not found' })

    const newMenuItem = {
        name: data.name,
        price: Number(data.price),
        info: data.info || '', // 確保 info 存在
        image: data.image // image 可能是 undefined，表示沒有上傳圖片，OK的
    }

    restaurant.menu.push(newMenuItem)
    await restaurant.save()

    // 回傳剛剛建立的資源
    const createdItem = restaurant.menu[restaurant.menu.length - 1];

    setResponseStatus(event, 201) // 設定 HTTP 狀態碼為 201 Created
    return { success: true, menuItem: createdItem }
})
