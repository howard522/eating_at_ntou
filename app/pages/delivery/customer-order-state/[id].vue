<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <div v-if="pending" key="loading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="text-h6 mt-4">正在載入任務資訊...</p>
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
            <h1 class="text-h3 font-weight-bold mb-2">外送任務詳情</h1>
            <p class="text-h6 text-medium-emphasis">
              請依據下列資訊完成配送
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
                    :color="currentStep === 4 ? 'success' : (step.id === currentStep) ? 'primary' : (step.id < currentStep ? 'success' : undefined)"
                >
                </v-stepper-item>
                <v-divider v-if="index < steps.length - 1"></v-divider>
              </template>
            </v-stepper-header>
          </v-stepper>

          <template v-for="(restaurant, index) in restaurantsWithItems" :key="restaurant.id">
            <v-card flat border rounded="lg" class="mb-6">
              <v-card-title class="d-flex align-center bg-blue-grey-lighten-5">
                <v-icon color="info" start>mdi-store-outline</v-icon>
                <span class="text-h6 font-weight-bold">取餐點 {{ index + 1 }}：{{ restaurant.name }}</span>
              </v-card-title>

              <v-list class="py-0">
                <v-list-item
                    :title="restaurant.address || '地址未提供'"
                    subtitle="餐廳地址"
                >
                </v-list-item>
                <v-divider inset></v-divider>
                <v-list-item
                    :title="restaurant.phone"
                    subtitle="餐廳電話"
                >
                </v-list-item>
              </v-list>

              <v-divider></v-divider>

              <v-card-text>
                <h3 class="text-subtitle-1 font-weight-bold mb-2">取餐品項：</h3>
                <div v-for="(item, itemIndex) in restaurant.items" :key="item._id">
                  <v-row class="py-2 align-center">
                    <v-col cols="8">
                      <div class="text-body-1 font-weight-medium">
                        {{ item.name }}
                      </div>
                    </v-col>
                    <v-col cols="4" class="text-right">
                      <div class="text-body-1">
                        x {{ item.quantity }}
                      </div>
                    </v-col>
                  </v-row>
                  <v-divider v-if="itemIndex < restaurant.items.length - 1"></v-divider>
                </div>
              </v-card-text>
            </v-card>
          </template>
          <v-card flat border rounded="lg" class="mb-6">
            <v-card-title class="d-flex align-center">
              <v-icon color="success" start>mdi-map-marker-outline</v-icon>
              <span class="text-h6 font-weight-bold">配送資訊</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-list class="py-0">
              <v-list-item
                  :title="orderData.deliveryInfo.address"
                  subtitle="外送地址"
              >
              </v-list-item>
              <v-divider inset></v-divider>
              <v-list-item
                  :title="orderData.deliveryInfo.contactName"
                  subtitle="顧客暱稱"
              ></v-list-item>
              <v-divider inset></v-divider>
              <v-list-item
                  :title="orderData.deliveryInfo.contactPhone"
                  subtitle="顧客電話"
              >
              </v-list-item>
              <v-divider v-if="orderData.deliveryInfo.note" inset></v-divider>
              <v-list-item
                  v-if="orderData.deliveryInfo.note"
                  :title="orderData.deliveryInfo.note"
                  subtitle="顧客備註"
              ></v-list-item>
            </v-list>
          </v-card>

          <v-card flat border rounded="lg" class="mb-6">
            <v-card-text class="pa-5">
              <div class="text-h6 font-weight-bold d-flex justify-space-between">
                <span>外送費</span>
                <span>${{ orderData.deliveryFee }}</span>
              </div>
            </v-card-text>
          </v-card>

          <v-btn
              :color="actionButtonColor"
              block
              size="x-large"
              class="mt-4"
              :disabled="isActionDisabled"
              :loading="isUpdating"
              @click="openConfirmDialog"
          >
            <span class="text-h6 font-weight-bold">
              {{ actionButtonText }}
            </span>
          </v-btn>

          <v-dialog v-model="isConfirmDialogVisible" max-width="450">
            <v-card>
              <v-card-title class="text-h5 font-weight-bold">
                {{ dialogTitle }}
              </v-card-title>
              <v-card-text>
                {{ dialogText }}
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    text="取消"
                    :disabled="isUpdating"
                    @click="isConfirmDialogVisible = false"
                ></v-btn>
                <v-btn
                    :color="actionButtonColor"
                    text="確認"
                    :loading="isUpdating"
                    @click="updateDeliveryStatus"
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
import { useUserStore } from "../../../../stores/user";

const steps = ref([
  { id: 1, title: '準備中' },
  { id: 2, title: '配送中' },
  { id: 3, title: '已送達' },
  { id: 4, title: '已完成' },
]);

const deliveryStatusToStepMap: Record<string, number> = {
  'preparing': 1,
  'on_the_way': 2,
  'delivered': 3,
  'completed': 4,
};

const route = useRoute();
const orderId = route.params.id as string;
const userStore = useUserStore();
const isUpdating = ref(false);
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

const currentStep = computed(() => {
  if (!orderData.value) return 1;
  return deliveryStatusToStepMap[orderData.value.deliveryStatus] || 1;
});

const restaurantsWithItems = computed(() => {
  if (!orderData.value || !orderData.value.items) {
    return [];
  }
  const restaurantMap = new Map();
  for (const item of orderData.value.items) {
    const restaurant = item.restaurant;
    if (!restaurant) continue;

    if (!restaurantMap.has(restaurant.id)) {
      restaurantMap.set(restaurant.id, {
        id: restaurant.id,
        name: restaurant.name,
        phone: restaurant.phone,
        items: []
      });
    }
    restaurantMap.get(restaurant.id).items.push({
      _id: item._id,
      name: item.name,
      quantity: item.quantity
    });
  }
  return Array.from(restaurantMap.values());
});

const nextDeliveryStatus = computed(() => {
  switch (currentStep.value) {
    case 1:
      return 'on_the_way';
    case 2:
      return 'delivered';
    default:
      return null;
  }
});

const actionButtonText = computed(() => {
  switch (currentStep.value) {
    case 1:
      return '已取餐';
    case 2:
      return '已送達';
    case 3:
      return '等待顧客確認';
    case 4:
      return '已完成';
    default:
      return '狀態不明';
  }
});

const actionButtonColor = computed(() => {
  switch (currentStep.value) {
    case 1:
      return 'info';
    case 2:
      return 'success';
    default:
      return 'grey';
  }
});

const isActionDisabled = computed(() => {
  return isUpdating.value || currentStep.value >= 3;
});

const dialogTitle = computed(() => {
  if (nextDeliveryStatus.value === 'on_the_way') {
    return '確認取餐？';
  }
  if (nextDeliveryStatus.value === 'delivered') {
    return '確認送達？';
  }
  return '確認';
});

const dialogText = computed(() => {
  if (nextDeliveryStatus.value === 'on_the_way') {
    return '按下確認後，系統將通知顧客您已前往取餐，請確認所有餐廳的餐點都已取齊！';
  }
  if (nextDeliveryStatus.value === 'delivered') {
    return '按下確認後，將會通知顧客您已送達，請確認餐點有確實送到顧客手中！';
  }
  return '';
});

const openConfirmDialog = () => {
  if (isActionDisabled.value) return;
  isConfirmDialogVisible.value = true;
};

const updateDeliveryStatus = async () => {
  if (!nextDeliveryStatus.value) return;
  const requestBody: { deliveryStatus: string; customerStatus?: string } = {
    deliveryStatus: nextDeliveryStatus.value
  };
  if (nextDeliveryStatus.value === 'on_the_way') {
    requestBody.customerStatus = 'on_the_way';
  }

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
          body: requestBody,
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
  title: '外送任務狀態',
});
</script>