<template>
  <v-container class="fill-height align-start bg-grey-lighten-4 pa-0 pa-md-4" fluid>
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">

        <div class="d-flex align-center mb-8 px-2">
          <v-btn
              icon="mdi-arrow-left"
              variant="text"
              color="grey-darken-2"
              size="large"
              class="mr-4"
              @click="$router.back()"
          ></v-btn>
          <div>
            <h1 class="text-h3 font-weight-bold text-grey-darken-3">訂單詳情</h1>
            <p class="text-h6 text-grey-darken-1 mt-1">
              訂單編號 #{{ orderId.slice(-6).toUpperCase() }}
            </p>
          </div>
          <v-spacer></v-spacer>
          <v-chip
              v-if="orderData"
              :color="getStatusColor(currentStep)"
              class="font-weight-bold px-6"
              size="x-large"
              label
          >
            {{ steps[currentStep - 1]?.title }}
          </v-chip>
        </div>

        <div v-if="pending" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="80"></v-progress-circular>
          <p class="text-h5 mt-6 text-grey-darken-1">正在讀取資料...</p>
        </div>

        <v-alert
            v-else-if="error || !orderData"
            type="error"
            title="載入失敗"
            text="無法讀取訂單資訊，請檢查訂單 ID 或網路連線。"
            variant="tonal"
            border="start"
            class="mt-4 mx-2"
            icon="mdi-alert"
            prominent
        ></v-alert>

        <template v-else>

          <v-card class="mb-8 rounded-lg border-none elevation-2">
            <v-card-text class="pt-8 pb-6 px-6">
              <v-stepper
                  v-model="currentStep"
                  alt-labels
                  flat
                  class="elevation-0"
                  bg-color="transparent"
              >
                <v-stepper-header>
                  <template v-for="(step, index) in steps" :key="step.id">
                    <v-stepper-item
                        :title="step.title"
                        :value="step.id"
                        :complete="step.id < currentStep || currentStep === 5"
                        :color="getStepColor(step.id)"
                        :error="orderData.customerStatus === 'cancelled'"
                    >
                      <template v-slot:icon>
                        <v-icon v-if="orderData.customerStatus === 'cancelled'">mdi-close</v-icon>
                        <v-icon v-else size="large">{{ step.icon }}</v-icon>
                      </template>

                      <template v-slot:title>
                        <div class="text-h6 font-weight-bold mt-2">{{ step.title }}</div>
                      </template>
                    </v-stepper-item>
                    <v-divider v-if="index < steps.length - 1" :thickness="3"></v-divider>
                  </template>
                </v-stepper-header>
              </v-stepper>
            </v-card-text>
          </v-card>

          <v-row>
            <v-col cols="12" md="6">
              <v-card class="mb-4 rounded-lg h-100 elevation-2">
                <v-card-title class="d-flex align-center text-h5 font-weight-bold text-grey-darken-3 bg-grey-lighten-5 py-4 px-6">
                  <v-icon start color="primary" size="large" class="mr-3">mdi-account-details</v-icon>
                  顧客與配送資訊
                </v-card-title>
                <v-divider></v-divider>
                <v-list lines="two" class="py-4 px-2">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-avatar color="blue-lighten-5" size="56" class="mr-4">
                        <v-icon color="blue" size="32">mdi-account</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-h6 font-weight-bold mb-1">下單帳號</v-list-item-title>
                    <v-list-item-subtitle class="text-subtitle-1 text-high-emphasis">
                      {{ orderData.user.name }}
                      <span class="text-medium-emphasis text-body-1">({{ orderData.user.email }})</span>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-divider inset class="my-4"></v-divider>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-avatar color="purple-lighten-5" size="56" class="mr-4">
                        <v-icon color="purple" size="32">mdi-map-marker</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-h6 font-weight-bold mb-1">收件人資訊</v-list-item-title>
                    <v-list-item-subtitle class="mt-1">
                      <div class="text-h6 text-high-emphasis font-weight-bold mb-1">
                        {{ orderData.deliveryInfo.contactName }} &nbsp; {{ orderData.deliveryInfo.contactPhone }}
                      </div>
                      <div class="text-subtitle-1 text-high-emphasis text-wrap mb-2">
                        {{ orderData.deliveryInfo.address }}
                      </div>
                      <div v-if="orderData.deliveryInfo.note" class="mt-2 text-subtitle-1 text-orange-darken-3 bg-orange-lighten-5 px-3 py-2 rounded d-inline-block font-weight-medium">
                        <v-icon start size="small" icon="mdi-note-text-outline"></v-icon>
                        備註: {{ orderData.deliveryInfo.note }}
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card class="mb-4 rounded-lg h-100 elevation-2">
                <v-card-title class="d-flex align-center text-h5 font-weight-bold text-grey-darken-3 bg-grey-lighten-5 py-4 px-6">
                  <v-icon start color="orange-darken-2" size="large" class="mr-3">mdi-moped</v-icon>
                  外送員資訊
                </v-card-title>
                <v-divider></v-divider>

                <div v-if="orderData.deliveryPerson" class="pa-6">
                  <div class="d-flex align-center">
                    <v-avatar size="80" class="mr-6 border">
                      <v-img :src="orderData.deliveryPerson.img" cover>
                        <template #error>
                          <v-icon size="40" color="grey">mdi-account</v-icon>
                        </template>
                      </v-img>
                    </v-avatar>
                    <div>
                      <div class="text-h5 font-weight-bold mb-2">{{ orderData.deliveryPerson.name }}</div>
                      <div class="text-h6 text-grey-darken-3 d-flex align-center mb-2">
                        <v-icon size="medium" class="mr-2">mdi-phone</v-icon>
                        {{ orderData.deliveryPerson.phone }}
                      </div>
                      <v-chip size="default" color="success" variant="elevated" label class="font-weight-bold">
                        <v-icon start>mdi-check</v-icon> 已指派
                      </v-chip>
                    </div>
                  </div>
                </div>

                <div v-else class="fill-height d-flex flex-column align-center justify-center pa-10 text-center" style="min-height: 200px;">
                  <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-moped-outline</v-icon>
                  <p class="text-h6 text-grey">目前尚未指派外送員</p>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-card class="mb-8 mt-10 rounded-lg elevation-2">
            <v-card-title class="text-h5 font-weight-bold text-grey-darken-3 bg-grey-lighten-5 py-4 px-6">
              配送路徑概覽
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-0" style="height: 400px; position: relative;">
              <DeliveryMap
                  :driver-position="courierPosition"
                  :customer-position="customerPosition"
                  :restaurant-positions="restaurantPositions"
              />
            </v-card-text>
          </v-card>

          <v-card class="mb-8 rounded-lg elevation-2">
            <v-card-title class="d-flex align-center text-h5 font-weight-bold text-grey-darken-3 bg-grey-lighten-5 py-4 px-6">
              <v-icon start color="red-lighten-1" size="large" class="mr-3">mdi-receipt-text</v-icon>
              訂單內容詳情
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text class="pa-0">
              <v-table>
                <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-left pl-8 py-4 text-h6 font-weight-bold">品項</th>
                  <th class="text-left py-4 text-h6 font-weight-bold">餐廳資訊</th>
                  <th class="text-right pr-8 py-4 text-h6 font-weight-bold">價格</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in orderData.items" :key="item._id">
                  <td class="pl-8 py-4" style="vertical-align: top;">
                    <div class="text-h6 font-weight-bold text-high-emphasis">{{ item.name }}
                      <span class="text-subtitle-1 text-grey-darken-1 mt-1">x {{ item.quantity }}</span>
                    </div>
                  </td>

                  <td class="py-4" style="vertical-align: top;">
                    <div class="text-h6 font-weight-bold text-grey-darken-3">
                      {{ item.restaurant?.name }}
                    </div>
                    <div class="text-subtitle-1 text-grey-darken-2 mt-1 d-flex align-center">
                      <v-icon size="small" class="mr-2 mt-1" color="grey">mdi-map-marker</v-icon>
                      {{ item.restaurant?.address }} &nbsp;
                      <v-icon size="small" class="mr-2" color="grey">mdi-phone</v-icon>
                      {{ item.restaurant?.phone }}
                    </div>
                  </td>

                  <td class="text-right pr-8 py-4 font-weight-bold text-h6" style="vertical-align: top;">
                    ${{ item.price * item.quantity }}
                  </td>
                </tr>
                </tbody>
              </v-table>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-text class="pa-8 bg-grey-lighten-5">
              <v-row dense justify="end">
                <v-col cols="6" sm="4" md="3" class="text-right text-h6 text-grey-darken-1">小計:</v-col>
                <v-col cols="6" sm="4" md="3" class="text-right text-h6 font-weight-bold">${{ orderData.total - orderData.deliveryFee }}</v-col>
              </v-row>
              <v-row dense justify="end" class="mt-2">
                <v-col cols="6" sm="4" md="3" class="text-right text-h6 text-grey-darken-1">運費:</v-col>
                <v-col cols="6" sm="4" md="3" class="text-right text-h6 font-weight-bold">${{ orderData.deliveryFee }}</v-col>
              </v-row>
              <v-divider class="my-4 border-opacity-25" color="black"></v-divider>
              <v-row dense justify="end" align="center">
                <v-col cols="6" sm="4" md="3" class="text-right text-h5 font-weight-bold text-grey-darken-3">總計:</v-col>
                <v-col cols="6" sm="4" md="3" class="text-right text-h4 font-weight-black text-green-darken-3">NT$ {{ orderData.total }}</v-col>
              </v-row>
            </v-card-text>
          </v-card>

        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useOrderTracking } from '@composable/useOrderTracking';
import { useUserStore } from '@stores/user';

interface ApiOrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  restaurant: {
    id: string;
    name: string;
    phone: string;
    address: string;
    location?: { lat: number; lng: number };
  };
}

interface ApiOrder {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  deliveryPerson: {
    _id: string;
    name: string;
    img: string;
    phone: string;
  } | null;
  items: ApiOrderItem[];
  total: number;
  deliveryFee: number;
  currency: string;
  arriveTime: string;
  deliveryInfo: {
    address: string;
    contactName: string;
    contactPhone: string;
    note: string;
    location?: { lat: number; lng: number };
  };
  customerStatus: string;
  deliveryStatus: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: ApiOrder[];
}

type LatLng = [number, number];

const route = useRoute();
const userStore = useUserStore();
const orderId = route.params.id as string;

const steps = [
  { id: 1, title: '等待接單', icon: 'mdi-store-clock-outline' },
  { id: 2, title: '準備中', icon: 'mdi-chef-hat' },
  { id: 3, title: '已送達', icon: 'mdi-map-marker-check' },
  { id: 4, title: '已接收', icon: 'mdi-hand-shake' },
  { id: 5, title: '已完成', icon: 'mdi-check-circle' },
];

const { data: response, pending, error } = await useFetch<ApiResponse>('/api/admin/orders', {
  method: 'GET',
  query: { orderId: orderId },
  headers: {
    'Authorization': `Bearer ${userStore.token}`,
    'Accept': 'application/json',
  },
});

const orderData = computed(() => {
  if (response.value && response.value.success && response.value.data.length > 0) {
    return response.value.data[0];
  }
  return null;
});

const currentStep = computed(() => {
  if (!orderData.value) return 1;
  const cStatus = orderData.value.customerStatus;
  const dStatus = orderData.value.deliveryStatus;

  if (cStatus === 'completed') return 5;
  if (cStatus === 'received') return 4;
  if (dStatus === 'delivered') return 3;
  if (dStatus === 'on_the_way') return 2;
  if (cStatus === 'preparing') return 1;
  return 1;
});

const toLatLng = (location?: { lat?: number; lng?: number } | null): LatLng | null => {
  if (!location) return null;
  if (typeof location.lat === 'number' && typeof location.lng === 'number') {
    return [location.lat, location.lng];
  }
  return null;
};

const customerPosition = computed<LatLng | null>(() => {
  return toLatLng(orderData.value?.deliveryInfo?.location);
});

const restaurantPositions = computed<LatLng[]>(() => {
  if (!orderData.value?.items) return [];
  const seen = new Set<string>();
  const positions: LatLng[] = [];
  orderData.value.items.forEach((item) => {
    const loc = toLatLng(item.restaurant?.location);
    if (loc) {
      const key = loc.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        positions.push(loc);
      }
    }
  });
  return positions;
});

const { driverPosition: courierPosition } = useOrderTracking(orderId);

const getStepColor = (stepId: number) => {
  if (currentStep.value === 5) return 'success';
  if (stepId === currentStep.value) return 'primary';
  if (stepId < currentStep.value) return 'success';
  return undefined;
};

const getStatusColor = (step: number) => {
  if (step === 5) return 'success';
  if (step === 4) return 'purple';
  if (step === 3) return 'info';
  if (step === 2) return 'orange-darken-2';
  return 'grey-darken-1';
};

useHead({
  title: '訂單詳情',
});
</script>

<style scoped>

</style>