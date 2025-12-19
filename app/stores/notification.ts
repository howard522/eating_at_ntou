import { defineStore } from 'pinia'

interface OrderNotification {
    hasMessage: boolean
    hasStatusUpdate: boolean
}

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        notifications: {} as Record<string, OrderNotification>,
        lastUpdate: 0
    }),

    getters: {
        hasNotification: (state) => {
            return Object.values(state.notifications).some(n => n.hasMessage || n.hasStatusUpdate)
        },
        notificationCount: (state) => {
            return Object.values(state.notifications).filter(n => n.hasMessage || n.hasStatusUpdate).length
        },
        getNotification: (state) => (orderId: string) => {
            return state.notifications[orderId] || { hasMessage: false, hasStatusUpdate: false }
        },
        hasMessage: (state) => (orderId: string) => {
            return state.notifications[orderId]?.hasMessage || false
        },
        hasStatusUpdate: (state) => (orderId: string) => {
            return state.notifications[orderId]?.hasStatusUpdate || false
        }
    },

    actions: {
        setHasMessage(orderId: string, value: boolean) {
            if (!this.notifications[orderId]) {
                this.notifications[orderId] = { hasMessage: false, hasStatusUpdate: false }
            }
            this.notifications[orderId].hasMessage = value
        },
        setHasStatusUpdate(orderId: string, value: boolean) {
            if (!this.notifications[orderId]) {
                this.notifications[orderId] = { hasMessage: false, hasStatusUpdate: false }
            }
            this.notifications[orderId].hasStatusUpdate = value
        },
        clearMessage(orderId: string) {
            if (this.notifications[orderId]) {
                this.notifications[orderId].hasMessage = false
            }
        },
        clearStatus(orderId: string) {
            if (this.notifications[orderId]) {
                this.notifications[orderId].hasStatusUpdate = false
            }
        },
        clearAll(orderId: string) {
            if (this.notifications[orderId]) {
                this.notifications[orderId].hasMessage = false
                this.notifications[orderId].hasStatusUpdate = false
            }
        },
        triggerUpdate() {
            this.lastUpdate = Date.now()
        }
    }
})
