//FILE: server/api/users/me.patch.ts  (新增/更新)
// ============================================================================
/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: 更新我的個人資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               img: { type: string }
 *     responses:
 *       200: { description: 已更新 }
 */
import { defineEventHandler, readBody } from 'h3'
import { getUserFromEvent, toPublicUser } from '../../utils/auth'
import connectDB from '../../utils/db'
import User from '../../models/user.model'

export default defineEventHandler(async (event) => {
  const me = await getUserFromEvent(event)
  await connectDB()
  const body = await readBody(event) || {}
  const patch: any = {}
  for (const k of ['name', 'address', 'phone', 'img']) {
    if (typeof body[k] === 'string') patch[k] = body[k]
  }
  const updated = await User.findByIdAndUpdate(me._id, { $set: patch }, { new: true })
  return { success: true, user: toPublicUser(updated) }
})