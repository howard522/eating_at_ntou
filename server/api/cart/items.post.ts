// server/api/cart/items.post.ts

import type { ICartUpdate } from "@server/interfaces/cart.interface";
import { updateCartByUserId } from "@server/services/cart.service";
import { getCurrentUser } from "@server/utils/getCurrentUser";

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     summary: 新增或替換使用者購物車項目
 *     description: 接受 body.items 陣列（每項符合 CartItem schema），會建立或更新使用者的購物車。
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *           example:
 *             items:
 *               - restaurantId: "68f2426335e9054c99b316a0"
 *                 menuItemId: "68f2426335e9054c99b316a1"
 *                 name: "三杯雞"
 *                 price: 220
 *                 quantity: 1
 *                 options:
 *                   辣度: "小辣"
 *               - restaurantId: "68f2426335e9054c99b316a0"
 *                 menuItemId: "68f2426335e9054c99b316a2"
 *                 name: "讓我看看"
 *                 price: 100
 *                 quantity: 2
 *                 options:
 *                   辣度: "小辣"
 *     responses:
 *       200:
 *         description: 更新成功並回傳最新購物車
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *             example:
 *               success: true
 *               data:
 *                 _id: "64f1a3b2c4d5e6f7890abcc3"
 *                 user: "64f1a3b2c4d5e6f7890abcc4"
 *                 items:
 *                   - restaurantId: "68f2426335e9054c99b316a0"
 *                     menuItemId: "68f2426335e9054c99b316a1"
 *                     name: "三杯雞"
 *                     price: 220
 *                     quantity: 1
 *                     options:
 *                       辣度: "小辣"
 *                   - restaurantId: "68f2426335e9054c99b316a0"
 *                     menuItemId: "68f2426335e9054c99b316a2"
 *                     name: "讓我看看"
 *                     price: 100
 *                     quantity: 2
 *                     options:
 *                       辣度: "小辣"
 *                 currency: "TWD"
 *                 total: 420
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       423:
 *         $ref: '#/components/responses/Locked'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const userId = getCurrentUser(event).id;

    const body = await readBody<ICartUpdate>(event);

    // Expect body.items: array of { name, price, quantity, restaurantId?, menuItemId?, options? }
    const items = Array.isArray(body.items) ? body.items : [];

    const cart = await updateCartByUserId(userId, items);

    return {
        success: true,
        data: cart,
    };
});
