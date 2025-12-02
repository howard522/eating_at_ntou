// server/api/cart/delivery-fee.get.ts

import { verifyJwtFromEvent } from "@server/utils/auth";
import { calculateDeliveryFee } from "@server/services/cart.service";

/**
 * @openapi
 * /api/cart/delivery-fee:
 *   get:
 *     summary: 取得目前使用者的外送費用
 *     description: 驗證 JWT 後，根據使用者的購物車內容與外送地址，計算並回傳外送費用。
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: address
 *         in: query
 *         description: 使用者的外送地址，用於計算外送費用
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功回傳外送費用
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     distance:
 *                       type: number
 *                       example: 1.5
 *                     deliveryFee:
 *                       type: number
 *                       example: 30
 */
export default defineEventHandler(async (event) => {
    // Auth
    const payload = await verifyJwtFromEvent(event);
    const userId = payload.id;

    const address = getQuery(event).address as string;

    if (!address) {
        throw createError({ statusCode: 400, statusMessage: "缺少必要的地址參數" });
    }

    const deliveryFee = await calculateDeliveryFee(userId, address);

    return {
        success: true,
        data: {
            deliveryFee,
        },
    };
});
