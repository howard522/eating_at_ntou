import { useUserStore } from '../stores/user'

export default defineNuxtPlugin((nuxtApp: any) => {
    const userStore = useUserStore()
    // 在 app created 時還原（若 store 提供此方法）
    try {
        if (typeof userStore.loadFromStorage === 'function') {
            // guard for stores that may not implement loadFromStorage
            userStore.loadFromStorage()
        }
    } catch (e) {
        // ignore
    }

    // 攔截 $fetch：使用 any cast 避免 HookKeys typing 問題
    ; (nuxtApp as any).hook('fetch:before', (ctx: any) => {
        try {
            const token = userStore?.token
            if (token) {
                ctx.options = ctx.options || {}
                ctx.options.headers = {
                    ...ctx.options.headers,
                    Authorization: `Bearer ${token}`
                }
            }
        } catch (e) {
            // ignore
        }
    })
})
