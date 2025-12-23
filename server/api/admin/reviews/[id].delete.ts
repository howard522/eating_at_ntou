import { deleteReview } from "$services/reviews.service";

/**
 * @openapi
 * /api/admin/reviews/{id}:
 *   delete:
 *     summary: 刪除評論
 *     description: 管理員刪除不當評論
 *     tags:
 *       - Admin - Reviews
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 評論 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功刪除評論
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Missing review id.",
        });
    }

    await deleteReview(id);

    return { success: true };
});
