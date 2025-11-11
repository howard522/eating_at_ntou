import { defineEventHandler, createError, getQuery } from 'h3'
import connectDB from '@server/utils/db'
import Order from '@server/models/order.model'
import Restaurant from '@server/models/restaurant.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

/**
 * @openapi
 * /api/orders/available:
 *   get:
 *     summary: 查詢可接單列表（含距離排序）
 *     description: >
 *       以外送員當前座標為中心，搜尋附近餐廳的可接訂單。  
 *       距離與排序皆由 MongoDB `$geoNear` 計算，效能最佳。  
 *       支援依關鍵字搜尋餐廳名稱、外送費、建立時間或預估到達時間排序。
 *     tags: [Order]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *         description: 餐廳名稱關鍵字（模糊搜尋）
 *         example: "港邊"
 *       - name: lat
 *         in: query
 *         schema:
 *           type: number
 *         required: true
 *         description: 外送員目前位置緯度
 *         example: 25.1327
 *       - name: lon
 *         in: query
 *         schema:
 *           type: number
 *         required: true
 *         description: 外送員目前位置經度
 *         example: 121.7401
 *       - name: maxDistance
 *         in: query
 *         schema:
 *           type: integer
 *         description: 搜尋最大距離（公尺，預設 5000）
 *         example: 3000
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, deliveryFee, arriveTime, distance]
 *         description: 排序依據（distance 需含 lat/lon）
 *         example: "distance"
 *       - name: order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向（預設 desc）
 *         example: "asc"
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: 每頁最大回傳筆數
 *         example: 20
 *       - name: skip
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 要跳過的筆數（用於分頁）
 *         example: 0
 */

export default defineEventHandler(async (event) => {
    await connectDB()
    const payload = await verifyJwtFromEvent(event)

    const query = getQuery(event)
    const {
        keyword = '',
        sortBy = 'createdAt',
        order = 'desc',
        lat,
        lon,
        maxDistance = 5000
    } = query

    if (!lat || !lon) {
        throw createError({ statusCode: 400, statusMessage: '缺少經緯度參數' })
    }

    const DEFAULT_LIMIT = 50
    const MAX_LIMIT = 100
    let limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_LIMIT)
    const skip = Number(query.skip) || 0
    const dir = order === 'asc' ? 1 : -1

    
    // 找附近的餐廳
    const nearbyRestaurants = await Restaurant.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [Number(lon), Number(lat)] },
                distanceField: 'distance',
                maxDistance: Number(maxDistance),
                spherical: true
            }
        },
        keyword
            ? {
                $match: {
                    name: { $regex: keyword, $options: 'i' }
                }
            }
            : { $match: {} },
        { $project: { _id: 1, name: 1, distance: 1 } },
        { $limit: 100 } // 最多先抓 100 家餐廳
    ])

    const restaurantIds = nearbyRestaurants.map((r) => r._id)
    if (restaurantIds.length === 0) {
        return { success: true, count: 0, data: [] }
    }

    // 查找該範圍內的訂單
    let orders = await Order.find({
        deliveryPerson: null,
        deliveryStatus: 'preparing',
        'items.restaurant.id': { $in: restaurantIds }
    })
        .populate('items.restaurant.id', 'name phone locationGeo')
        .lean()


    // 加入距離欄位

    const distanceMap = new Map(
        nearbyRestaurants.map((r) => [String(r._id), r.distance])
    )
    orders = orders.map((o) => {
        const restId = String(o.items?.[0]?.restaurant?.id?._id || '')
        const dist = distanceMap.get(restId) ?? Infinity
        return { ...o, _distance: dist }
    })

    // 排序與分頁
    orders.sort((a, b) => {
        switch (sortBy) {
            case 'deliveryFee':
                return dir * ((a.deliveryFee || 0) - (b.deliveryFee || 0))
            case 'arriveTime':
                return dir * (
                    new Date(a.arriveTime || 0).getTime() -
                    new Date(b.arriveTime || 0).getTime()
                )
            case 'distance':
                return dir * ((a._distance || Infinity) - (b._distance || Infinity))
            case 'createdAt':
            default:
                return dir * (
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
        }
    })

    const paged = orders.slice(skip, skip + limit)

    return {
        success: true,
        count: paged.length,
        data: paged
    }
})
