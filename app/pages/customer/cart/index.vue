<template>
  <v-container>
    <h1 v-if="cartStore.items && cartStore.items.length > 0" class="text-h4 font-weight-bold mb-6">您的購物冰箱</h1>

    <v-row
        v-if="!cartStore.items || cartStore.items.length === 0"
        justify="center"
        align="center"
        style="min-height: 60vh;"
    >
      <v-col cols="12" class="text-center">
        <v-icon size="80" color="grey-lighten-1">mdi-fridge-off</v-icon>
        <p class="mt-6 text-h5 text-grey">您的購物冰箱空空如也</p>
        <v-btn to="/customer/stores" color="primary" size="large" class="mt-8">塞滿它！</v-btn>
      </v-col>
    </v-row>

    <v-row v-else align="start">
      <v-col cols="12" md="8">
        <div>
          <div v-for="(group, restaurantName) in groupedCart" :key="restaurantName" class="mb-8">
            <div class="d-flex align-center justify-space-between mb-1">
              <h2 class="text-h5 font-weight-bold restaurant-name mb-0">{{ restaurantName }}</h2>
              <v-btn
                color="error"
                variant="text"
                density="comfortable"
                prepend-icon="mdi-delete-outline"
                @click="removeRestaurant(restaurantName as string)"
              >
                刪除此餐廳
              </v-btn>
            </div>

            <v-card variant="flat" class="border rounded-lg">
              <template v-for="(item, index) in group" :key="item.menuItemId">
                <div class="d-flex align-center pa-4">
                  <v-avatar size="64" rounded="lg" class="mr-4">
                    <v-img :src="item.image" cover>
                      <template #error>
                        <v-sheet class="d-flex align-center justify-center fill-height" style="background-color: #F8E8EE;">
                          <span class="text-h6 font-weight-bold" style="color: #E0B4C3;">???</span>
                        </v-sheet>
                      </template>
                    </v-img>
                  </v-avatar>

                  <div class="flex-grow-1">
                    <div class="font-weight-bold">{{ item.name }}</div>
                    <div class="text-medium-emphasis">${{ item.price }}</div>
                  </div>

                  <div class="d-flex align-center">
                    <v-btn icon="mdi-minus" size="small" variant="text" @click="cartStore.updateItemQuantity(item.menuItemId, item.quantity - 1)"></v-btn>
                    <span class="mx-3 font-weight-bold">{{ item.quantity }}</span>
                    <v-btn icon="mdi-plus" size="small" variant="text" @click="cartStore.updateItemQuantity(item.menuItemId, item.quantity + 1)"></v-btn>
                  </div>
                </div>

                <v-divider v-if="index < group.length - 1"></v-divider>
              </template>

              <v-divider></v-divider>
              <div class="d-flex justify-end align-center pa-4">
                <span class="text-medium-emphasis">小計：</span>
                <span class="font-weight-bold ml-2 text-h6">${{ group.reduce((total, currentItem) => total + (currentItem.price * currentItem.quantity), 0) }}</span>
              </div>
            </v-card>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="4">
        <v-card
            v-if="cartStore.items.length > 0"
            elevation="2"
            rounded="lg"
            class="summary-card">

          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1">餐點小計</span>
              <span class="text-body-1">$ {{ cartStore.totalPrice }}</span>
            </div>

            <div class="d-flex justify-space-between text-medium-emphasis">
              <span class="text-body-1">外送費</span>
              <span class="text-body-1">
                <template v-if="isDeliveryFeePending">將於下個頁面計算</template>
                <template v-else>$ {{ deliveryFee }}</template>
              </span>
            </div>

            <v-divider class="my-5"></v-divider>

            <div class="d-flex justify-space-between align-center">
              <span class="text-h6 font-weight-bold">訂單總金額</span>
              <span class="text-h5 font-weight-bold text-primary">$ {{ finalTotal }}</span>
            </div>
          </v-card-text>

          <div class="pa-4">
            <v-btn to="/customer/payment" color="primary" block size="large" variant="flat">
              前往結帳
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useCartStore, type CartItem } from '@stores/cart';
import { useUserStore } from '@stores/user';

const cartStore = useCartStore();
const userStore = useUserStore(); 

const deliveryFee = computed(() => cartStore.deliveryFee);
const deliveryDistance = ref<number | null>(null);
let deliveryUpdateTimer: ReturnType<typeof setTimeout> | null = null;

const finalTotal = computed(() => cartStore.totalPrice + deliveryFee.value);
const isDeliveryFeePending = computed(() => deliveryFee.value === 30);
const groupedCart = computed(() => {
  return cartStore.items.reduce((groups, item) => {
    const restaurantName = item.restaurantName;
    if (!groups[restaurantName]) {
      groups[restaurantName] = [];
    }
    groups[restaurantName].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);
});

//  刪除該餐廳所有商品
const removeRestaurant = (restaurantName: string) => {
  cartStore.removeRestaurantItems(restaurantName);
};
const fetchDeliveryInfo = async () => {
  const address = cartStore.deliveryAddress?.trim();
  if (!address || cartStore.items.length === 0) return;

  const restaurantIds = Array.from(
    new Set(cartStore.items.map((item) => item.restaurantId).filter(Boolean))
  );
  if (restaurantIds.length === 0) return;

  try {
    const response = await $fetch<{
      data: { distance: number; deliveryFee: number };
    }>("/api/cart/delivery-fee", {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
        Accept: "application/json",
      },
      params: {
        customerAddress: address,
        restaurants: JSON.stringify(restaurantIds),
      },
    });

    if (response?.data) {
      cartStore.setDeliveryFee(response.data.deliveryFee);
      deliveryDistance.value = response.data.distance;
    }
  } catch (error) {
    cartStore.setDeliveryFee(30);
    deliveryDistance.value = null;
  }
};

const scheduleDeliveryInfoUpdate = () => {
  if (deliveryUpdateTimer) {
    clearTimeout(deliveryUpdateTimer);
  }
  deliveryUpdateTimer = setTimeout(() => {
    fetchDeliveryInfo();
  }, 400);
};
useHead({
  title: '您的購物冰箱',
});

onMounted(() => {
  if (cartStore.items.length === 0) {
    cartStore.fetchCart();
  }
  fetchDeliveryInfo();
});
onUnmounted(() => {
  if (deliveryUpdateTimer) {
    clearTimeout(deliveryUpdateTimer);
  }
});

watch(
  [() => cartStore.deliveryAddress, () => cartStore.items],
  scheduleDeliveryInfoUpdate,
  { deep: true }
);
</script>

<style scoped>
.restaurant-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-card {
  position: sticky;
  top: 80px;
  margin-top: 37px;
}

@media (max-width: 960px) {
  .summary-card {
    position: static;
    margin-top: 0;
  }
  
  .text-h4 {
    font-size: 1.75rem !important;
  }
}
</style>
