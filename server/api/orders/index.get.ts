import { defineEventHandler, getQuery, createError } from 'h3'
import connectDB from '@server/utils/db'
import Order from '@server/models/order.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

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
 *         description: 成功取得訂單列表
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
 *                 role:
 *                   type: string
 *                   description: 本次查詢使用的角色（customer 或 delivery）
 *             example:
 *               success: true
 *               count: 1
 *               role: "customer"
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

    // Auth
    const payload = await verifyJwtFromEvent(event)
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

    // 分頁參數
    const DEFAULT_LIMIT = 50
    const MAX_LIMIT = 100
    let limit = Number(query.limit) || DEFAULT_LIMIT
    limit = Math.min(limit, MAX_LIMIT)
    const skip = Number(query.skip) || 0

    // 查詢訂單（新到舊），支援 skip / limit
    const orders = await Order.find(condition).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

    return {
        success: true,
        count: orders.length,
        data: orders,
        role
    }
})
