import { verifyJwtFromEvent } from "@server/utils/auth";
import { clearCartByUserId } from "@server/services/cart.service";
import { getUser } from "@server/utils/getUser";

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     summary: 清空購物車
 *     description: 驗證 JWT 後，刪除目前使用者「開啟中」購物車的所有商品。
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功清空購物車，並回傳更新後的空購物車。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *             examples:
 *               clearedCart:
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "68fa96d1f2460b7033ab3b6b"
 *                     user: "68f0936fca599f1f04be1cba"
 *                     items: []
 *                     total: 0
 *                     status: "open"
 *                     createdAt: "2025-10-23T20:57:53.449Z"
 *                     updatedAt: "2025-11-02T10:00:00.000Z"
 *       401:
 *         description: 未提供或無效的 JWT。
 *       404:
 *         description: 找不到使用者的購物車。
 */
export default defineEventHandler(async (event) => {
    const userId = getUser(event)._id as string;

    const cart = await clearCartByUserId(userId);

    return { success: true, data: cart };
});
