// server/api/cart/delivery-fee.get.ts

import { calculateDeliveryFee } from "$services/cart.service";

/**
 * @openapi
 * /api/cart/delivery-fee:
 *   get:
 *     summary: 計算外送費用
 *     description: |
 *       依據顧客位置與提供的一個或多個餐廳座標計算平均距離，並回傳對應的外送費用。
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: customerLatitude
 *         in: query
 *         description: 顧客位置的緯度
 *         required: true
 *         schema:
 *           type: number
 *       - name: customerLongitude
 *         in: query
 *         description: 顧客位置的經度
 *         required: true
 *         schema:
 *           type: number
 *       - name: restaurants
 *         in: query
 *         description: 餐廳經緯度陣列的 JSON 字串，例如 `[{"lat":25.1,"lng":121.5}]`
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
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const customerLatitude = Number(query.customerLatitude);
    const customerLongitude = Number(query.customerLongitude);

    if (!Number.isFinite(customerLatitude) || !Number.isFinite(customerLongitude)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing or invalid customer coordinates.",
        });
    }

    const restaurantsParam = query.restaurants;

    if (!restaurantsParam || typeof restaurantsParam !== "string") {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: restaurants.",
        });
    }

    let restaurantsInput: unknown;
    try {
        restaurantsInput = JSON.parse(restaurantsParam);
    } catch (error) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Invalid restaurants parameter. Expect JSON array.",
        });
    }

    const restaurantCoordinates = Array.isArray(restaurantsInput)
        ? restaurantsInput
              .map((coord) => {
                  if (Array.isArray(coord) && coord.length >= 2) {
                      const [lat, lng] = coord;
                      const latNum = Number(lat);
                      const lngNum = Number(lng);

                      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
                          return [lngNum, latNum] as [number, number];
                      }

                      return null;
                  }

                  if (typeof coord === "object" && coord !== null) {
                      const { lat, lng, latitude, longitude } = coord as Record<string, unknown>;
                      const latNum = Number(lat ?? latitude);
                      const lngNum = Number(lng ?? longitude);

                      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
                          return [lngNum, latNum] as [number, number];
                      }
                  }
                  return null;
              })
              .filter((coord): coord is [number, number] => Array.isArray(coord))
        : [];

    if (!restaurantCoordinates.length) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: address.",
        });
    }

    const { distance, fee } = calculateDeliveryFee([customerLongitude, customerLatitude], restaurantCoordinates);

    return {
        success: true,
        data: { distance, deliveryFee: fee },
    };
});
