import { useUserStore } from '../stores/user'
import { addRouteMiddleware, navigateTo } from '#app'

export default defineNuxtPlugin((nuxtApp: any) => {
    const userStore = useUserStore()
    try {
        if (typeof userStore.loadFromStorage === 'function') {
            userStore.loadFromStorage()
        }
    } catch { /* ignore */ }

    // localStorage 持久化與還原
    const publicPaths = new Set(['/login', '/forgot-password', '/register'])
    const roleHome: Record<string, string> = {
        admin: '/admin/stores',
        customer: '/customer/stores',
        delivery: '/delivery/customer-orders',
    }
    const rolePrefix: Record<string, string> = {
        admin: '/admin',
        customer: '/customer',
        delivery: '/delivery',
    }

    // 讀取 userStore 狀態
    const readAuth = (): { token: string | null, role: string | null } => {
        try {
            const raw = localStorage.getItem('userStore')
            if (!raw) return { token: null, role: null }
            const data = JSON.parse(raw)
            if (data?.token && data?.info?.role === 'admin') {
                return { token: data.token, role: 'admin' }
            }
            if (data?.token && (data?.currentRole === 'customer' || data?.currentRole === 'delivery')) {
                return { token: data.token, role: data.currentRole }
            }
        } catch { /* ignore */ }
        return { token: null, role: null }
    }
    const writeAuth = () => {
        try {
            userStore.saveToStorage()
        } catch { /* ignore */ }
    }

    // 嘗試從 localStorage 還原
    try {
        const hasToken = (() => {
            try { return Boolean((userStore as any).token) } catch { return false }
        })()
        if (!hasToken) {
            const saved = readAuth()
            if (saved.token) {
                if ('token' in userStore) userStore.token = saved.token
                if (saved.role === 'admin' && userStore.info) userStore.info.role = 'admin'
                if (saved.role === 'customer' || saved.role === 'delivery') userStore.currentRole = saved.role
            }
        }
    } catch { /* ignore */ }

    // 訂閱 store 變更 → 寫入 localStorage. Pinia 提供 $subscribe 方法，每當 store 改變時會觸發。用來同步 localStorage，確保刷新頁面後仍能保持登入狀態。
    try {
        userStore.$subscribe(() => {
            writeAuth()
        })
    } catch { /* ignore */ }

    // 全域路由守衛
    addRouteMiddleware('auth', (to) => {
        try {
            // 取得目前角色
            let token = userStore.token
            let role: string | null = null
            if (userStore.info?.role === 'admin') role = 'admin'
            else if (userStore.currentRole === 'customer' || userStore.currentRole === 'delivery') role = userStore.currentRole

            // fallback: localStorage
            if (!token || !role) {
                const saved = readAuth()
                token = token || saved.token
                role = role || saved.role
            }

            const isPublic = publicPaths.has(to.path)

            // 未登入：只能進入公開頁
            if (!token || !role || !roleHome[role] || !rolePrefix[role]) {
                if (!isPublic && to.path !== '/profile') return navigateTo('/login')
                if (to.path === '/profile') return navigateTo('/login')
                return
            }

            const home = roleHome[role]
            const allowedPrefix = rolePrefix[role]

            // 已登入：
            // 進入根路由或公開頁，一律導向各自首頁
            if (to.path === '/' || isPublic) {
                if (to.path !== home) return navigateTo(home)
                return
            }
            // 允許 customer/delivery 進入 /profile
            if (to.path === '/profile') {
                if (role === 'customer' || role === 'delivery') return
                return navigateTo(home)
            }
            // 跑到身份範圍外 → 導回各自首頁
            if (!to.path.startsWith(allowedPrefix)) {
                return navigateTo(home)
            }
        } catch { /* ignore */ }
    }, { global: true })
})
