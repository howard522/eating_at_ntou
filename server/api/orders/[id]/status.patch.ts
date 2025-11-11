import { defineEventHandler, readBody, createError } from 'h3'
import connectDB from '@server/utils/db'
import Order from '@server/models/order.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

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
    const payload = await verifyJwtFromEvent(event)
    const userId = payload.id
    const orderId = event.context.params?.id
    if (!orderId) throw createError({ statusCode: 400, statusMessage: 'Missing order id' })
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

    // 自動完成訂單
    const isCustomerDone = ['received', 'completed'].includes(order.customerStatus)
    const isDeliveryDone = ['delivered', 'completed'].includes(order.deliveryStatus)

    if (isCustomerDone && isDeliveryDone) {
        order.customerStatus = 'completed'
        order.deliveryStatus = 'completed'
    }

    await order.save()

    // 若有外送員，populate deliveryPerson 以回傳 name/img/phone（與其他 endpoint 保持一致）
    try {
        if (order.deliveryPerson) await order.populate('deliveryPerson', 'name img phone')
    } catch (e) {
        // ignore
    }

    return { success: true, data: order }
})
