<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col cols="12">
        <v-btn
          prepend-icon="mdi-arrow-left"
          variant="text"
          to="/admin/users"
          class="mb-2"
        >
        </v-btn>
        <h2 class="text-h4 font-weight-bold">會員詳細資料</h2>
      </v-col>
    </v-row>

    <v-row v-if="pending">
      <v-col cols="12">
        <v-skeleton-loader type="card-avatar, article"></v-skeleton-loader>
      </v-col>
    </v-row>

    <v-row v-else-if="error || !userInfo">
      <v-col cols="12">
        <v-alert type="error" title="無法載入使用者">
          找不到該使用者或發生伺服器錯誤。
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else justify="center">

      <v-col cols="12" md="4" lg="3">
        <v-card elevation="2" class="text-center py-6" height="auto">
          <v-avatar size="120" color="grey-lighten-2" class="mb-4">
            <v-img
              v-if="userInfo.img"
              :src="userInfo.img"
              alt="Avatar"
              cover
            >
              <template v-slot:placeholder>
                <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
              </template>
            </v-img>
            <v-icon v-else icon="mdi-account" size="60" color="grey-darken-1"></v-icon>
          </v-avatar>

          <h3 class="text-h5 font-weight-bold mb-1">{{ userInfo.name }}</h3>
          <p class="text-body-2 text-grey mb-4">{{ userInfo.email }}</p>

          <v-chip
            :color="roleColor"
            class="font-weight-bold mb-6"
            label
          >
            {{ roleDisplay }}
          </v-chip>

          <div class="px-4" v-if="userInfo.role !== 'admin'">
            <v-divider class="mb-4"></v-divider>

            <v-btn
              block
              :color="isBanned ? 'success' : 'error'"
              :prepend-icon="isBanned ? 'mdi-account-check' : 'mdi-account-cancel'"
              :loading="processing"
              @click="toggleBanStatus"
              variant="flat"
            >
              {{ isBanned ? '恢復帳號權限' : '停用此帳號' }}
            </v-btn>

            <p class="text-caption text-grey mt-2">
              {{ isBanned ? '點擊後使用者將恢復正常登入權限' : '停用後使用者將無法登入系統' }}
            </p>
          </div>
          <div v-else class="px-4">
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              text="無法停用管理員帳號"
            ></v-alert>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="7" lg="6">
        <v-card elevation="2" title="帳號資訊" height="auto">
          <v-card-text class="pt-4">
            <v-row>
              <v-col cols="12" md="6" class="pb-4">
                <div class="d-flex align-start">
                  <v-icon color="primary" class="mr-3 mt-1">mdi-identifier</v-icon>
                  <div>
                    <div class="text-caption text-grey-darken-1">使用者 ID</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ userInfo.id }}</div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="pb-4">
                <div class="d-flex align-start">
                  <v-icon color="primary" class="mr-3 mt-1">mdi-calendar-clock</v-icon>
                  <div>
                    <div class="text-caption text-grey-darken-1">建立帳號時間</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ formatDate(userInfo.createdAt) }}</div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="pb-4">
                <div class="d-flex align-start">
                  <v-icon color="primary" class="mr-3 mt-1">mdi-phone</v-icon>
                  <div>
                    <div class="text-caption text-grey-darken-1">聯絡電話</div>
                    <div class="text-body-1 font-weight-medium mt-1">{{ userInfo.phone || '未填寫' }}</div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6" class="pb-4">
                <div class="d-flex align-start">
                  <v-icon color="primary" class="mr-3 mt-1">mdi-map-marker</v-icon>
                  <div>
                    <div class="text-caption text-grey-darken-1">地址</div>
                    <div class="text-body-1 font-weight-medium mt-1 text-wrap">{{ userInfo.address || '未填寫' }}</div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" v-if="userInfo.role === 'banned'">
                <v-alert color="error" variant="tonal" icon="mdi-alert-circle" class="mt-2">
                  此帳號目前處於停用狀態
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top"
      timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">關閉</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user';
import type { User } from '@types/user';

const route = useRoute();
const userStore = useUserStore();
const userId = route.params.id as string;

interface ApiResponse {
  success: boolean;
  data: User;
}

const processing = ref(false);
const userInfo = ref<User | null>(null);
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

const { data: response, pending, error } = await useFetch<ApiResponse>(`/api/admin/users/${userId}`, {
  headers: {
    Authorization: `Bearer ${userStore.token}`
  }
});

watch(response, (newVal) => {
  if (newVal && newVal.success) {
    userInfo.value = { ...newVal.data };
  }
}, { immediate: true });

const isBanned = computed(() => userInfo.value?.role === 'banned');

const roleColor = computed(() => {
  if (!userInfo.value) return 'grey';
  switch (userInfo.value.role) {
    case 'admin': return 'error';
    case 'multi': return 'primary';
    case 'banned': return 'grey-darken-3';
    default: return 'grey';
  }
});

const roleDisplay = computed(() => {
  if (!userInfo.value) return '';
  const map: Record<string, string> = {
    'admin': '管理員',
    'multi': '一般用戶',
    'banned': '停權'
  };
  return map[userInfo.value.role] || userInfo.value.role;
});

const formatDate = (dateString: string) => {
  if (!dateString) return '無資料';
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 處理停用/恢復
const toggleBanStatus = async () => {
  if (!userInfo.value) return;
  processing.value = true;
  const action = isBanned.value ? 'unban' : 'ban';
  try {
    const res = await $fetch<{ success: boolean; userId: string; role: string }>(
      `/api/admin/users/${userId}/${action}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      }
    );
    if (res.success) {
      snackbar.value = {
        show: true,
        text: isBanned.value ? '已成功恢復帳號' : '已成功停用帳號',
        color: 'success'
      };
      userInfo.value.role = res.role;
    }
  } catch (err) {
    console.error(err);
    snackbar.value = {
      show: true,
      text: '操作失敗，請確認權限或稍後再試',
      color: 'error'
    };
  } finally {
    processing.value = false;
  }
};

useHead({
  title: '會員詳細資料'
});
</script>

<style scoped>
.text-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
