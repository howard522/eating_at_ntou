import { defineEventHandler, readBody, createError } from 'h3'
import connectDB from '../../utils/db'
import Order from '../../models/order.model'
import Cart from '../../models/cart.model'
import { clearUserCart } from '../../utils/cart'

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'
/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: 建立新訂單
 *     description: 根據購物車內容建立訂單，會自動補全菜單快照並計算外送費。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryInfo:
 *                 type: object
 *                 properties:
 *                   address: { type: string, example: "基隆市中正區OO路123號" }
 *                   contactName: { type: string, example: "宋辰星" }
 *                   contactPhone: { type: string, example: "0912-345-678" }
 *                   note: { type: string, example: "麻煩幫我放門口～" }
 *               deliveryFee:
 *                 type: number
 *                 example: 30
 *                 description: 外送費（預設 0）
 *               arriveTime:
 *                 type: string
 *                 format: date-time
 *           example:
 *             deliveryInfo:
 *               address: "基隆市中正區OO路123號"
 *               contactName: "宋辰星"
 *               contactPhone: "0912-345-678"
 *               note: "麻煩幫我放門口～"
 *             deliveryFee: 30
 *             arriveTime: "2024-08-01T12:30:00.000Z"
 *     responses:
 *       200:
 *         description: 成功建立訂單
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Order' }
 *             example:
 *               success: true
 *               data:
 *                 _id: "671c0c2f5c3b5a001276a7ff"
 *                 total: 450
 *                 deliveryFee: 30
 *                 currency: "TWD"
 *                 arriveTime: "2024-08-01T12:30:00.000Z"
 *                 items:
 *                   - name: "三杯雞"
 *                     price: 220
 *                     quantity: 1
 *                     image: "https://example.com/meal.jpg"
 *                     restaurant:
 *                       id: "66f2426335e9054c99b316a0"
 *                       name: "傑哥加長加長菜"
 *                 deliveryInfo:
 *                   address: "基隆市中正區OO路123號"
 *                   contactName: "宋辰星"
 *                   contactPhone: "0912-345-678"
 *                   note: "麻煩幫我放門口～"
 */

export default defineEventHandler(async (event) => {
    await connectDB()
    const auth = event.node.req.headers['authorization'] || event.node.req.headers['Authorization']
    if (!auth || typeof auth !== 'string') throw createError({ statusCode: 401, statusMessage: 'Authorization header missing' })
    const m = auth.match(/Bearer\s+(.+)/i)
    if (!m) throw createError({ statusCode: 401, statusMessage: 'Invalid authorization format' })
    const token = m[1]
    let payload: any
    try {
        payload = jwt.verify(token, JWT_SECRET)
    } catch (e) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    const userId = payload.id
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'Invalid token payload' })

    const cart = await Cart.findOne({ user: userId }).populate('items.restaurantId', 'name menu')
    if (!cart || cart.items.length === 0) {
        throw createError({ statusCode: 400, statusMessage: '購物車為空，無法建立訂單' })
    }
    if (cart.status !== 'open') {
        throw createError({ statusCode: 400, statusMessage: '購物車狀態不正確，無法建立訂單' })
    }

    const detailedItems = cart.items.map((it: any) => {
        const restaurant = it.restaurantId
        const menuItem = restaurant?.menu?.find((m: any) => String(m._id) === String(it.menuItemId))
        return {
            menuItemId: it.menuItemId,
            name: menuItem?.name || it.name,
            image: menuItem?.image || null,
            info: menuItem?.info || null,
            price: menuItem?.price || it.price,
            quantity: it.quantity,
            restaurant: {
                id: restaurant?._id,
                name: restaurant?.name || '(未知餐廳)',
            },
        }
    })

    const body = await readBody(event)
    const deliveryInfo = body.deliveryInfo || {}
    const deliveryFee = typeof body.deliveryFee === 'number' && body.deliveryFee >= 0 ? body.deliveryFee : 0
    const arriveTime = body.arriveTime || null

    const newOrder = new Order({
        user: userId,
        items: detailedItems,
        total: cart.total + deliveryFee,
        deliveryFee,
        arriveTime,
        currency: cart.currency,
        deliveryInfo,
    })

    await newOrder.save()

    // 鎖定購物車，防止重複下單
    cart.status = 'locked'
    await cart.save()
    // 清空使用者購物車
    await clearUserCart(userId)

    return { success: true, data: newOrder }
})