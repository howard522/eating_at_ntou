import { defineEventHandler, createError } from 'h3'
import connectDB from '../../utils/db'
import Cart from '../../models/cart.model'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: 取得目前使用者的購物車
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功回傳購物車
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *             examples:
 *               cartExample:
 *                 summary: 範例回傳，購物車內有一筆商品
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "64f1a3b2c4d5e6f7890abcc3"
 *                     user: "64f1a3b2c4d5e6f7890abcc4"
 *                     items:
 *                       - restaurantId: "64f1a3b2c4d5e6f7890abca1"
 *                         menuItemId: "64f1a3b2c4d5e6f7890abcb2"
 *                         name: "炸雞腿"
 *                         price: 120
 *                         quantity: 1
 *                         options: { "辣度": "小辣" }
 *                     currency: "TWD"
 *                     total: 120
 */
export default defineEventHandler(async (event) => {
    await connectDB()

    // Auth: expect Authorization: Bearer <token>
    const auth = event.node.req.headers['authorization'] || event.node.req.headers['Authorization']
    //auth: 是 Bearer <token>，用來驗證使用者身份
    if (!auth || typeof auth !== 'string') throw createError({ statusCode: 401, statusMessage: 'missing authorization' })
    const m = auth.match(/Bearer\s+(.+)/i)
    if (!m) throw createError({ statusCode: 401, statusMessage: 'invalid authorization format' })
    const token = m[1]

    let payload: any
    try {
        payload = jwt.verify(token, JWT_SECRET)
    } catch (e) {
        throw createError({ statusCode: 401, statusMessage: 'invalid token' })
    }

    const userId = payload.id
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'invalid token payload' })

    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
        return { success: true, data: { items: [], total: 0, currency: 'TWD' } }
    }

    return { success: true, data: cart }
})
