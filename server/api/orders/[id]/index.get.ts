import { defineEventHandler, createError } from 'h3'
import connectDB from '@server/utils/db'
import Order from '@server/models/order.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

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
 *                   _id: "670a15fa5c3b5a001279cc33"
 *                   name: "小明"
 *                   img: "https://example.com/avatar/min.png"
 *                   phone: "0912-111-222"
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
 *                       phone: "02-1234-5678"
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
    const order: any = await Order.findById(orderId)
        .populate('user', 'name email')
        // 將外送員回傳必要欄位：name, img, phone
        .populate('deliveryPerson', 'name img phone')
        // items.restaurant.phone 已存為 snapshot，無需額外 populate
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

    // 正規化 deliveryPerson：考慮可能為 null（尚未被外送員接單）或未被 populate
    try {
        if (order.deliveryPerson) {
            // 若為 populated object，取必要欄位；若僅為 id（未 populate），只回傳 id
            const dp: any = order.deliveryPerson
            order.deliveryPerson = {
                _id: dp._id || dp,
                name: dp.name || null,
                img: dp.img || '',
                phone: dp.phone || '',
            }
        } else {
            order.deliveryPerson = null
        }
    } catch (e) {
        // 若任何情況發生錯誤，保險起見設為 null
        order.deliveryPerson = null
    }

    // restaurant phone 已在 order.snapshot (items[].restaurant.phone)，不需額外處理

    return { success: true, data: order }
})
