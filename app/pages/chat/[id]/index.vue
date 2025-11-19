<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" md="8">
                <div class="messages">
                    <div
                        v-for="msg in messages"
                        :key="msg.id"
                        :class="['message', msg.senderRole === 'customer' ? 'left' : 'right']"
                    >
                        <p class="message-header" :class="msg.senderRole === 'customer' ? 'align-left' : 'align-right'">
                            <span class="sender-role" :class="msg.senderRole">
                                {{ msg.senderRole === 'customer' ? '顧客' : '外送員' }}
                            </span>
                            <strong class="sender-name">{{ getSenderName(msg) }}</strong>
                            <span class="timestamp">{{ formatTimestamp(msg.timestamp) }}</span>
                        </p>
                        <p class="message-content">{{ msg.content }}</p>
                    </div>
                </div>
                <div class="input-area">
                    <v-text-field
                        v-model="newMessage"
                        label="輸入訊息"
                        outlined
                        dense
                        class="message-input"
                    ></v-text-field>
                    <v-btn color="primary" class="send-button" @click="handleSend">送出</v-btn>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>
.messages {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 600px;
    overflow-y: auto;
    padding: 1rem;
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message {
    display: inline-block;
    margin-bottom: 0;
    padding: 0.75rem;
    border-radius: 8px;
    line-height: 1.5;
    word-wrap: break-word;
    max-width: 70%;
    width: auto;
}

.message.left {
    background-color: #e3f2fd;
    text-align: left;
    border: 1px solid #bbdefb;
    margin-right: auto;
}

.message.right {
    background-color: #ede7f6;
    text-align: right;
    border: 1px solid #d1c4e9;
    margin-left: auto;
}

.message-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
    font-weight: bold;
    color: #424242;
}

.message-header.align-left {
    justify-content: flex-start;
}

.message-header.align-right {
    justify-content: flex-end;
}

.sender-role {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #ffffff;
}

.sender-role.customer {
    background-color: #42a5f5;
}

.sender-role.delivery {
    background-color: #7e57c2;
}

.sender-name {
    font-size: 1rem;
    color: #1e88e5;
}

.timestamp {
    font-size: 0.8rem;
    color: #757575;
    font-style: italic;
    margin-left: 0.5rem;
}

.message-content {
    font-size: 1rem;
    margin: 0;
    color: #212121;
}

.input-area {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 1rem;
}

.message-input {
    flex: 1;
    background-color: #f5f5f5;
    border-radius: 8px;
}

.send-button {
    flex-shrink: 0;
    background-color: #1976d2;
    color: #ffffff;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.send-button:hover {
    background-color: #1565c0;
}
</style>

<script setup lang="ts">
import { useUserStore } from "@stores/user";
import { useChat } from "@app/composable/useChat";

const route = useRoute();
const orderId = route.params.id as string;
const userStore = useUserStore();

const {
    data: orderResponse,
    pending,
    error,
} = await useFetch(`/api/orders/${orderId}`, {
    transform: (response: any) => response.data,
    headers: {
        Authorization: `Bearer ${userStore.token}`,
    },
});

// 訂單資料
const orderData = ref(orderResponse.value);

// 顧客資料
const customer = orderData.value.user;

// 外送員資料
const deliver = computed(() => {
    if (orderData.value?.deliveryPerson) {
        const deliveryStatus = orderData.value.deliveryStatus;
        let statusText = "外送員正在處理您的訂單";
        if (deliveryStatus === "on_the_way") {
            statusText = "正在為您配送中...";
        } else if (deliveryStatus === "delivered") {
            statusText = "已送達指定地點";
        }
        return {
            name: `外送員：${orderData.value.deliveryPerson.name}`,
            phone: orderData.value.deliveryPerson.phone,
            img: orderData.value.deliveryPerson.image,
            status: statusText,
        };
    } else {
        return {
            name: "等待外送員接單",
            phone: "未知",
            img: "",
            status: "正在為您尋找附近的外送員...",
        };
    }
});

interface ChatPayload {
    id: string; // 訊息 ID
    sender: string; // 使用者 ID
    senderRole: "customer" | "delivery"; // 角色
    content: string; // 訊息內容
    timestamp?: Date | string; // 訊息時間戳
}

// 格式化時間戳
function formatTimestamp(timestamp: Date | string | undefined): string {
    if (!timestamp) return "";
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString();
}

// 根據訊息的 senderRole 取得對應的使用者名稱
function getSenderName(msg: ChatPayload): string {
    if (!msg) return "未知使用者";
    if (msg.senderRole === "customer") {
        return customer.name;
    } else if (msg.senderRole === "delivery" && orderData.value.deliveryPerson) {
        return orderData.value.deliveryPerson.name;
    } else {
        return "未知使用者";
    }
}

// 聊天訊息列表
const messages = ref<ChatPayload[]>([]);

// 抓取歷史訊息
const { data: history } = await useFetch(`/api/orders/${orderId}/chats`, {
    transform: (response: any) => response.data,
    headers: {
        Authorization: `Bearer ${userStore.token}`,
    },
});

// 將歷史訊息加入 messages 陣列
for (const msg of history.value) {
    messages.value.unshift({
        id: msg._id,
        sender: msg.sender._id,
        senderRole: msg.senderRole,
        content: msg.content,
        timestamp: msg.timestamp,
    });
}

// 建立聊天室連線
const { send, disconnect } = useChat(orderId, messages);

// 輸入訊息的綁定變數
const newMessage = ref("");

// 發送訊息
function handleSend() {
    let msg = newMessage.value.trim();
    if (msg !== "") {
        send(msg);
        console.log("Sent message:", msg);
        newMessage.value = "";
    }
}

// 離開頁面時斷開連線
onUnmounted(() => {
    disconnect();
});
</script>

