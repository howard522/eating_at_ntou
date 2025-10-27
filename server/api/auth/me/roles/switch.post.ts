// FILE: server/api/auth/me/roles/switch.post.ts  (新增)
// 規則：任何人都能在 'customer' / 'delivery' 之間切換 activeRole
// ============================================================================
/**
 * @openapi
 * /api/auth/me/roles/switch:
 *   post:
 *     summary: 切換目前身份（customer/delivery）
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [customer, delivery]
 *     responses:
 *       200: { description: 已切換，回傳最新使用者資料 }
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { getUserFromEvent, toPublicUser } from '../../../../utils/auth'
import User from '../../../../models/user.model'

export default defineEventHandler(async (event) => {
  const me: any = await getUserFromEvent(event)
  const { role } = await readBody(event) || {}
  if (!['customer', 'delivery'].includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'role must be customer or delivery' })
  }
  me.activeRole = role
  await me.save()
  const reloaded = await User.findById(me._id)
  return { success: true, user: toPublicUser(reloaded) }
})