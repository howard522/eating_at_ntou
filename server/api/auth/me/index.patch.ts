// server/api/auth/me.patch.ts

import type { UpdateUserBody } from "@server/interfaces/user.interface";
import { updateUser } from "@server/services/user.service";
import { getUser } from "@server/utils/getUser";
import { parseForm } from "@server/utils/parseForm";

/**
 * @openapi
 * /api/auth/me:
 *   patch:
 *     summary: 更新我的個人資料
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               img:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 已更新
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export default defineEventHandler(async (event) => {
    const userId = getUser(event).id;

    const form = await readMultipartFormData(event);
    const data = await parseForm<UpdateUserBody>(form);

    const updated = await updateUser(userId, data);

    return { success: true, user: updated };
});
