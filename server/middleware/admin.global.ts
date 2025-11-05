// middleware/adminOnly.ts

import { defineEventHandler, createError } from 'h3'
import { getUserFromEvent } from '../utils/auth'

export default defineEventHandler(async (event) => {
    if (!event.node.req.url?.startsWith('/api/admin')) {
        return
    }
    const user = await getUserFromEvent(event)
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: '未登入' })
    }
    if (user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden, 你想幹嘛' })
    }
})