import { defineEventHandler, createError, getQuery } from 'h3'
import connectDB from '@server/utils/db'
import Order from '@server/models/order.model'
import Restaurant from '@server/models/restaurant.model'
import { verifyJwtFromEvent } from '@server/utils/auth'

/**
 * @openapi
 * /api/orders/available:
 *   get:
 *     summary: 查詢可接單列表
 *     description: >
 *       取得所有尚未被外送員接單、狀態為「準備中」的訂單清單。  
 *       支援依餐廳名稱搜尋、排序（建立時間、外送費、預估送達時間、距離）與地理距離篩選。
 *     tags:
 *       - Order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: keyword
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: 餐廳名稱關鍵字（模糊搜尋）
 *         example: "港邊"
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [createdAt, deliveryFee, arriveTime, distance]
 *         description: 排序依據（預設為 createdAt）
 *         example: "distance"
 *       - name: order
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向（asc=由小到大，desc=由大到小，預設 desc）
 *         example: "asc"
 *       - name: lat
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *         description: 外送員當前位置緯度（若指定則回傳結果會附加距離）
 *         example: 25.1327
 *       - name: lon
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *         description: 外送員當前位置經度（若指定則支援依距離排序）
 *         example: 121.7401
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: 每頁最大回傳筆數
 *         example: 20
 *       - name: skip
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 要跳過的筆數（用於分頁）
 *         example: 0
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
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: 回傳的訂單筆數（受 limit/skip 影響）
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "671c0c2f5c3b5a001276a7ff"
 *                       total:
 *                         type: number
 *                         example: 450
 *                       deliveryFee:
 *                         type: number
 *                         example: 30
 *                       arriveTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-08-01T12:30:00.000Z"
 *                       currency:
 *                         type: string
 *                         example: "TWD"
 *                       _distance:
 *                         type: number
 *                         description: 若提供經緯度則回傳距離（單位：公尺）
 *                         example: 215.3
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "三杯雞"
 *                             price:
 *                               type: number
 *                               example: 220
 *                             quantity:
 *                               type: number
 *                               example: 1
 *                             restaurant:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "海大港邊食堂"
 *                                 phone:
 *                                   type: string
 *                                   example: "02-2462-2192"
 *                       deliveryInfo:
 *                         type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                             example: "基隆市中正區北寧路2號"
 *                           contactName:
 *                             type: string
 *                             example: "宋辰星"
 *                           contactPhone:
 *                             type: string
 *                             example: "0912345678"
 *                           note:
 *                             type: string
 *                             example: "放在門口即可"
 *                       customerStatus:
 *                         type: string
 *                         example: "preparing"
 *                       deliveryStatus:
 *                         type: string
 *                         example: "preparing"
 *       401:
 *         description: 驗證失敗或未登入
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 statusMessage:
 *                   type: string
 *                   example: "未登入或 Token 錯誤"
 */


export default defineEventHandler(async (event) => {
    await connectDB()

    // Auth
    const payload = await verifyJwtFromEvent(event)

    const query = getQuery(event)
    const { keyword = '', sortBy = 'createdAt', order = 'desc', lat, lon } = query
    // 分頁參數
    const DEFAULT_LIMIT = 50
    const MAX_LIMIT = 100
    let limit = Number(query.limit) || DEFAULT_LIMIT
    limit = Math.min(limit, MAX_LIMIT)
    const skip = Number(query.skip) || 0

    // // 查詢尚未接單的訂單（支援 skip / limit）
    // const orders = await Order.find({
    //     deliveryPerson: null,
    //     deliveryStatus: 'preparing'
    // })
    //     .sort({ createdAt: -1 })
    //     .skip(skip)
    //     .limit(limit)
    //     .lean()

    // 可接的訂單：
    const baseFilter: any = {
        deliveryPerson: null,
        deliveryStatus: 'preparing'
    }

    // 若有關鍵字，先找出符合餐廳，再用餐廳 ID 過濾訂單
    let restaurantIds: string[] = []
    if (keyword) {
        const matched = await Restaurant.find({
            name: { $regex: keyword, $options: 'i' }
        }).select('_id')

        restaurantIds = matched.map(r => r._id)
        if (restaurantIds.length === 0) {
            return { success: true, count: 0, data: [] }
        }
        baseFilter['items.restaurant.id'] = { $in: restaurantIds }
    }

    // 查詢訂單
    let orders = await Order.find(baseFilter)
        .populate('items.restaurant.id', 'name locationGeo phone address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

    // 若有經緯度，計算距離並排序
    if (lat && lon) {
        const userPos = [Number(lon), Number(lat)]
        orders = orders.map((o) => {
            const rest = o.items?.[0]?.restaurant?.id
            const coord = rest?.locationGeo?.coordinates
            const dist = coord
                ? haversineDistance(userPos, coord)
                : Number.POSITIVE_INFINITY
            return { ...o, _distance: dist }
        })
    }

    // 排序
    const dir = order === 'asc' ? 1 : -1
    orders.sort((a, b) => {
        switch (sortBy) {
            case 'deliveryFee':
                return dir * ((a.deliveryFee || 0) - (b.deliveryFee || 0))
            case 'arriveTime':
                return dir * (new Date(a.arriveTime).getTime() - new Date(b.arriveTime).getTime())
            case 'distance':
                return dir * (((a._distance ?? Infinity) - (b._distance ?? Infinity)) || 0)
            case 'createdAt':
            default:
                return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        }
    })
    return {
        success: true,
        count: orders.length,
        data: orders
    }
})

// Haversine formula 計算兩點距離（公尺)，因為mongodb的geoNear在這種間接查詢無法使用
// 所以我問chat，然後抄下來的
function haversineDistance(coord1: number[], coord2: number[]) {
    const [lon1, lat1] = coord1
    const [lon2, lat2] = coord2
    const R = 6371e3 // 地球半徑 (m)
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}


// 現在功能是完整的了，但我覺得現在的距離處理有效能疑慮，
// 因為是先抓訂單再算距離，若訂單量大時會很慢，
// 不過有分頁應該還好，一頁就最多 100 筆訂單。