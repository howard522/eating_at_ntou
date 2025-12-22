<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">確認訂單</h1>

    <v-row>
      <v-col cols="12" md="7">
        <v-card flat border class="mb-6">
          <v-card-title class="text-h6">外送詳細資訊</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <div class="mb-4">
                <p class="text-caption text-medium-emphasis">外送地址</p>
                <v-text-field
                    v-model="localDeliveryAddress"
                    class="mt-1"
                    :rules="addressRules"
                    validate-on="blur"
                    @blur="updateDetailsInStore"
                ></v-text-field>
              </div>
              <div class="mb-4">
                <p class="text-caption text-medium-emphasis">聯絡人暱稱</p>
                <v-text-field
                    v-model="localReceiveName"
                    class="mt-1"
                    :rules="[(value: string) => !!value || '聯絡人暱稱為必填。']"
                    validate-on="blur"
                    @blur="updateDetailsInStore"
                ></v-text-field>
              </div>
              <div class="mb-4">
                <p class="text-caption text-medium-emphasis">聯絡電話</p>
                <v-text-field
                    v-model="localPhoneNumber"
                    class="mt-1"
                    :rules="phoneRules"
                    validate-on="blur"
                    @blur="updateDetailsInStore"
                ></v-text-field>
              </div>
              <div class="mb-4">
                <p class="text-caption text-medium-emphasis">備註</p>
                <v-text-field
                    v-model="localNote"
                    class="mt-1"
                    @blur="updateDetailsInStore"
                ></v-text-field>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
        <v-card flat border>
          <v-card-title class="text-h6">付款方式</v-card-title>
          <v-card-text>
            <v-select
                v-model="paymentMethod"
                :items="paymentOptions"
                variant="outlined"
                hide-details
            ></v-select>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="text-h6 border-b">訂單摘要</v-card-title>
          <v-card-text>
            <v-list lines="two" bg-color="transparent">
              <v-list-item v-for="item in items" :key="item._id" class="mb-2">
                <template v-slot:prepend>
                  <v-img
                      :src="item.image"
                      width="56"
                      height="56"
                      class="rounded me-4"
                      cover
                  >
                    <template #error>
                      <v-sheet
                          class="d-flex align-center justify-center fill-height rounded"
                          style="background-color: #f8e8ee"
                      >
                        <span
                            class="text-h6 font-weight-bold"
                            style="color: #e0b4c3"
                        >???</span
                        >
                      </v-sheet>
                    </template>
                  </v-img>
                </template>

                <v-list-item-title class="font-weight-medium"> {{ item.name }} </v-list-item-title>
                <v-list-item-subtitle>{{ item.restaurantName  }} </v-list-item-subtitle>

                <template v-slot:append>
                  <span class="text-body-1 ms-2"> ${{ item.price }} x {{ item.quantity }} </span>
                </template>
              </v-list-item>
            </v-list>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-space-between mt-4">
              <p class="text-body-1 text-medium-emphasis">餐點小計</p>
              <p class="text-body-1 font-weight-medium">$ {{ totalPrice }}</p>
            </div>
            <div class="d-flex justify-space-between mt-2">
              <p class="text-body-1 text-medium-emphasis">外送費</p>
              <p class="text-body-1 font-weight-medium">$ {{ deliveryFee }}</p>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-space-between">
              <p class="text-h6 font-weight-bold">訂單總金額</p>
              <p class="text-h6 font-weight-bold">$ {{ total }}</p>
            </div>

            <div class="d-flex justify-space-between mt-2">
              <p class="text-h6 font-weight-bold">預計送達時間</p>
              <p class="text-h6 font-weight-bold">
                {{ estimatedDeliveryTime }}
              </p>
            </div>
            <v-btn
                color="primary"
                block
                size="large"
                class="mt-6"
                :disabled="!isFormValid || loading"
                @click="submitOrder"
            >
              <span class="text-h6 font-weight-bold">確認送出訂單</span>
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { useCartStore } from '@stores/cart';
import { useUserStore } from '@stores/user';
import { useSnackbarStore } from '@utils/snackbar';

const cartStore = useCartStore();
const userStore = useUserStore();
const isFormValid = ref(false);
const loading = ref(false);
const snackbarStore = useSnackbarStore()

const localDeliveryAddress = ref(cartStore.deliveryAddress);
const localPhoneNumber = ref(cartStore.phoneNumber);
const localReceiveName = ref(cartStore.receiveName);
const localNote = ref(cartStore.note);
const items = computed(() => cartStore.items);
const totalPrice = computed(() => cartStore.totalPrice);
const deliveryFee = computed(() => cartStore.deliveryFee);
let timer: ReturnType<typeof setInterval> | null = null;

// 目前只有現場付款
const paymentMethod = ref('現場付款');
const paymentOptions = ['現場付款'];

function updateDetailsInStore() {
  cartStore.setDeliveryDetails({
    address: localDeliveryAddress.value,
    phone: localPhoneNumber.value,
    receiveName: localReceiveName.value,
    note: localNote.value,
  });
}

const addressRules = [
  (value: string) => !!value || '外送地址為必填欄位。',
  (value: string) => {
    const regex = /(?<zipcode>(^\d{5}|^\d{3})?)(?<city>\D+[縣市])(?<district>\D+?(市區|鎮區|鎮市|[鄉鎮市區]))(?<others>.+)/;
    return regex.test(value) || '地址格式不正確，請輸入完整地址。';
  },
];

const phoneRules = [
  (value: string) => !!value || '聯絡電話為必填欄位。',
  (value: string) => {
    const regex = /^0\d{9}$/;
    return regex.test(value) || '請輸入有效的 10 位號碼 (格式為 0xxxxxxxxx)。';
  },
];

const estimatedDeliveryTime = computed(() => {
  const date = cartStore.arriveTime;
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours} : ${minutes}`;
});

const updateArriveTime = () => {
  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + 30);
  cartStore.arriveTime = futureDate;
};

const total = computed(() => {
  return totalPrice.value + deliveryFee.value;
});

const submitOrder = async () => {
  updateDetailsInStore();
  loading.value = true;
  try {
    const response = await $fetch<{ success: boolean, data: { _id: string } }>('/api/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'application/json',
      },
      body: {
        deliveryInfo: {
          address: cartStore.deliveryAddress,
          contactName: cartStore.receiveName,
          contactPhone: cartStore.phoneNumber,
          note: cartStore.note,
        },
        deliveryFee: cartStore.deliveryFee,
        arriveTime: cartStore.arriveTime.toISOString(),
      },
    });
    if (response && response.data && response.data._id) {
      const orderId = response.data._id;
      snackbarStore.showSnackbar('訂單已送出', 'success')
      cartStore.clearCart();
      const router = useRouter();
      router.push(`/customer/order-state/${orderId}`);
    }
    else {
      console.error('創建訂單異常：', response);
      snackbarStore.showSnackbar('創建訂單異常，請稍後再試', 'error')
    }
  }
  catch (e) {
    console.error('創建訂單失敗:', e);
    snackbarStore.showSnackbar('創建訂單失敗，請稍後再試', 'error')
  }
  finally {
    loading.value = false
  }
};

const form = ref();

onMounted(() => {
  updateArriveTime();
  timer = setInterval(updateArriveTime, 60 * 1000);
  if (cartStore.items.length === 0) {
    cartStore.fetchCart();
  }
  form.value.validate();
});
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

useHead({
  title: '確認訂單',
});
</script>

<style scoped>

</style>
