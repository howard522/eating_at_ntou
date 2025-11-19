<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" md="8">
                <div class="messages">
                    <div v-for="msg in messages" :key="msg.id">
                        <p>
                            <strong>{{ getSenderName(msg) }} [{{ msg.senderRole }}] ({{ formatTimestamp(msg.timestamp) }}):</strong>
                            {{ msg.content }}
                        </p>
                    </div>
                </div>
                <v-text-field v-model="newMessage" label="輸入訊息" outlined dense class="mt-4"></v-text-field>
                <v-btn color="primary" class="mt-2" @click="handleSend">送出</v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

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

