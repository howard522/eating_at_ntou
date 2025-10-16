/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: 使用者登入
 *     description: 驗證使用者帳號與密碼，登入成功後回傳 JWT token 與使用者資料。
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *                 description: 使用者註冊的電子郵件
 *               password:
 *                 type: string
 *                 example: secret123
 *                 description: 使用者密碼
 *     responses:
 *       200:
 *         description: 登入成功，回傳 JWT 與使用者資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 68eba49d636458deb1664302
 *                     name:
 *                       type: string
 *                       example: 宋辰星
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     role:
 *                       type: string
 *                       example: customer
 *       401:
 *         description: 帳號不存在或密碼錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 statusMessage:
 *                   type: string
 *                   example: 帳號不存在或密碼錯誤
 */

import { defineEventHandler, readBody, createError } from 'h3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../../models/user.model'
import connectDB from '../../utils/db'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'
export default defineEventHandler(async (event) => {
    await connectDB()
    const { email, password } = await readBody(event)

    const user = await User.findOne({ email })
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: '帳號不存在' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw createError({ statusCode: 401, statusMessage: '密碼錯誤' })
    }

    // 產生 JWT
    const token = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    )

    return {
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    }
})
