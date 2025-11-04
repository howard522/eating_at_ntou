import { defineEventHandler, readBody, createError } from 'h3'
import connectDB from '../../../utils/db'
import Order from '../../../models/order.model'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     summary: 更新訂單狀態
 *     description: 顧客或外送員可更新訂單進度（customerStatus 或 deliveryStatus）。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerStatus:
 *                 type: string
 *                 enum: [preparing, on_the_way, received, completed]
 *               deliveryStatus:
 *                 type: string
 *                 enum: [preparing, on_the_way, delivered, completed]
 *           example:
 *             customerStatus: "received"
 *             deliveryStatus: "delivered"
 *     responses:
 *       200:
 *         description: 成功更新狀態
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 */

export default defineEventHandler(async (event) => {
    await connectDB()
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
    const orderId = event.context.params.id
    const body = await readBody(event)

    const order = await Order.findById(orderId)
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

    // 權限判斷（若非訂單擁有者或外送員則拒絕）
    if (String(order.user) !== userId && String(order.deliveryPerson) !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Not allowed to modify this order' })
    }

    // 更新狀態
    if (body.customerStatus) order.customerStatus = body.customerStatus
    if (body.deliveryStatus) order.deliveryStatus = body.deliveryStatus

    await order.save()
    return { success: true, data: order }
})
