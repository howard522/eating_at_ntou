// FILE: server/api/auth/me/password.patch.ts  (新增/更新)
// ============================================================================
/**
 * @openapi
 * /api/auth/me/password:
 *   patch:
 *     summary: 變更我的密碼
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: 已更新 }
 *       400: { description: 參數錯誤 }
 *       401: { description: 密碼不正確 / 未授權 }
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { getUserFromEvent } from '../../../utils/auth'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const me: any = await getUserFromEvent(event)
  const { currentPassword, newPassword } = await readBody(event) || {}
  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'currentPassword and newPassword are required' })
  }
  if (String(newPassword).length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'newPassword must be at least 6 characters' })
  }
  const ok = await bcrypt.compare(String(currentPassword), me.password)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'current password incorrect' })
  me.password = String(newPassword) // pre('save') 自動 hash
  await me.save()
  return { success: true }
})