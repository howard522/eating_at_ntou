import { getOrdersForAdmin } from "@server/services/order.service";
import { verifyJwtFromEvent } from "@server/utils/auth";

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     summary: 管理員查詢所有訂單
 *     description: |
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
    await verifyJwtFromEvent(event); // 確保為管理員
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 200;

    const query = getQuery(event);

    // 訂單編號查詢
    const orderId = query.orderId as string | undefined;

    // 完成 / 未完成
    let completed = query.completed as boolean | undefined;
    if (completed !== undefined) {
        completed = String(query.completed).toLowerCase() === "true" || String(query.completed) === "1";
    }

    // 日期區間查詢
    let from: Date | undefined = undefined,
        to: Date | undefined = undefined;

    if (query.from) {
        from = new Date(query.from as string);
        if (isNaN(from.getTime())) {
            from = undefined;
        }
    }

    if (query.to) {
        to = new Date(query.to as string);
        if (!isNaN(to.getTime())) {
            to.setHours(23, 59, 59, 999); // 包含當日整天
        } else {
            to = undefined;
        }
    }

    // 取分頁與排序
    let limit = Number(query.limit) || DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT);
    const skip = Number(query.skip) || 0;

    const sortBy = (query.sortBy as "total" | "deliveryFee" | "createdAt" | undefined) || "createdAt";
    const order = (query.order as "asc" | "desc" | undefined) || "desc";

    const orders = await getOrdersForAdmin(orderId, {
        completed,
        from,
        to,
        limit,
        skip,
        sortBy,
        order,
    });

    return { success: true, count: orders.length, data: orders };
});
