import { useUserStore } from '@stores/user'
import { addRouteMiddleware, navigateTo } from '#app'

export default defineNuxtPlugin((nuxtApp: any) => {
    const userStore = useUserStore()

    // localStorage key
    const STORAGE_KEY = 'userStore'

    // 公開路徑
    const publicPaths = new Set([
        '/login', '/forgot-password', '/register', '/favicon.ico', '/robots.txt', '/introduction'
    ])
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

    // localStorage 操作
    function readAuth() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return { token: null, role: null }
            const data = JSON.parse(raw)
            if (data?.token && data?.info?.role === 'admin') {
                return { token: data.token, role: 'admin' }
            }
            if (data?.token && (data?.currentRole === 'customer' || data?.currentRole === 'delivery')) {
                return { token: data.token, role: data.currentRole }
            }
        } catch { }
        return { token: null, role: null }
    }
    function writeAuth() {
        try { userStore.saveToStorage() } catch { }
    }

    // 還原 userStore 狀態
    function restoreUserStore() {
        try {
            if (typeof userStore.loadFromStorage === 'function') userStore.loadFromStorage()
            const hasToken = Boolean((userStore as any).token)
            if (!hasToken) {
                const saved = readAuth()
                if (saved.token) {
                    if ('token' in userStore) userStore.token = saved.token
                    if (saved.role === 'admin' && userStore.info) userStore.info.role = 'admin'
                    if (saved.role === 'customer' || saved.role === 'delivery') userStore.currentRole = saved.role
                }
            }
        } catch { }
    }

    // 取得目前角色
    function getCurrentRole() {
        if (userStore.info?.role === 'admin') return 'admin'
        if (userStore.currentRole === 'customer' || userStore.currentRole === 'delivery') return userStore.currentRole
        return null
    }

    // 判斷是否登入
    function getAuthState() {
        let token = userStore.token
        let role = getCurrentRole()
        if (!token || !role) {
            const saved = readAuth()
            token = token || saved.token
            role = role || saved.role
        }
        return { token, role }
    }

    // 初始化
    restoreUserStore()
    try { userStore.$subscribe(writeAuth) } catch { }

    // 路由守衛
    addRouteMiddleware('auth', (to) => {
        try {
            // 忽略後端與靜態資源
            if (to.path.startsWith('/api') || to.path.startsWith('/ws') || to.path.startsWith('/static')) return

            const { token, role } = getAuthState()
            const isPublic = publicPaths.has(to.path)
            const isIntroduction = to.path === '/introduction'
            const home = roleHome[role as keyof typeof roleHome]
            const allowedPrefix = rolePrefix[role as keyof typeof rolePrefix]

            // 未登入：只能進入公開頁
            if (!token || !role || !home || !allowedPrefix) {
                if (!isPublic && to.path !== '/profile') return navigateTo('/login')
                if (to.path === '/profile') return navigateTo('/login')
                return
            }

            // 已登入：根路由或公開頁導向首頁
            if (to.path === '/' || (isPublic && !isIntroduction)) {
                if (to.path !== home) return navigateTo(home)
                return
            }
            // customer/delivery 可進入 /profile
            if (to.path === '/profile') {
                if (role === 'customer' || role === 'delivery') return
                return navigateTo(home)
            }
            // 跑到身份範圍外 → 導回各自首頁
            if (!isIntroduction && !to.path.startsWith(allowedPrefix)) {
                return navigateTo(home)
            }
        } catch { }
    }, { global: true })
}
)
