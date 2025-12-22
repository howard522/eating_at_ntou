<template>
  <v-container style="max-width: 768px">
    <v-row justify="center" class="my-lg-10">
      <v-col cols="12">
        <div v-if="pending" key="loading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="text-h6 mt-4">正在載入訂單...</p>
        </div>
        <v-alert
            v-else-if="error || !orderData"
            key="error"
            type="error"
            title="載入失敗"
            text="無法讀取訂單資訊，可能此訂單已被接受或不存在。"
            variant="outlined"
            prominent
            class="mt-10"
        ></v-alert>

        <template v-else key="content">
          <v-card flat border rounded="xl">
            <v-card-title class="text-h5 font-weight-bold pt-6 px-6">
              新訂單 #{{ shortId }}
            </v-card-title>

            <v-card-text class="pl-6 pr-6">
              <div class="text-subtitle-1 font-weight-bold mb-1">訂單詳細資訊</div>
              <v-divider class="mb-4"></v-divider>

              <v-row> <v-col cols="12" sm="4" class="text-body-2 text-medium-emphasis pb-0 pb-sm-3">取餐餐廳</v-col>
                <v-col cols="12" sm="8">
                  <div
                      v-for="(restaurant, index) in uniqueRestaurants"
                      :key="restaurant.id"
                      :class="index > 0 ? 'mt-1' : ''" >
                    <div class="text-body-1 text-primary-darken-1 font-weight-bold">
                      {{ restaurant.name }}
                      <div class="text-body-1 font-weight-regular text-primary-darken-1 ms-1">
                        {{ restaurant.address || '無地址資訊' }}
                        <span class="text-body-1 font-weight-regular text-primary-darken-1 ms-1">
                        {{ restaurant.phone }}
                      </span>
                      </div>
                    </div>
                  </div>
                  <div v-if="uniqueRestaurants.length === 0" class="text-body-1 text-primary-darken-1 font-weight-bold">
                    未知
                  </div>
                </v-col>
              </v-row>
              <v-row align="center"> <v-col cols="12" sm="4" class="text-body-2 text-medium-emphasis pb-0 pb-sm-3">外送地點</v-col>
                <v-col cols="12" sm="8">
                  <div class="text-body-1 font-weight-bold text-primary-darken-1">
                    {{ orderData.deliveryInfo.address }}
                  </div>
                </v-col>
              </v-row>

              <v-row align="center"> <v-col cols="12" sm="4" class="text-body-2 text-medium-emphasis pb-0 pb-sm-3">預計送達時間</v-col>
                <v-col cols="12" sm="8">
                  <div class="text-body-1 font-weight-bold text-primary-darken-1">
                    {{ formattedArriveTime }}
                  </div>
                </v-col>
              </v-row>

              <v-row align="center"> <v-col cols="12" sm="4" class="text-body-2 text-medium-emphasis pb-0 pb-sm-3">顧客暱稱</v-col>
                <v-col cols="12" sm="8">
                  <div class="text-body-1 font-weight-bold text-primary-darken-1">
                    {{ maskedCustomerName }}
                  </div>
                </v-col>
              </v-row>

              <v-row align="center"> <v-col cols="12" sm="4" class="text-body-2 text-medium-emphasis pb-0 pb-sm-3">顧客電話</v-col>
                <v-col cols="12" sm="8">
                  <div class="text-body-1 font-weight-bold text-primary-darken-1">
                    {{ maskedCustomerPhone }}
                  </div>
                </v-col>
              </v-row> <v-divider class="mt-2 mb-7"></v-divider>

              <div class="text-subtitle-1 font-weight-bold mb-1">訂單內容</div>
              <v-divider class="mb-4"></v-divider>

              <v-list dense lines="one" bg-color="transparent">
                <v-list-item
                    v-for="item in orderData.items"
                    :key="item._id"
                    class="px-0"
                >
                  <v-list-item-title>
                    {{ item.name}} ({{ item.restaurant?.name }}) x {{ item.quantity }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>

              <v-divider class="mt-2 mb-4"></v-divider>

              <div class="text-right">
                <span class="text-body-1">外送費：</span>
                <span class="text-h6 font-weight-bold text-success">
                  {{ orderData.deliveryFee }} 元
                </span>
              </div>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-btn
                  block
                  size="x-large"
                  color="primary"
                  variant="flat"
                  :loading="isAccepting"
                  @click="acceptOrder"
              >
                <v-icon left class="me-2">mdi-check</v-icon>
                <span class="text-h6 font-weight-bold">立即接單</span>
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>

        <v-dialog v-model="isPhoneMissing" max-width="450" persistent>
          <v-card>
            <v-card-title class="text-h5 font-weight-bold">
              請先填寫聯絡電話
            </v-card-title>
            <v-card-text>
              為了確保訂單順利，您必須先在「我的帳戶」頁面中填寫您的電話號碼，然後才能開始接單。
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                  text="取消"
                  @click="isPhoneMissing = false"
              ></v-btn>
              <v-btn
                  color="primary"
                  text="前往我的帳戶"
                  @click="goToAccount"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user';
import { useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const orderId = route.params.id as string;
const userStore = useUserStore();
const isAccepting = ref(false);
const isPhoneMissing = ref(false);

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

const shortId = computed(() => {
  return orderData.value?._id.slice(-6).toUpperCase() || '...';
});

const uniqueRestaurants = computed(() => {
  if (!orderData.value?.items || orderData.value.items.length === 0) {
    return [];
  }
  const restaurantMap = new Map<string, { id: string, name: string, phone: string, address: string }>();
  for (const item of orderData.value.items) {
    if (item.restaurant && !restaurantMap.has(item.restaurant.id)) {
      restaurantMap.set(item.restaurant.id, {
        id: item.restaurant.id,
        name: item.restaurant.name,
        phone: item.restaurant.phone,
        address: item.restaurant.address,
      });
    }
  }
  return Array.from(restaurantMap.values());
});

const formattedArriveTime = computed(() => {
  if (!orderData.value?.arriveTime) return '未知';
  const ad = new Date(orderData.value.arriveTime);
  return `${(ad.getMonth() + 1).toString().padStart(2, '0')}/${ad.getDate().toString().padStart(2, '0')} ${ad.getHours().toString().padStart(2, '0')}:${ad.getMinutes().toString().padStart(2, '0')}`;
});

const maskedCustomerName = computed(() => {
  const name = orderData.value?.deliveryInfo?.contactName;
  if (!name) return '***';
  return name.charAt(0) + '*'.repeat(name.length - 1);
});

const maskedCustomerPhone = computed(() => {
  const phone = orderData.value?.deliveryInfo?.contactPhone;
  if (!phone) return 'XXXXXXXXXX';
  return phone.substring(0, 4) + 'XXXXXX';
});


const acceptOrder = async () => {
  if (!userStore.info || !userStore.info.phone || userStore.info.phone === '無法取得用戶電話') {
    isPhoneMissing.value = true;
    return;
  }
  isAccepting.value = true;
  try {
    const response: any = await $fetch(
        `/api/orders/${orderId}/accept`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${userStore.token}`,
            'Content-Type': 'application/json',
          },
        }
    );

    if (response.success) {
      await router.push(`/delivery/customer-order-state/${orderId}`);
    } else {
      console.error('Failed to accept order', response);
      error.value = new Error('接單失敗');
    }
  } catch (err) {
    console.error('Error accepting order', err);
    error.value = new Error('接單時發生錯誤。');
  } finally {
    isAccepting.value = false;
  }
};

const goToAccount = () => {
  isPhoneMissing.value = false;
  router.push('/profile');
};

useHead({
  title: '訂單詳細資訊'
});
</script>

<style scoped>

</style>
