import { defineEventHandler, readBody, createError } from 'h3'
import connectDB from '../../utils/db'
import Cart from '../../models/cart.model'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     summary: 新增或替換使用者購物車項目
 *     description: 接受 body.items 陣列（每項符合 CartItem schema），會建立或更新使用者的購物車。
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *           examples:
 *             singleItem:
 *               summary: 範例 - 單一商品加入購物車
 *               value:
 *                 items:
 *                   - restaurantId: "64f1a3b2c4d5e6f7890abca1"
 *                     menuItemId: "64f1a3b2c4d5e6f7890abcb2"
 *                     name: "炸雞腿"
 *                     price: 120
 *                     quantity: 1
 *                     options: { "辣度": "小辣" }
 *     responses:
 *       200:
 *         description: 更新成功並回傳最新購物車
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
 *               successWithCart:
 *                 summary: 回傳包含剛加入項目的購物車
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
    const body = await readBody(event)

    // Auth
    const auth = event.node.req.headers['authorization'] || event.node.req.headers['Authorization']
    if (!auth || typeof auth !== 'string') throw createError({ statusCode: 401, statusMessage: 'missing authorization' })
    const m = auth.match(/Bearer\s+(.+)/i)
    if (!m) throw createError({ statusCode: 401, statusMessage: 'invalid authorization format' })
    const token = m[1]
    let payload: any
    try { payload = jwt.verify(token, JWT_SECRET) } catch (e) { throw createError({ statusCode: 401, statusMessage: 'invalid token' }) }
    const userId = payload.id
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'invalid token payload' })

    // Expect body.items: array of { name, price, quantity, restaurantId?, menuItemId?, options? }
    const items = Array.isArray(body.items) ? body.items : []
    if (!items.length) {
        return { success: false, message: 'items array required' }
    }

    // Upsert cart for user
    let cart = await Cart.findOne({ user: userId })
    if (!cart) {
        // create new cart
        cart = new Cart({ user: userId, items })
    } else {
        // if cart is locked, disallow modifications
        if (cart.status === 'locked') {
            throw createError({ statusCode: 409, statusMessage: 'cart is locked and cannot be modified' })
        }
        // naive merge: replace items with provided
        cart.items = items
    }

    await cart.save()
    return { success: true, data: cart }
})
