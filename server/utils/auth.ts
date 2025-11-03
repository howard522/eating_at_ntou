//目的：從 Authorization Bearer token 解析使用者並回傳，供受保護路由使用
// ============================================================================
import { H3Event, createError } from 'h3'
import jwt from 'jsonwebtoken'
import User from '../models/user.model'
import connectDB from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

export type JwtPayload = { id: string; role: string; iat: number; exp: number }

export async function getUserFromEvent(event: H3Event) {
  const auth = event.node.req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }
  const token = auth.slice(7)
  let payload: JwtPayload
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    throw createError({ statusCode: 401, statusMessage: '錯誤 token' })
  }
  await connectDB()
  const user = await User.findById(payload.id)
  if (!user) throw createError({ statusCode: 401, statusMessage: '找不到使用者' })
  return user
}

export function toPublicUser(u: any) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,            // admin | multi
    img: u.img || '',
    address: u.address || '',
    phone: u.phone || '',
    //activeRole: u.activeRole ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }
}
