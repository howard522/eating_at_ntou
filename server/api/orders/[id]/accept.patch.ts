import { defineEventHandler, createError } from 'h3'
import connectDB from '../../../utils/db'
import Order from '../../../models/order.model'
import { verifyJwtFromEvent } from '../../../utils/auth'

/**
 * 前端請注意：
 * api不會檢查使用者是否為外送員，請自行在前端確認使用者角色後再呼叫此API。
 */

/**
 * @openapi
 * /api/orders/{id}/accept:
 *   patch:
 *     summary: 外送員接單
 *     description: 外送員可接下尚未被接的訂單，並將外送狀態更新為 on_the_way。
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
 *     responses:
 *       200:
 *         description: 成功接單
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               data:
 *                 _id: "671c0c2f5c3b5a001276a7ff"
 *                 deliveryPerson: "670a15fa5c3b5a001279cc33"
 *                 deliveryStatus: "on_the_way"
 */

export default defineEventHandler(async (event) => {
    await connectDB()

    const payload = await verifyJwtFromEvent(event)
    const userId = payload.id
    const orderId = event.context.params?.id
    if (!orderId) throw createError({ statusCode: 400, statusMessage: 'Missing order id' })

    const order = await Order.findById(orderId)
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (order.deliveryPerson)
        throw createError({ statusCode: 409, statusMessage: 'Order already accepted' })

    order.deliveryPerson = userId
    order.deliveryStatus = 'on_the_way'
    await order.save()

    // populate deliveryPerson so API 回傳格式與其他 endpoint 一致（含 name/img/phone）
    try {
        await order.populate('deliveryPerson', 'name img phone')
    } catch (e) {
        // ignore populate errors
    }

    return { success: true, data: order }
})
