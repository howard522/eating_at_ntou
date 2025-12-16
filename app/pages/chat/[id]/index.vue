<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" md="8">
                <v-btn @click="goBack" color="secondary" class="mb-4">返回上一頁</v-btn>
                <div class="messages" ref="messagesContainer">
                    <div
                        v-for="msg in messages"
                        :key="msg.id"
                        :class="['message', msg.senderRole === userStore.currentRole ? 'left' : 'right']"
                    >
                        <p class="message-header" :class="msg.senderRole === userStore.currentRole ? 'align-left' : 'align-right'">
                            <span class="sender-role" :class="msg.senderRole === userStore.currentRole ? 'left' : 'right'">
                                {{ msg.senderRole === 'customer' ? '顧客' : '外送員' }}
                            </span>
                            <strong class="sender-name">{{ getSenderName(msg) }}</strong>
                            <span class="timestamp">{{ formatTimestamp(msg.timestamp) }}</span>
                        </p>
                        <p class="message-content">{{ msg.content }}</p>
                    </div>
                </div>
                <div class="input-area">
                    <v-combobox
                        v-model="newMessage"
                        item-title="title"
                        item-value="title"
                        label="輸入訊息"
                        variant="solo"
                        prepend-inner-icon="mdi-message-text-outline"
                        clearable
                        style="max-width: 700px;"
                        @keydown.enter.prevent="handleSend"
                        @compositionstart="isComposing = true"
                        @compositionend="isComposing = false"
                    ></v-combobox>
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
    max-height: 550px;
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

.sender-role.left {
    background-color: #42a5f5;
}

.sender-role.right {
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
    align-items: flex-start;
    margin-top: 1rem;
}

.send-button {
    flex-shrink: 0;
    background-color: #1976d2;
    color: #ffffff;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    height: 56px;
    width: 80px;
}

.send-button:hover {
    background-color: #1565c0;
}
</style>

<script setup lang="ts">
import { useChat } from "@composable/useChat";
import { useUserStore } from "@stores/user";

const router = useRouter();
const route = useRoute();
const orderId = route.params.id as string;
const userStore = useUserStore();

const { data: orderData } = await useFetch(`/api/orders/${orderId}`, {
    transform: (response: any) => response.data,
    headers: { Authorization: `Bearer ${userStore.token}` },
});

const customer = computed(() => orderData.value?.user);

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
        return customer.value?.name || "未知使用者";
    } else if (msg.senderRole === "delivery" && orderData.value?.deliveryPerson) {
        return orderData.value.deliveryPerson.name;
    }
    return "未知使用者";
}

// 聊天訊息列表
const messages = ref<ChatPayload[]>([]);

const { data: history } = await useFetch(`/api/orders/${orderId}/chats`, {
    transform: (response: any) => response.data,
    headers: { Authorization: `Bearer ${userStore.token}` },
});

messages.value = history.value.map((msg: any) => ({
    id: msg._id,
    sender: msg.sender._id,
    senderRole: msg.senderRole,
    content: msg.content,
    timestamp: msg.timestamp,
})).reverse();

// 建立聊天室連線
const { send, disconnect } = useChat(orderId, messages);

// 輸入訊息的綁定變數
const newMessage = ref("");

// 跟踪是否正在組合輸入（中文輸入）
const isComposing = ref(false);

// 加入容器 ref 以控制捲動
const messagesContainer = ref<HTMLElement | null>(null);

// 捲到最底部
function scrollToBottom() {
        nextTick(() => {
            if (messagesContainer.value) {
                messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
            }
        });
}

// 載入後捲到底
onMounted(() => {
    scrollToBottom();
});

// 若頁面被 keep-alive，啟用時也捲到底
onActivated(() => {
    scrollToBottom();
});

// 訊息數量改變（歷史載入、收到新訊息）時捲到底
watch(() => messages.value.length, () => {
    scrollToBottom();
});

// 發送訊息
function handleSend() {
    if (isComposing.value) return;
    const msg = newMessage.value.trim();
    if (msg) {
        send(msg);
        newMessage.value = "";
        scrollToBottom();
    }
}

// 返回上一頁
function goBack() {
    router.back();
}

// 離開頁面時斷開連線
onUnmounted(() => {
    disconnect();
});
</script>

