<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <div v-if="pending" key="loading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="text-h6 mt-4">正在載入訂單資訊...</p>
        </div>

        <v-alert
            v-else-if="error || !orderData"
            key="error"
            type="error"
            title="載入失敗"
            text="無法讀取訂單資訊，請稍後再試或檢查訂單 ID。"
            variant="outlined"
            prominent
            class="mt-10"
        ></v-alert>

        <template v-else key="content">
          <div class="text-center mt-4 mb-8">
            <h1 class="text-h3 font-weight-bold mb-2">訂單已送出！</h1>
            <p class="text-h6 text-medium-emphasis">
              您可以在下方追蹤您的訂單狀態
            </p>
          </div>

          <v-stepper
              v-model="currentStep"
              alt-labels
              flat
              class="my-10"
          >
            <v-stepper-header>
              <template v-for="(step, index) in steps" :key="step.id">
                <v-stepper-item
                    :title="step.title"
                    :value="step.id"
                    :complete="step.id < currentStep || currentStep === 4"
                    :color="currentStep === 4 ? 'success' : (step.id === currentStep) ? 'primary' : (step.id < currentStep ? 'success' : undefined)" >
                </v-stepper-item>
                <v-divider v-if="index < steps.length - 1"></v-divider>
              </template>
            </v-stepper-header>
          </v-stepper>

          <v-card flat border rounded="lg" class="mb-6">
            <v-card-title class="text-h6 font-weight-bold d-flex align-center">
              <v-icon icon="mdi-map-marker-radius" start color="green" class="mr-2"></v-icon>
              取餐資訊
            </v-card-title>
            
            <v-divider></v-divider>

            <v-card-text class="pa-5">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1">取餐人暱稱</div>
                  <div class="text-body-1 font-weight-medium d-flex align-center">
                    <v-icon icon="mdi-account-outline" size="small" class="mr-2 text-medium-emphasis"></v-icon>
                    {{ orderData.deliveryInfo?.contactName }}
                  </div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1 mt-3 mt-sm-0">連絡電話</div>
                  <div class="text-body-1 font-weight-medium d-flex align-center">
                    <v-icon icon="mdi-phone-outline" size="small" class="mr-2 text-medium-emphasis"></v-icon>
                    {{ orderData.deliveryInfo?.contactPhone }}
                  </div>
                </v-col>

                <v-col cols="12">
                  <div class="text-caption text-medium-emphasis mb-1 mt-3">取餐地點</div>
                  <div class="text-body-1 font-weight-medium d-flex align-center">
                    <v-icon icon="mdi-map-marker-outline" size="small" class="mr-2 text-medium-emphasis"></v-icon>
                    {{ orderData.deliveryInfo?.address }}
                  </div>
                </v-col>

                <v-col cols="12">
                  <v-alert
                    color="info"
                    variant="tonal"
                    density="compact"
                    class="mt-3"
                    icon="mdi-note-text-outline"
                  >
                    <div class="text-caption text-medium-emphasis">備註</div>
                    <div class="text-body-2 font-weight-medium">
                      {{ orderData.deliveryInfo?.note || '無' }}
                    </div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card flat border rounded="lg" class="mb-6">
            <v-list-item lines="two" class="pa-5">
              <template v-slot:prepend>
                <v-avatar size="56" class="me-4">
                  <v-img :src="deliver.img" cover>
                    <template #error>
                      <v-sheet
                          color="white"
                          rounded="circle"
                          width="56"
                          height="56"
                          class="d-flex align-center justify-center"
                      >
                        <v-icon :color="orderData.deliveryPerson ? 'blue' : 'grey'" size="30">
                          {{ orderData.deliveryPerson ? 'mdi-account' : 'mdi-help-rhombus-outline' }}
                        </v-icon>
                      </v-sheet>
                    </template>
                  </v-img>
                </v-avatar>
              </template>
              <v-list-item-title class="text-h6 font-weight-bold mb-1">
                {{ deliver.name }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ deliver.status }}</v-list-item-subtitle>
              <template v-slot:append>
                <span
                    v-if="deliver.phone && deliver.phone !== '未知'"
                    class="text-body-1 font-weight-medium text-medium-emphasis"
                >
                  連絡電話：{{ deliver.phone }}
                </span>
              </template>
            </v-list-item>
          </v-card>
          <v-card flat border rounded="lg" class="mb-6">
            <v-card-title class="text-h6 font-weight-bold">
              外送地圖（示意）
            </v-card-title>
            <v-card-text>
              <DeliveryMap
                  :driver-position="courierPosition"
                  :customer-position="customerPosition"
                  :restaurant-positions="restaurantPositions"
              />
            </v-card-text>
          </v-card>
          <v-card flat border rounded="lg" class="mb-6">
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="6">
                  <h3 class="text-h6 font-weight-bold">餐點資訊</h3>
                </v-col>
                <v-col cols="12" md="6">
                  <h3 class="text-h6 font-weight-bold">餐廳資訊</h3>
                </v-col>
              </v-row>
              <v-divider></v-divider>

              <div v-for="(item, index) in orderData.items" :key="item._id">
                <v-row class="py-3 align-center">
                  <v-col cols="12" md="6">
                    <div class="text-body-1 font-weight-bold">
                      {{ item.name }} x {{ item.quantity }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="text-body-1">
                      {{ item.restaurant?.name }}
                      <span>
                        （{{ item.restaurant.phone }}）
                      </span>
                    </div>
                  </v-col>
                </v-row>
                <v-divider v-if="index < orderData.items.length - 1"></v-divider>
              </div>

              <v-divider></v-divider>
              <div class="text-h6 font-weight-bold pt-5">
                總計 ${{ orderData.total }}
              </div>
            </v-card-text>
          </v-card>

          <v-badge
              :model-value="notificationStore.hasMessage(orderId)"
              color="error"
              dot
              class="w-100 mt-4 notification-badge"
          >
            <v-btn
                color="primary"
                block
                size="large"
                @click="navigateTo(`/chat/${orderId}`)"
            >
                <span class="text-h6 font-weight-bold">聯絡外送員</span>
            </v-btn>
          </v-badge>

          <v-btn
              :color="currentStep === 1 ? 'error' : 'success'"
              block
              size="x-large"
              class="mt-4"
              :disabled="currentStep >= 3 || isUpdating"
              :loading="isUpdating"
              @click="currentStep === 1 ? cancelOrder() : openConfirmDialog()"
          >
            <span class="text-h6 font-weight-bold">
              {{ currentStep === 1 ? '取消訂單' : (currentStep < 3 ? '我已收到餐點' : '已接收') }}
            </span>
          </v-btn>

          <v-dialog v-model="isConfirmDialogVisible" max-width="400">
            <v-card>
              <v-card-title class="text-h5 font-weight-bold">
                確認收到餐點？
              </v-card-title>
              <v-card-text>
                按下確認後，即表示您已確認收到餐點，請確認餐點無誤後再按下確認。
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    text="取消"
                    :disabled="isUpdating"
                    @click="isConfirmDialogVisible = false"
                ></v-btn>
                <v-btn
                    color="success"
                    text="確認"
                    :loading="isUpdating"
                    @click="markAsReceived"
                ></v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user';
import { useOrderTracking } from '@app/composable/useOrderTracking';
import { useNotificationStore } from '@stores/notification';

type LatLng = [number, number]
const steps = ref([
  { id: 1, title: '沒人接QAQ' },
  { id: 2, title: '準備中' },
  { id: 3, title: '已接收' },
  { id: 4, title: '已完成' },
]);

const statusToStepMap: Record<string, number> = {
  'preparing': 1,
  'on_the_way': 2,
  'received': 3,
  'completed': 4,
};

const route = useRoute();
const orderId = route.params.id as string;
const userStore = useUserStore();
const notificationStore = useNotificationStore();

// 進入頁面時清除狀態更新通知
onMounted(() => {
    notificationStore.clearStatus(orderId);
});

onActivated(() => {
    notificationStore.clearStatus(orderId);
});

const isUpdating = ref(false);

// const courierStartPosition = ref<LatLng>([25.152, 121.770])
// const courierPosition = ref<LatLng | null>(courierStartPosition.value)
// const customerPosition = ref<LatLng>([25.1508, 121.7730])
// const restaurantPositions = ref<LatLng[]>([
//   [25.155, 121.775],
//   [25.148, 121.770],
// ])
const isConfirmDialogVisible = ref(false); 

const { data: orderResponse, pending, error } = await useFetch(
    `/api/orders/${orderId}`,
    {
      transform: (response: any) => response.data,
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    }
);

const orderData = ref(orderResponse.value);
const toLatLng = (location?: { lat?: number; lng?: number } | null): LatLng | null => {
  if (!location) return null
  if (typeof location.lat === 'number' && typeof location.lng === 'number') {
    return [location.lat, location.lng]
  }
  return null
}
const customerPosition = computed<LatLng | null>(() => toLatLng(orderData.value?.deliveryInfo?.location))
const restaurantPositions = computed<LatLng[]>(() => {
  if (!orderData.value?.items) return []
  const seen = new Set<string>()
  const positions: LatLng[] = []
  orderData.value.items.forEach((item: any) => {
    const loc = toLatLng(item.restaurant?.location)
    if (loc) {
      const key = loc.join(',')
      if (!seen.has(key)) {
        seen.add(key)
        positions.push(loc)
      }
    }
  })
  return positions
})
const { driverPosition: courierPosition } = useOrderTracking(orderId)
if (orderData.value && orderData.value.deliveryPerson && orderData.value.customerStatus === 'preparing') {
  isUpdating.value = true;
  try {
    const response: any = await $fetch(
        `/api/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${userStore.token}`,
            'Content-Type': 'application/json',
          },
          body: { customerStatus: 'on_the_way' },
        }
    );

    if (response.success && orderData.value) {
      orderData.value.customerStatus = response.data.customerStatus;
      orderData.value.deliveryStatus = response.data.deliveryStatus;
    } else {
      console.error('Failed to auto-update status to on_the_way', response);
    }
  } catch (err) {
    console.error('Error auto-updating status to on_the_way', err);
  } finally {
    isUpdating.value = false;
  }
}

const currentStep = computed(() => {
  return statusToStepMap[orderData.value.customerStatus];
});

const deliver = computed(() => {
  if (orderData.value?.deliveryPerson) {
    const deliveryStatus = orderData.value.deliveryStatus;
    let statusText = '外送員正在處理您的訂單';
    if (deliveryStatus === 'on_the_way') {
      statusText = '預計送達時間：' + new Date(orderData.value.arriveTime).toLocaleString();
    } else if (deliveryStatus === 'delivered') {
      statusText = '已送達指定地點';
    } else if (deliveryStatus === 'completed') {
      statusText = '訂單已完成';
    }
    return {
      name: `外送員：${orderData.value.deliveryPerson.name}`,
      phone: orderData.value.deliveryPerson.phone,
      img: orderData.value.deliveryPerson.img,
      status: statusText,
    };
  } else {
    return {
      name: '等待外送員接單',
      phone: '未知',
      img: '',
      status: '正在為您尋找附近的外送員...',
    };
  }
});

const openConfirmDialog = () => {
  isConfirmDialogVisible.value = true;
};

const cancelOrder = async () => {
  if (currentStep.value !== 1) return;
  isUpdating.value = true;
  try {
    const response: any = await $fetch(
      `/api/orders/${orderId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${userStore.token}`,
          'Content-Type': 'application/json',
        },
        body: {
          customerStatus: 'received',
          deliveryStatus: 'delivered',
        },
      }
    );

    if (response.success && orderData.value) {
      orderData.value.customerStatus = response.data.customerStatus;
      orderData.value.deliveryStatus = response.data.deliveryStatus;
    } else {
      console.error('Failed to cancel order', response);
    }
  } catch (err) {
    console.error('Error cancelling order', err);
  } finally {
    isUpdating.value = false;
  }
};

const markAsReceived = async () => {
  
  if (currentStep.value >= 3) return;
  isUpdating.value = true;
  try {
    const response: any = await $fetch(
        `/api/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${userStore.token}`,
            'Content-Type': 'application/json',
          },
          body: {
            customerStatus: 'received'
          }
        }
    );

    if (response.success && orderData.value) {
      orderData.value.customerStatus = response.data.customerStatus;
      orderData.value.deliveryStatus = response.data.deliveryStatus;
    } else {
      console.error('Failed to update status', response);
    }
  } catch (err) {
    console.error('Error updating status', err);
  } finally {
    isUpdating.value = false;
    isConfirmDialogVisible.value = false;
  }
};

useHead({
  title: '訂單狀態',
});
</script>

<style scoped>
.notification-badge :deep(.v-badge__badge) {
  animation: pulse 1.5s infinite;
  border: 2px solid white;
  width: 12px;
  height: 12px;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
  }
}
</style>
