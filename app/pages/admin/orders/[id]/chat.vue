<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8" xl="6">
        <v-btn @click="goBack" color="secondary" class="mb-4">返回上一頁</v-btn>

        <div class="messages" ref="messagesContainer">
          <template v-if="messages.length > 0">
            <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-wrapper d-flex align-start mb-4"
                :class="msg.senderRole === 'customer' ? 'flex-row' : 'flex-row-reverse'"
            >
              <v-avatar size="40" class="elevation-2 mt-1" :class="msg.senderRole === 'customer' ? 'mr-3' : 'ml-3'">
                <v-img :src="msg.senderImg" alt="Avatar" cover></v-img>
              </v-avatar>

              <div :class="['message', msg.senderRole === 'customer' ? 'left' : 'right']">
                <p class="message-header" :class="msg.senderRole === 'customer' ? 'align-left' : 'align-right'">
                  <span class="sender-role" :class="msg.senderRole === 'customer' ? 'left' : 'right'">
                    {{ msg.senderRole === 'customer' ? '顧客' : '外送員' }}
                  </span>

                  <strong class="sender-name">{{ msg.senderName }}</strong>

                  <span class="timestamp">{{ formatTimestamp(msg.timestamp) }}</span>
                </p>
                <p class="message-content">{{ msg.content }}</p>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="no-messages d-flex flex-column align-center justify-center pa-8">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-message-outline</v-icon>
              <p class="text-h6 text-grey">目前沒有對話紀錄</p>
            </div>
          </template>
        </div>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import {useUserStore} from '@stores/user';

const router = useRouter();
const route = useRoute();
const orderId = route.params.id as string;
const userStore = useUserStore();

interface ChatPayload {
  id: string;
  sender: string;
  senderName: string;
  senderImg: string;
  senderRole: 'customer' | 'delivery';
  content: string;
  timestamp?: Date | string;
}

const messages = ref<ChatPayload[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);

// 取得歷史對話
const { data: history } = await useFetch(`/api/orders/${orderId}/chats`, {
  transform: (res: any) => res.data,
  headers: { Authorization: `Bearer ${userStore.token}` },
});

if (history.value && Array.isArray(history.value)) {
  messages.value = history.value.map((m: any) => {
    return {
      id: String(m._id ?? ''),
      sender: String(m?.sender?._id ?? ''),
      senderName: m?.sender?.name || (m?.senderRole === 'delivery' ? '外送員' : '顧客'),
      senderImg: m?.sender?.img || '',
      senderRole: m?.senderRole === 'delivery' ? 'delivery' : 'customer',
      content: String(m?.content ?? ''),
      timestamp: m?.timestamp ?? undefined,
    } as ChatPayload;
  }).reverse();
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

onMounted(() => { scrollToBottom(); });
onActivated(() => { scrollToBottom(); });
watch(() => messages.value.length, () => { scrollToBottom(); });

function formatTimestamp(timestamp: Date | string | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.messages {
  display: flex;
  flex-direction: column;
  max-height: 550px;
  overflow-y: auto;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-wrapper {
  width: 100%;
}

.message {
  padding: 0.75rem;
  border-radius: 12px;
  line-height: 1.5;
  word-wrap: break-word;
  max-width: 75%;
  position: relative;
}

.message.left {
  background-color: #e3f2fd;
  text-align: left;
  border: 1px solid #bbdefb;
  border-top-left-radius: 2px;
}

.message.right {
  background-color: #ede7f6;
  text-align: right;
  border: 1px solid #d1c4e9;
  border-top-right-radius: 2px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
  font-weight: bold;
  color: #424242;
  flex-wrap: wrap;
}

.message-header.align-left {
  justify-content: flex-start;
}

.message-header.align-right {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.sender-role {
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #ffffff;
  white-space: nowrap;
}

.sender-role.left {
  background-color: #42a5f5;
}

.sender-role.right {
  background-color: #7e57c2;
}

.sender-name {
  font-size: 0.9rem;
  color: #1e88e5;
}

.timestamp {
  font-size: 0.75rem;
  color: #9e9e9e;
  font-style: normal;
}

.message-content {
  font-size: 1rem;
  margin: 0;
  color: #212121;
}

.no-messages {
  min-height: 220px;
  text-align: center;
}
</style>