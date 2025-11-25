import { defineEventHandler, getQuery, createError } from 'h3'
import connectDB from '@server/utils/db'
import Order from '@server/models/order.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     summary: 管理員查詢所有訂單
 *     description: >
 *       管理員專用：列出訂單清單，支援分頁、完成/未完成篩選、訂單編號查詢、日期區間查詢與排序。
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: 只顯示已完成(true)或未完成(false)，不填則顯示全部
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: 依訂單編號精準查詢
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         example: "2025-11-10"
 *         description: 查詢起始日期 (含當日)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         example: "2025-11-15"
 *         description: 查詢結束日期 (含當日)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, total, deliveryFee]
 *         description: 排序欄位，預設 createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向 (asc(日期：由舊到新) 或 desc(日期：由新到舊))，預設 desc (日期：由新到舊)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 最大回傳筆數（預設 50，上限 200）
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
    await verifyJwtFromEvent(event) // 確保為管理員

    try {
        const query = getQuery(event) as Record<string, any>
        const mongoQuery: any = {}
        const DEFAULT_LIMIT = 50
        const MAX_LIMIT = 200

        // 訂單編號查詢
        if (query.orderId) {
            mongoQuery._id = query.orderId
        }

        // 完成 / 未完成
        if (query.completed !== undefined) {
            const completed = String(query.completed).toLowerCase() === 'true' || String(query.completed) === '1'
            if (completed) {
                mongoQuery.$and = [
                    { customerStatus: 'completed' },
                    { deliveryStatus: 'completed' }
                ]
            } else {
                mongoQuery.$or = [
                    { customerStatus: { $ne: 'completed' } },
                    { deliveryStatus: { $ne: 'completed' } }
                ]
            }
        }

        // 日期區間查詢 
        if (query.from || query.to) {
            mongoQuery.createdAt = {}

            if (query.from) {
                const from = new Date(query.from)
                if (!isNaN(from.getTime())) {
                    mongoQuery.createdAt.$gte = from
                }
            }

            if (query.to) {
                const to = new Date(query.to)
                if (!isNaN(to.getTime())) {
                    to.setHours(23, 59, 59, 999) // 包含當日整天
                    mongoQuery.createdAt.$lte = to
                }
            }
        }

        // 取分頁與排序 
        let limit = Number(query.limit) || DEFAULT_LIMIT
        limit = Math.min(limit, MAX_LIMIT)
        const skip = Number(query.skip) || 0

        const sortBy = query.sortBy || 'createdAt'
        const order = query.order === 'asc' ? 1 : -1

        // 查詢 + populate 
        let orders: any[] = await Order.find(mongoQuery)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email')
            .populate('deliveryPerson', 'name img phone')
            .lean()

        // 整理 deliveryPerson 格式 
        for (const o of orders) {
            if (o.deliveryPerson) {
                const dp = o.deliveryPerson
                o.deliveryPerson = {
                    _id: dp._id,
                    name: dp.name ?? '',
                    img: dp.img ?? '',
                    phone: dp.phone ?? '',
                }
            } else {
                o.deliveryPerson = null
            }
        }

        return { success: true, count: orders.length, data: orders }
    } catch (err) {
        console.error('Admin list orders failed:', err)
        throw createError({ statusCode: 500, statusMessage: 'Failed to list orders' })
    }
})
