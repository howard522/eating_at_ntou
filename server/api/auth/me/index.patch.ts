// FILE: server/api/auth/me.patch.ts  (新增/更新)
// ============================================================================
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
import { defineEventHandler, readBody } from 'h3'
import { getUserFromEvent, toPublicUser } from '@server/utils/auth'
import connectDB from '@server/utils/db'
import User from '@server/models/user.model'
import { uploadImageToImageBB } from '@server/utils/imageUploader'

export default defineEventHandler(async (event) => {
  const me = await getUserFromEvent(event)// 取得目前使用者，11/15更新後會檔掉被封鎖的使用者
  await connectDB()
  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'Content-Type must be multipart/form-data' })
  }

  const patch: Record<string, string> = {}
  // 文字欄位：name/address/phone
  for (const key of ['name', 'address', 'phone'] as const) {
    const part = parts.find(p => p.name === key && !p.filename)
    if (part?.data) {
      //判斷name是否為空字串，若不是才加入patch
      if (key === 'name') {
        const value = Buffer.from(part.data).toString('utf8').trim()
        if (value.length) patch[key] = value
      } else {
        const value = Buffer.from(part.data).toString('utf8').trim()
        if (value.length) patch[key] = value
      }
    }
  }

  // 圖片欄位：img（檔案）
  const imgPart = parts.find(p => p.name === 'img' && p.filename && p.data)
  if (imgPart) {
    // 為什麼：上傳到 ImageBB 取得可公開訪問的 URL，再寫入使用者文件
    const url = await uploadImageToImageBB({ data: imgPart.data, name: imgPart.filename })
    if (url) patch.img = url
  }

  const updated = await User.findByIdAndUpdate(me._id, { $set: patch }, { new: true })
  return { success: true, user: toPublicUser(updated) }
})