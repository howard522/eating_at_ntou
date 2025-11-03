import { defineEventHandler, getQuery, createError } from 'h3'
import connectDB from '../../utils/db'
import Order from '../../models/order.model'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: 查詢使用者或外送員的訂單
 *     description: 
 *       根據使用者角色查詢訂單：  
 *       - 若角色為顧客，回傳該使用者下的訂單。  
 *       - 若角色為外送員，回傳該使用者接的訂單。  
 *       可使用 `?role=customer` 或 `?role=delivery` 明確指定。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: role
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [customer, delivery]
 *         description: 查詢角色類型（不指定則預設為 customer）
 *     responses:
 *       200:
 *         description: 成功取得訂單列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "671c0c2f5c3b5a001276a7ff"
 *                   total: 420
 *                   currency: "TWD"
 *                   items:
 *                     - name: "三杯雞"
 *                       price: 220
 *                       quantity: 1
 *                       restaurant:
 *                         name: "傑哥加長加長菜"
 *                   customerStatus: "completed"
 *                   deliveryStatus: "delivered"
 *                   createdAt: "2025-11-02T14:10:22.000Z"
 */

export default defineEventHandler(async (event) => {
    await connectDB()

    //驗證 JWT
    const auth = event.node.req.headers['authorization']
    if (!auth) throw createError({ statusCode: 401, statusMessage: 'missing authorization' })

    const token = auth.split(' ')[1]
    let payload: any
    try {
        payload = jwt.verify(token, JWT_SECRET)
    } catch {
        throw createError({ statusCode: 401, statusMessage: 'invalid token' })
    }

    const userId = payload.id
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'invalid token payload' })

    // 取得角色參數（預設為 customer）
    const query = getQuery(event)
    const role = query.role === 'delivery' ? 'delivery' : 'customer'

    // 查詢條件
    const condition =
        role === 'delivery'
            ? { deliveryPerson: userId }
            : { user: userId }

    // 查詢訂單（新到舊）
    const orders = await Order.find(condition).sort({ createdAt: -1 }).lean()

    return {
        success: true,
        data: orders,
        role
    }
})
