// FILE: server/api/auth/me.patch.ts  (新增/更新)
// ============================================================================

import type { UpdateUserBody } from "@server/interfaces/user.interface";
import { updateUser } from "@server/services/user.service";
import { getUserFromEvent, toPublicUser } from "@server/utils/auth";
import { parseForm } from "@server/utils/parseForm";

/**
 * @openapi
 * /api/auth/me:
 *   patch:
 *     summary: 更新我的個人資料
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               img:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: 已更新 }
 */
export default defineEventHandler(async (event) => {
    const me = await getUserFromEvent(event); // 取得目前使用者，11/15更新後會檔掉被封鎖的使用者
    const form = await readMultipartFormData(event);
    const data = await parseForm<UpdateUserBody>(form);

    const updated = await updateUser(me._id, data);

    return { success: true, user: toPublicUser(updated) };
});
