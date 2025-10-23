<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">確認訂單</h1>

    <v-row>
      <v-col cols="12" md="7">
        <v-card flat border class="mb-6">
          <v-card-title class="text-h6">外送詳細資訊</v-card-title>
          <v-card-text>
            <div class="mb-4">
              <p class="text-caption text-medium-emphasis">外送地址</p>
              <v-text-field
                  v-model="localDeliveryAddress"
                  hide-details
                  class="mt-1"
                  @blur="updateDetailsInStore"
              ></v-text-field>
            </div>
            <div class="mb-4">
              <p class="text-caption text-medium-emphasis">聯絡電話</p>
              <v-text-field
                  v-model="localPhoneNumber"
                  hide-details
                  class="mt-1"
                  @blur="updateDetailsInStore"
              ></v-text-field>
            </div>
            <div class="mb-4">
              <p class="text-caption text-medium-emphasis">聯絡人暱稱</p>
              <v-text-field
                  v-model="localReceiveName"
                  hide-details
                  class="mt-1"
                  @blur="updateDetailsInStore"
              ></v-text-field>
            </div>
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
              <p class="text-body-1 font-weight-medium">$ {{ deliveryFree }}</p>
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
import { useCartStore } from '../../../../stores/cart';

const cartStore = useCartStore();
const localDeliveryAddress = ref(cartStore.deliveryAddress);
const localPhoneNumber = ref(cartStore.phoneNumber);
const localReceiveName = ref(cartStore.receiveName);
const items = computed(() => cartStore.items);
const totalPrice = computed(() => cartStore.totalPrice);
const deliveryFree = computed(() => cartStore.deliveryFree);
// 目前只有現場付款
const paymentMethod = ref('現場付款');
const paymentOptions = ['現場付款'];

function updateDetailsInStore() {
  cartStore.setDeliveryDetails({
    address: localDeliveryAddress.value,
    phone: localPhoneNumber.value,
    receiveName: localReceiveName.value,
  });
}

const getEstimatedTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours} : ${minutes}`;
};
const estimatedDeliveryTime = ref(getEstimatedTime());

const total = computed(() => {
  return totalPrice.value + deliveryFree.value;
});

const submitOrder = () => {
  updateDetailsInStore();
  // 未來會將訂單存入資料庫，並拿到訂單編號
  const id = "trg79s7w4df";
  cartStore.clearCart();
  const router = useRouter();
  router.push(`/customer/order-state/${id}`);
};

useHead({
  title: '確認訂單',
});
</script>

<style scoped>

</style>