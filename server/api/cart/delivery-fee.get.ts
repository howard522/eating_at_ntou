// server/api/cart/delivery-fee.get.ts

import { calculateDeliveryFee } from "$services/cart.service";
import { getGeocodeFromAddress, validateGeocode } from "$utils/nominatim";
import { getRestaurantById } from "$services/restaurants.service";
/**
 * @openapi
 * /api/cart/delivery-fee:
 *   get:
 *     summary: 計算外送費用
 *     description: |
 *       依據顧客位置與提供的一個或多個餐廳ID / 計算平均距離，並回傳對應的外送費用。
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: customerAddress
 *         in: query
 *         description: 顧客位置的地址
 *         required: true
 *         schema:
 *           type: string
 *       - name: restaurants
 *         in: query
 *         description: 餐廳 ID 或地址的陣列 JSON 字串，例如 `["670a15fa5c3b5a001279cc33"]
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
    const customerAddress = typeof query.customerAddress === "string" ? query.customerAddress : "";

    if (!customerAddress) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing or invalid customer address.",
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

    const isObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);
    const restaurantInputs = Array.isArray(restaurantsInput)
        ? restaurantsInput
              .map((item) => {
                  if (typeof item === "string") {
                      return isObjectId(item) ? { id: item } : { address: item };
                  }
                  if (typeof item === "object" && item !== null) {
                      const record = item as Record<string, unknown>;
                      const id = record.id ?? record._id ?? record.restaurantId;
                      const address = typeof record.address === "string" ? record.address : undefined;
                      const locationGeo = record.locationGeo;
                      return {
                          id: typeof id === "string" ? id : undefined,
                          address,
                          locationGeo,
                      };
                  }
                  return null;
                })
              .filter((item): item is { id?: string; address?: string; locationGeo?: unknown } => Boolean(item))
        : [];

    if (!restaurantInputs.length) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing required parameter: restaurants.",
        });
    }
    const customerGeocode = await getGeocodeFromAddress(customerAddress);
    if (!validateGeocode(customerGeocode)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Failed to geocode customer address.",
        });
    }

    const restaurantCoordinates: [number, number][] = [];
      for (const input of restaurantInputs) {
        let geocode = input.locationGeo;
        if (!validateGeocode(geocode) && input.id) {
            const restaurant = await getRestaurantById(input.id);
            if (validateGeocode(restaurant.locationGeo)) {
                geocode = restaurant.locationGeo;
            } else if (restaurant.address) {
                const resolved = await getGeocodeFromAddress(restaurant.address);
                if (validateGeocode(resolved)) {
                    geocode = resolved;
                }
            }
        }
        if (!validateGeocode(geocode) && input.address) {
            const resolved = await getGeocodeFromAddress(input.address);
            if (validateGeocode(resolved)) {
                geocode = resolved;
            }
        }
        if (!validateGeocode(geocode)) {
            const errorLabel = input.id ?? input.address ?? "unknown";
            throw createError({
                statusCode: 400,
                statusMessage: "Bad Request",
                message: `Failed to resolve restaurant coordinates: ${errorLabel}`,
            });
        }
        restaurantCoordinates.push([geocode.coordinates[0], geocode.coordinates[1]]);
    }

    const { distance, fee } = calculateDeliveryFee(
        [customerGeocode.coordinates[0], customerGeocode.coordinates[1]],
        restaurantCoordinates,
    );

    return {
        success: true,
        data: { distance, deliveryFee: fee },
    };
});
