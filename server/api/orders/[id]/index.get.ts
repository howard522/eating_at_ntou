import { defineEventHandler, createError } from 'h3'
import connectDB from '../../../utils/db'
import Order from '../../../models/order.model'
import { verifyJwtFromEvent } from '../../../utils/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: 查詢單筆訂單資訊
 *     description: 根據訂單 ID 取得詳細資料（含餐點快照、外送與顧客資訊）。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 訂單 ID
 *     responses:
 *       200:
 *         description: 成功取得訂單資訊
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
 *                 user:
 *                   id: "670a15fa5c3b5a001279cc22"
 *                   name: "宋辰星"
 *                 deliveryPerson:
 *                   id: "670a15fa5c3b5a001279cc33"
 *                   name: "小明"
 *                 total: 450
 *                 deliveryFee: 30
 *                 arriveTime: "2024-08-01T12:30:00.000Z"
 *                 currency: "TWD"
 *                 customerStatus: "completed"
 *                 deliveryStatus: "completed"
 *                 items:
 *                   - name: "三杯雞"
 *                     price: 220
 *                     quantity: 1
 *                     restaurant:
 *                       name: "傑哥加長加長菜"
 *                 deliveryInfo:
 *                   address: "基隆市中正區OO路123號"
 *                   contactName: "宋辰星"
 *                   contactPhone: "0912-345-678"
 *                   note: "請放門口"
 */

export default defineEventHandler(async (event) => {
    await connectDB()

    const payload = await verifyJwtFromEvent(event)
    const userId = payload.id
    if (!event.context.params?.id)
        throw createError({ statusCode: 400, statusMessage: 'Missing order id' })

    const orderId = event.context.params.id
    const order = await Order.findById(orderId)
        .populate('user', 'name email')
        .populate('deliveryPerson', 'name email')
        .lean()

    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

    // 權限檢查：顧客、外送員（只能查自己的訂單）
    // 或 Admin 都可查
    const isOwner = String(order.user?._id || order.user) === userId
    const isDelivery = String(order.deliveryPerson?._id || order.deliveryPerson) === userId
    const isAdmin = payload.role === 'admin' || payload.role === 'multi'

    if (!isOwner && !isDelivery && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Not allowed to view this order' })
    }


    return { success: true, data: order }
})
