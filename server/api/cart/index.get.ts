import { getCartByUserId } from "@server/services/cart.service";
import { verifyJwtFromEvent } from "@server/utils/auth";

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: 取得目前使用者的購物車詳細內容
 *     description: 驗證 JWT 後，回傳使用者購物車的完整資訊，包含餐廳名稱與菜單項目詳細資料。
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功回傳購物車內容
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
 *                     _id:
 *                       type: string
 *                       example: "68fa96d1f2460b7033ab3b6b"
 *                     user:
 *                       type: string
 *                       example: "68f0936fca599f1f04be1cba"
 *                     currency:
 *                       type: string
 *                       example: "TWD"
 *                     total:
 *                       type: number
 *                       example: 420
 *                     status:
 *                       type: string
 *                       enum: [open, ordered, cancelled]
 *                       example: "open"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-23T20:57:53.449Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-27T11:14:23.947Z"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           menuItemId:
 *                             type: string
 *                             example: "68f2426335e9054c99b316a1"
 *                           name:
 *                             type: string
 *                             example: "三杯雞"
 *                           price:
 *                             type: number
 *                             example: 220
 *                           image:
 *                             type: string
 *                             example: "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP"
 *                           info:
 *                             type: string
 *                             example: "三杯大雞雞"
 *                           quantity:
 *                             type: number
 *                             example: 1
 *                           restaurantId:
 *                             type: string
 *                             example: "68f2426335e9054c99b316a0"
 *                           restaurantName:
 *                             type: string
 *                             example: "傑哥加長加長菜"
 *             example:
 *               success: true
 *               data:
 *                 _id: "68fa96d1f2460b7033ab3b6b"
 *                 user: "68f0936fca599f1f04be1cba"
 *                 currency: "TWD"
 *                 total: 420
 *                 status: "open"
 *                 createdAt: "2025-10-23T20:57:53.449Z"
 *                 updatedAt: "2025-10-27T11:14:23.947Z"
 *                 items:
 *                   - menuItemId: "68f2426335e9054c99b316a1"
 *                     name: "三杯雞"
 *                     price: 220
 *                     image: "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP"
 *                     info: "三杯大雞雞"
 *                     quantity: 1
 *                     restaurantId: "68f2426335e9054c99b316a0"
 *                     restaurantName: "傑哥加長加長菜"
 *                   - menuItemId: "68f2426335e9054c99b316a2"
 *                     name: "讓我看看"
 *                     price: 100
 *                     image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
 *                     info: "讓傑哥看看"
 *                     quantity: 2
 *                     restaurantId: "68f2426335e9054c99b316a0"
 *                     restaurantName: "傑哥加長加長菜"
 */

export default defineEventHandler(async (event) => {
    // Auth
    const payload = await verifyJwtFromEvent(event);
    const userId = payload.id;
    if (!userId) throw createError({ statusCode: 401, statusMessage: "invalid token payload" });

    const cart = await getCartByUserId(userId);

    // const cart = await Cart.findOne({ user: userId }).populate("items.restaurantId", "name menu");
    if (!cart) {
        return { success: true, data: { items: [], total: 0, currency: "TWD" } };
    }

    return {
        success: true,
        data: cart,
    };

    // const detailedItems = cart.items.map((it: any) => {
    //     const restaurant = it.restaurantId;
    //     const menuItem = restaurant?.menu?.find((m: any) => String(m._id) === String(it.menuItemId));

    //     return {
    //         menuItemId: it.menuItemId?.toString(),
    //         name: menuItem?.name || it.name,
    //         price: menuItem?.price || it.price,
    //         image: menuItem?.image || null,
    //         info: menuItem?.info || null,
    //         quantity: it.quantity,
    //         restaurantId: restaurant?._id?.toString(),
    //         restaurantName: restaurant?.name || "(未知餐廳)",
    //     };
    // });

    // return {
    //     success: true,
    //     data: {
    //         _id: cart._id,
    //         user: cart.user,
    //         currency: cart.currency,
    //         total: cart.total,
    //         status: cart.status,
    //         createdAt: cart.createdAt,
    //         updatedAt: cart.updatedAt,
    //         items: detailedItems,
    //     },
    // };
});
