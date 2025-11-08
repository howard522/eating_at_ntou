//目的：從 Authorization Bearer token 解析使用者並回傳，供受保護路由使用
// ============================================================================
import { H3Event, createError } from 'h3'
import jwt from 'jsonwebtoken'
import User from '../models/user.model'
import connectDB from './db'

export const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

export type JwtPayload = { id: string; role?: string; iat?: number; exp?: number }

/**
 * 從 Event 中解析並驗證 Bearer JWT，回傳 payload。
 * 統一處理 Authorization header 的大小寫、格式檢查與 jwt.verify 的錯誤。
 */
export async function verifyJwtFromEvent(event: H3Event) {
  const headers = event.node.req.headers || {}
  // headers 可能是小寫或大寫鍵，直接取 authorization（Node 下通常為小寫）
  const rawAuth = (headers.authorization as string) || (headers.Authorization as string) || ''
  if (!rawAuth || typeof rawAuth !== 'string') {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }
  const m = rawAuth.match(/Bearer\s+(.+)/i)
  if (!m) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }
  const token = m[1]
  let payload: any
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    throw createError({ statusCode: 401, statusMessage: '錯誤 token' })
  }
  if (!payload || !payload.id) {
    throw createError({ statusCode: 401, statusMessage: '錯誤 token' })
  }
  return payload as JwtPayload
}

export async function getUserFromEvent(event: H3Event) {
  const payload = await verifyJwtFromEvent(event)
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
