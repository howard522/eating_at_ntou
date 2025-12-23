import { useUserStore } from '@stores/user'
import { useNotificationStore } from '@stores/notification'
import { useSnackbarStore } from '@utils/snackbar'

export default defineNuxtPlugin((nuxtApp) => {
    const userStore = useUserStore()
    const notificationStore = useNotificationStore()
    const snackbarStore = useSnackbarStore()
    const router = useRouter()

    const connections = new Map<string, WebSocket>()
    const reconnectTimers = new Map<string, any>()

    const connectToOrder = (orderId: string) => {
        // 清除該訂單的重連計時器（如果有的話）
        if (reconnectTimers.has(orderId)) {
            clearTimeout(reconnectTimers.get(orderId))
            reconnectTimers.delete(orderId)
        }

        if (connections.has(orderId)) return

        const protocol = window.location.protocol === "https:" ? "wss" : "ws"
        const ws = new WebSocket(`${protocol}://${location.host}/ws/${orderId}`)

        // 心跳計時器
        let pingInterval: any

        ws.onopen = () => {
            console.log(`[WS] Connected to order: ${orderId}`)
            if (userStore.token && userStore.info?.id) {
                ws.send(JSON.stringify({
                    type: "auth",
                    data: {
                        sender: userStore.info.id,
                        senderRole: userStore.currentRole,
                        content: userStore.token,
                    }
                }))
            }

            // 啟動心跳機制，每 30 秒發送一次 ping，防止連線因閒置被斷開
            pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ping' }))
                }
            }, 30000)
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)

                // 忽略 pong 或非關鍵訊息
                if (msg.type === 'pong') return

                const currentRoute = router.currentRoute.value
                // 寬鬆檢查是否在當前聊天室
                const isCurrentChat = currentRoute.path.includes(`/chat/${orderId}`)
                // 檢查是否在該訂單的狀態頁面
                const isCurrentOrderState = currentRoute.path.includes(`/order-state/${orderId}`) || currentRoute.path.includes(`/customer-order-state/${orderId}`)

                if (msg.type === 'message') {
                    // 如果不是自己發的訊息，且不在當前聊天室
                    if (msg.data.sender !== userStore.info?.id && !isCurrentChat) {
                        notificationStore.setHasMessage(orderId, true)
                        const senderName = msg.data.senderRole === 'customer' ? '顧客' : '外送員'
                        snackbarStore.showSnackbar(`收到來自 ${senderName} 的新訊息`, 'info')
                    }
                }

                if (msg.type === 'status') {
                    const data = msg.data || {}
                    const isCompleted = data.customerStatus === 'completed' || data.deliveryStatus === 'completed'

                    if (!isCurrentOrderState && !isCompleted) {
                        notificationStore.setHasStatusUpdate(orderId, true)
                        snackbarStore.showSnackbar(`訂單狀態已更新`, 'success')
                    }
                    // 觸發資料更新
                    notificationStore.triggerUpdate()
                    refreshNuxtData((key) => key.includes('/api/orders'))
                }

            } catch (e) {
                console.error('WS message error', e)
            }
        }

        ws.onclose = (e) => {
            console.log(`[WS] Closed for order ${orderId}:`, e.code, e.reason)
            connections.delete(orderId)
            clearInterval(pingInterval)

            // 如果使用者仍登入，嘗試重連
            if (userStore.token) {
                const timer = setTimeout(() => {
                    console.log(`[WS] Reconnecting to order ${orderId}...`)
                    connectToOrder(orderId)
                }, 3000) // 3秒後重連
                reconnectTimers.set(orderId, timer)
            }
        }

        ws.onerror = (err) => {
            console.error(`[WS] Error for order ${orderId}:`, err)
            ws.close() // 觸發 onclose 進行重連
        }

        connections.set(orderId, ws)
    }

    watch(() => [userStore.token, userStore.currentRole], async ([token, role]) => {
        if (token && role) {
            try {
                const data: any = await $fetch('/api/orders', {
                    headers: { Authorization: `Bearer ${token}` },
                    query: { role, limit: 20 }
                })

                if (data && data.data) {
                    const activeOrders = data.data.filter((o: any) =>
                        o.customerStatus !== 'completed' && o.customerStatus !== 'cancelled'
                    )
                    activeOrders.forEach((o: any) => connectToOrder(o._id))
                }
            } catch (e) {
                console.error('Failed to fetch orders for notifications', e)
            }
        } else {
            connections.forEach(ws => ws.close())
            connections.clear()
            reconnectTimers.forEach(timer => clearTimeout(timer))
            reconnectTimers.clear()
        }
    }, { immediate: true })
})
