import { defineEventHandler, createError } from 'h3'
import connectDB from '../../utils/db'
import Order from '../../models/order.model'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * @openapi
 * /api/orders/available:
 *   get:
 *     summary: 查詢可接單列表
 *     description: 取得所有尚未被外送員接單、狀態為準備中的訂單清單。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功取得可接單列表
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
 *                   user: "670a15fa5c3b5a001279cc22"
 *                   total: 450
 *                   deliveryFee: 30
 *                   currency: "TWD"
 *                   items:
 *                     - name: "三杯雞"
 *                       price: 220
 *                       quantity: 1
 *                       restaurant:
 *                         name: "傑哥加長加長菜"
 *                   deliveryInfo:
 *                     address: "基隆市中正區OO路123號"
 *                     contactName: "宋辰星"
 *                     contactPhone: "0912-345-678"
 *                     note: "請放門口"
 *                   customerStatus: "preparing"
 *                   deliveryStatus: "preparing"
 */

export default defineEventHandler(async (event) => {
    await connectDB()

    // 驗證 JWT
    const auth = event.node.req.headers['authorization']
    if (!auth) throw createError({ statusCode: 401, statusMessage: 'missing authorization' })
    const token = auth.split(' ')[1]
    let payload: any
    try {
        payload = jwt.verify(token, JWT_SECRET)
    } catch {
        throw createError({ statusCode: 401, statusMessage: 'invalid token' })
    }

    // 查詢尚未接單的訂單
    const orders = await Order.find({
        deliveryPerson: null,
        deliveryStatus: 'preparing'
    })
        .sort({ createdAt: -1 })
        .lean()

    return {
        success: true,
        data: orders
    }
})
