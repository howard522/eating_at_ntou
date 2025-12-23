// server/api/address.get.ts

import { getGeocodeFromAddress } from "@server/utils/nominatim";

/**
 * @openapi
 * /api/address:
 *   get:
 *    summary: 透過地址取得經緯度
 *    tags: [Misc]
 *    parameters:
 *      - in: query
 *        name: address
 *        schema:
 *          type: string
 *        required: true
 *        description: 地址字串
 *        example: "資工系館"
 *    responses:
 *      200:
 *        description: 成功取得經緯度資料
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                lat:
 *                  type: number
 *                  description: 緯度
 *                lon:
 *                  type: number
 *                  description: 經度
 *      400:
 *        $ref: '#/components/responses/BadRequest'
 *      404:
 *        $ref: '#/components/responses/NotFound'
 */
export default defineEventHandler(async (event) => {
    const address = getQuery(event).address as string;
    if (!address) {
        throw createError({ statusCode: 400, statusMessage: "Address query parameter is required." });
    }
    const geoPoint = await getGeocodeFromAddress(address);
    if (!geoPoint) {
        throw createError({ statusCode: 404, statusMessage: "Geocode not found for the provided address." });
    }
    return {
        success: true,
        data: geoPoint,
    };
});
