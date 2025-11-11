import { defineEventHandler, getQuery, createError } from 'h3'
import connectDB from '../../../utils/db'
import Order from '../../../models/order.model'

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     summary: 管理員查詢所有訂單
 *     description: 管理員專用：列出訂單清單，支援分頁與已完成/未完成篩選。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: 是否只查已完成（true）或只查未完成（false）；若不提供則回傳全部
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 最大回傳筆數（預設 50，限制 200）
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: 跳過筆數（用於分頁）
 *     responses:
 *       200:
 *         description: 成功回傳訂單清單
 */
export default defineEventHandler(async (event) => {
    await connectDB()

    try {
        const query = getQuery(event) as Record<string, any>

        const DEFAULT_LIMIT = 50
        const MAX_LIMIT = 200

        // completed: 'true'|'false'|'1'|'0'
        const rawCompleted = query.completed
        let mongoQuery: any = {}

        if (rawCompleted !== undefined) {
            const completed = String(rawCompleted).toLowerCase() === 'true' || String(rawCompleted) === '1'
            if (completed) {
                // 「已完成」定義為 customerStatus 與 deliveryStatus 都為 'completed'
                mongoQuery = {
                    $and: [
                        { customerStatus: 'completed' },
                        { deliveryStatus: 'completed' },
                    ]
                }
            } else {
                // 未完成：任一角色尚未到 completed
                mongoQuery = {
                    $or: [
                        { customerStatus: { $ne: 'completed' } },
                        { deliveryStatus: { $ne: 'completed' } },
                    ]
                }
            }
        }

        let limit = Number(query.limit) || DEFAULT_LIMIT
        limit = Math.min(limit, MAX_LIMIT)
        const skip = Number(query.skip) || 0

        const orders: any[] = await Order.find(mongoQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email')
            .populate('deliveryPerson', 'name img phone')
            .lean()

        // Normalize deliveryPerson field similarly為單一物件或 null
        for (const order of orders) {
            try {
                if (order.deliveryPerson) {
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
                order.deliveryPerson = null
            }
        }

        return { success: true, count: orders.length, data: orders }
    } catch (err: any) {
        console.error('Admin list orders failed:', err)
        throw createError({ statusCode: 500, statusMessage: 'Failed to list orders' })
    }
})
