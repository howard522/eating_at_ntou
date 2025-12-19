import { useCartStore } from '@stores/cart';
import { defineStore } from 'pinia';

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
                return res
            } catch (err: any) {
                const msg = err?.data?.message || err?.message || '登入失敗，請稍後再試'
                console.error('Error logging in:', msg);
                throw new Error(msg)
            }
        },

        // 註冊請求, 並取得 token 及使用者資料
        async registerPost(name: string, email: string, password: string, address?: string, phone?: string, img?: File) {
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
                if (this.info) {
                    this.info.address = address
                    this.info.phone = phone
                    if (img) {
                        this.info.img = img
                    }
                }
                this.saveToStorage()
                await this.syncUserInfoWithDB()
                return res
            } catch (err: any) {
                const msg = err?.data?.message || err?.message || '註冊失敗，請稍後再試'
                console.error('Error registering:', msg);
                throw new Error(msg)
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
                throw new Error('尚未登入')
            }
            try {
                // 使用 FormData 傳送，讓後端能接收檔案（img）與其他欄位
                const form = new FormData()
                if (this.info.name != null) form.append('name', this.info.name)
                if (this.info.address != null) form.append('address', this.info.address)
                if (this.info.phone != null) form.append('phone', this.info.phone)

                // img 可能是 File/Blob（上傳新檔案），也可能是字串 URL/路徑（後端若接受字串可處理）
                if (this.info.img != null) {
                    // 當 img 是 File 或 Blob 時直接 append 檔案
                    // 在瀏覽器端可使用 instanceof File
                    try {
                        if ((this.info.img as any) instanceof File || (this.info.img as any) instanceof Blob) {
                            form.append('img', this.info.img as any)
                        } else if (typeof this.info.img === 'string') {
                            // 若後端接受字串表示的 image path/url，送出字串；否則可跳過
                            form.append('img', this.info.img)
                        }
                    } catch (e) {
                        // 某些執行環境（SSR）可能無法存取 File constructor，保守處理成字串
                        if (typeof this.info.img === 'string') form.append('img', this.info.img)
                    }
                }

                await $fetch('/api/auth/me', {
                    method: 'PATCH',
                    headers: {
                        'Accept': '*/*',
                        'Authorization': `Bearer ${this.token}`,
                        // 不要手動設定 Content-Type，fetch 會自動帶上 multipart/form-data; boundary
                    },
                    body: form,
                })
                return true
            } catch (err: any) {
                const msg = err?.data?.message || err?.message || '更新個人資料失敗，請稍後再試'
                console.error('Error syncing user info:', msg)
                throw new Error(msg)
            }
        },

        // 更新密碼
        async updatePassword(currentPassword: string, newPassword: string) {
            if (!this.token) {
                throw new Error('尚未登入')
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
                return true
            } catch (err: any) {
                const msg = err?.data?.message || err?.message || '更新密碼失敗，請稍後再試'
                console.error('Error updating password:', msg);
                throw new Error(msg)
            }
        },

        // 登出
        logout() {
            this.token = null
            this.info = null
            this.currentRole = null
            localStorage.removeItem('userStore')
            const cartStore = useCartStore()
            cartStore.clearCart()
            localStorage.removeItem('cartDeliveryInfo')
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
