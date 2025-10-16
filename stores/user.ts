import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        token: null as string | null,

        info: null as null | {
            id: string
            name: string
            email: string
            role: 'multi' | 'admin'
        },

        // 顧客 or 外送員
        currentRole: null as 'customer' | 'delivery' | null
    }),

    actions: {
        // 登入成功後呼叫
        login(token: string, user: any) {
            this.token = token
            this.info = user

            // 預設 multi 使用者要選身份；admin 則不需
            if (user.role === 'admin') {
                this.currentRole = null // admin 沒有 customer/delivery 身分
            } else if (user.role === 'multi') {
                this.currentRole = null // 等使用者自己選
            }

            this.saveToStorage()
        },

        // 選擇身份
        setRole(role: 'customer' | 'delivery') {
            this.currentRole = role
            this.saveToStorage()
        },

        // 登出
        logout() {
            this.token = null
            this.info = null
            this.currentRole = null
            localStorage.removeItem('userStore')
        },

        saveToStorage() {
            localStorage.setItem('userStore', JSON.stringify(this.$state))
        },

        loadFromStorage() {
            const data = localStorage.getItem('userStore')
            if (data) this.$patch(JSON.parse(data))
        }
    },

    getters: {
        isLoggedIn: (state) => !!state.token,
        isAdmin: (state) => state.info?.role === 'admin',
        isMultiRole: (state) => state.info?.role === 'multi'
    }
})
