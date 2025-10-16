import { defineEventHandler, readBody, createError } from 'h3'
import connectDB from '../../utils/db'
import User from '../../models/user.model'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 使用者註冊
 *     description: 建立新使用者帳號（email 唯一），回傳 token 與使用者資訊。不會回傳密碼。
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: 註冊成功，回傳 token 與 user 資訊
 *       400:
 *         description: 請求不正確或 email 已存在
 */
export default defineEventHandler(async (event) => {
    await connectDB()
    const body = await readBody(event)
    const name = (body.name || '') as string
    const email = (body.email || '') as string
    const password = (body.password || '') as string

    if (!email || !password) {
        throw createError({ statusCode: 400, statusMessage: 'email and password are required' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
        throw createError({ statusCode: 400, statusMessage: 'email already in use' })
    }

    const u = new User({ name, email, password })
    await u.save()

    const token = jwt.sign({ id: u._id, role: u.role }, JWT_SECRET, { expiresIn: '7d' })

    return {
        success: true,
        token,
        user: {
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role
        }
    }
})
// server/api/auth/register.post.ts
