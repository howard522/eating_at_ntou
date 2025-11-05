import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        token: null as string | null,

        info: null as null | {
            id: string
            name: string
            email: string
            role: 'multi' | 'admin'
            img?: string
            address?: string
            phone?: string
        },
        //sung說,前端可以根據currentRole指定user看到的畫面,阿admin就是看到管理後台這樣

        // 顧客 or 外送員
        currentRole: null as 'customer' | 'delivery' | null
    }),

    actions: {
        // 登入請求, 並取得 token 及使用者資料
        async loginPost(email: string, password: string) {
            try {
                const res = await $fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: { email: email, password: password },
                })

                this.token = res.token
                this.info = res.user
                this.currentRole = null
                this.saveToStorage()

            } catch (err: any) {
                console.error('Error logging in:', err.message || err);
            }
        },

        // 註冊請求, 並取得 token 及使用者資料
        async registerPost(name: string, email: string, password: string, address?: string, phone?: string) {
            try {
                const res = await $fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: {
                        name: name,
                        email: email,
                        password: password,
                    },
                })

                this.token = res.token
                this.info = res.user
                this.currentRole = null
                this.info.address = address
                this.info.phone = phone
                this.saveToStorage()
                this.syncUserInfoWithDB()

            } catch (err: any) {
                console.error('Error registering:', err.message || err);
            }
        },

        // 選擇身份
        setRole(role: 'customer' | 'delivery') {
            this.currentRole = role
            this.saveToStorage()
        },

        // 同步使用者資料到DB
        async syncUserInfoWithDB() {
            if (!this.token || !this.info) {
                console.log('User not logged in, skipping user info sync.');
                return;
            }
            try {
                await $fetch('/api/auth/me', {
                    method: 'PATCH',
                    headers: {
                        'Accept': '*/*',
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        name: this.info.name,
                        address: this.info.address,
                        phone: this.info.phone,
                        img: this.info.img,
                    },
                });
            } catch (err: any) {
                console.error('Error syncing user info:', err.message || err);
            }
        },

        // 更新密碼
        async updatePassword(currentPassword: string, newPassword: string) {
            if (!this.token) {
                console.log('User not logged in, skipping password update.');
                return;
            }
            try {
                await $fetch('/api/auth/me/password', {
                    method: 'PATCH',
                    headers: {
                        'Accept': '*/*',
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                    },
                });
            } catch (err: any) {
                console.error('Error updating password:', err.message || err);
            }
        },

        // 登出
        logout() {
            this.token = null
            this.info = null
            this.currentRole = null
            localStorage.removeItem('userStore')
        },

        clearUserData() {
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
        },

        initialize() {
            this.loadFromStorage()
        }
    },

    getters: {
        isLoggedIn: (state) => !!state.token,
        isAdmin: (state) => state.info?.role === 'admin',
        isMultiRole: (state) => state.info?.role === 'multi'
    }
})
