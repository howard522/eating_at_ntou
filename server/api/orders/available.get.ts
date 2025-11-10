import { defineEventHandler, createError, getQuery } from 'h3'
import connectDB from '@server/utils/db'
import Order from '@server/models/order.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

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
 *     parameters:
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: 每頁最大回傳筆數（預設 50，上限 100）
 *       - name: skip
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: 跳過筆數（用於分頁，預設 0）
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
 *                 count:
 *                   type: integer
 *                   description: 本次回傳的訂單筆數（受 limit/skip 影響）
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               count: 1
 *               data:
 *                 - _id: "671c0c2f5c3b5a001276a7ff"
 *                   user: "670a15fa5c3b5a001279cc22"
 *                   total: 450
 *                   deliveryFee: 30
 *                   arriveTime: "2024-08-01T12:30:00.000Z"
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

    // Auth
    const payload = await verifyJwtFromEvent(event)

    const query = getQuery(event)
    // 分頁參數
    const DEFAULT_LIMIT = 50
    const MAX_LIMIT = 100
    let limit = Number(query.limit) || DEFAULT_LIMIT
    limit = Math.min(limit, MAX_LIMIT)
    const skip = Number(query.skip) || 0

    // 查詢尚未接單的訂單（支援 skip / limit）
    const orders = await Order.find({
        deliveryPerson: null,
        deliveryStatus: 'preparing'
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

    return {
        success: true,
        count: orders.length,
        data: orders
    }
})
