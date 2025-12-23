// server/api/cart/delivery-time.get.ts

import { getOsrmRoute } from "$utils/osrm";

/**
 * @openapi
 * /api/cart/delivery-time:
 *   get:
 *     summary: 計算外送預估時間
 *     description: |
 *       透過 OSRM 計算起點與終點的預估行車時間。
 *     tags:
 *       - Cart
 *     parameters:
 *       - name: originLatitude
 *         in: query
 *         description: 起點緯度
 *         required: true
 *         schema:
 *           type: number
 *       - name: originLongitude
 *         in: query
 *         description: 起點經度
 *         required: true
 *         schema:
 *           type: number
 *       - name: destinationLatitude
 *         in: query
 *         description: 終點緯度
 *         required: true
 *         schema:
 *           type: number
 *       - name: destinationLongitude
 *         in: query
 *         description: 終點經度
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: 成功回傳預估時間
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
 *                     durationSeconds:
 *                       type: integer
 *                       example: 480
 *                     durationMinutes:
 *                       type: integer
 *                       example: 8
 *                     distanceMeters:
 *                       type: number
 *                       example: 1500
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    const originLatitude = Number(query.originLatitude);
    const originLongitude = Number(query.originLongitude);
    const destinationLatitude = Number(query.destinationLatitude);
    const destinationLongitude = Number(query.destinationLongitude);

    if (
        !Number.isFinite(originLatitude) ||
        !Number.isFinite(originLongitude) ||
        !Number.isFinite(destinationLatitude) ||
        !Number.isFinite(destinationLongitude)
    ) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing or invalid origin/destination coordinates.",
        });
    }

    const route = await getOsrmRoute([originLongitude, originLatitude], [destinationLongitude, destinationLatitude]);
    const durationSeconds = Math.round(route.duration)+600;
    const durationMinutes = Math.round(durationSeconds / 60);

    return {
        success: true,
        data: {
            durationSeconds,
            durationMinutes,
            distanceMeters: route.distance,
        },
    };
});