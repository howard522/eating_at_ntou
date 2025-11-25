import { defineEventHandler, readBody, createError } from 'h3'
import connectDB from '@server/utils/db'
import Cart from '@server/models/cart.model'
import { verifyJwtFromEvent } from '@server/utils/auth'
import { clearUserCart } from '@server/utils/cart'


/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     summary: 新增或替換使用者購物車項目
 *     description: 接受 body.items 陣列（每項符合 CartItem schema），會建立或更新使用者的購物車。
 *     tags:
 *       - Cart
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
 *           example:
 *             items:
 *               - restaurantId: "68f2426335e9054c99b316a0"
 *                 menuItemId: "68f2426335e9054c99b316a1"
 *                 name: "三杯雞"
 *                 price: 220
 *                 quantity: 1
 *                 options:
 *                   辣度: "小辣"
 *               - restaurantId: "68f2426335e9054c99b316a0"
 *                 menuItemId: "68f2426335e9054c99b316a2"
 *                 name: "讓我看看"
 *                 price: 100
 *                 quantity: 2
 *                 options:
 *                   辣度: "小辣"
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
 *             example:
 *               success: true
 *               data:
 *                 _id: "64f1a3b2c4d5e6f7890abcc3"
 *                 user: "64f1a3b2c4d5e6f7890abcc4"
 *                 items:
 *                   - restaurantId: "68f2426335e9054c99b316a0"
 *                     menuItemId: "68f2426335e9054c99b316a1"
 *                     name: "三杯雞"
 *                     price: 220
 *                     quantity: 1
 *                     options:
 *                       辣度: "小辣"
 *                   - restaurantId: "68f2426335e9054c99b316a0"
 *                     menuItemId: "68f2426335e9054c99b316a2"
 *                     name: "讓我看看"
 *                     price: 100
 *                     quantity: 2
 *                     options:
 *                       辣度: "小辣"
 *                 currency: "TWD"
 *                 total: 420
 */

export default defineEventHandler(async (event) => {
    await connectDB()
    const body = await readBody(event)

    // Auth
    const payload = await verifyJwtFromEvent(event)
    const userId = payload.id

    // Expect body.items: array of { name, price, quantity, restaurantId?, menuItemId?, options? }
    const items = Array.isArray(body.items) ? body.items : []
    if (!items.length) {
        //return { success: false, message: 'items array required' }
        //允許清空購物車 好耶(2025/11/02)
        await clearUserCart(userId)
        return { success: true, data: { items: [], total: 0, currency: 'TWD' } }
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
