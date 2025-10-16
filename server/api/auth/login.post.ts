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
