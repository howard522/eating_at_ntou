// FILE: server/api/auth/login.post.ts
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: 使用者登入
 *     description: 驗證 email 與密碼，成功回傳 JWT 與使用者資料。
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             sampleRequest:
 *               summary: 範例請求（Try it out 預填）
 *               value:
 *                 email: "test@example.com"
 *                 password: "secret123"
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: 成功範例
 *                 value:
 *                   success: true
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   user:
 *                     id: 68eba49d636458deb1664302
 *                     name: 郭浩
 *                     email: howhow@example.com
 *                     role: multi
 *                     img: https://example.com/avatar.png
 *                     address: 海洋大學資工系館
 *                     phone: "0912345678"
 *       401:
 *         description: 帳號不存在或密碼錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 401 }
 *                 statusMessage: { type: string, example: 帳號不存在或密碼錯誤 }
 */


import { defineEventHandler, readBody, createError } from 'h3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '@server/models/user.model'
import connectDB from '@server/utils/db'
import { JWT_SECRET } from '@server/utils/auth'

export default defineEventHandler(async (event) => {
  await connectDB()
  const { email, password } = await readBody(event)
  const user = await User.findOne({ email })
  if (!user) throw createError({ statusCode: 401, statusMessage: '帳號不存在' })
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw createError({ statusCode: 401, statusMessage: '密碼錯誤' })
  if (user.role === 'banned') throw createError({ statusCode: 403, statusMessage: '帳號已被封鎖' })
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  return {
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      img: user.img || '',
      address: user.address || '',
      phone: user.phone || '',
    }
  }
})