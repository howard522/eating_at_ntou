import { useUserStore } from "@stores/user";

interface ChatPayload {
    sender: string; // 使用者 ID
    senderRole: "customer" | "delivery"; // 角色
    content: string; // 訊息內容
}

export function useChat(orderId: string, messages: Ref<ChatPayload[]>) {
    const userStore = useUserStore();
    const ws = ref<WebSocket | null>(null);

    const token = userStore.token; // JWT token
    const userId = userStore.info?.id; // 使用者 ID
    const role = userStore.currentRole; // "customer" 或 "delivery"

    // 建立 WebSocket 連線
    ws.value = new WebSocket(`ws://${location.host}/ws/${orderId}`);

    // 處理收到的訊息
    ws.value.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "message") {
            messages.value.push(message.data);
        } else if (message.type === "join") {
            messages.value.push(message.data);
        } else if (message.type === "leave") {
            messages.value.push(message.data);
        } else if (message.type === "error") {
            console.error("WebSocket error:", message.message);
        } else {
            console.warn("Unknown WebSocket message type:", message);
        }
    };

    // 連線成功後發送認證訊息
    ws.value.onopen = () => {
        console.log("WebSocket connected to", ws.value?.url);
        const authPayload: ChatPayload = {
            sender: userId as string,
            senderRole: role as "customer" | "delivery",
            content: token as string,
        };
        ws.value?.send(JSON.stringify({ type: "auth", data: authPayload }));
    };

    // 連線關閉處理
    ws.value.onclose = () => {
        console.log("WebSocket disconnected");
    };

    // 發送訊息
    function send(content: string) {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
            const payload: ChatPayload = {
                sender: userId as string,
                senderRole: role as "customer" | "delivery",
                content,
            };
            ws.value.send(JSON.stringify({ type: "send", data: payload }));
        }
    }

    // 斷開連線
    function disconnect() {
        if (ws.value) {
            ws.value.close();
        }
        ws.value = null;
    }

    return {
        send,
        disconnect,
    };
}
