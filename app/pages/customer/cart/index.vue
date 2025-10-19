<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">您的購物冰箱</h1>

    <v-row
        v-if="!cartStore.items || cartStore.items.length === 0"
        justify="center"
        align="center"
        style="min-height: 60vh;"
    >
      <v-col cols="12" class="text-center">
        <v-icon size="80" color="grey-lighten-1">mdi-fridge-off</v-icon>
        <p class="mt-6 text-h5 text-grey">您的購物冰箱是空的</p>
        <v-btn to="/customer/stores" color="primary" size="large" class="mt-8">去逛逛</v-btn>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" md="8">
        <div>
          <div v-for="(group, restaurantName) in groupedCart" :key="restaurantName" class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4">{{ restaurantName }}</h2>

            <v-card variant="flat" class="border rounded-lg">
              <template v-for="(item, index) in group" :key="item._id">
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
                    <v-btn icon="mdi-minus" size="small" variant="text" @click="cartStore.updateItemQuantity(item._id, item.quantity - 1)"></v-btn>
                    <span class="mx-3 font-weight-bold">{{ item.quantity }}</span>
                    <v-btn icon="mdi-plus" size="small" variant="text" @click="cartStore.updateItemQuantity(item._id, item.quantity + 1)"></v-btn>
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
            style="position: sticky; top: 80px;"
        >
          <v-card-title class="text-h6 font-weight-bold border-b pa-5">
            訂單摘要
          </v-card-title>

          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1">餐點小計</span>
              <span class="text-body-1">$ {{ cartStore.totalPrice }}</span>
            </div>

            <div class="d-flex justify-space-between text-medium-emphasis">
              <span class="text-body-1">外送費</span>
              <span class="text-body-1">$ {{ deliveryFee }}</span>
            </div>

            <v-divider class="my-5"></v-divider>

            <div class="d-flex justify-space-between align-center">
              <span class="text-h6 font-weight-bold">訂單總金額</span>
              <span class="text-h5 font-weight-bold text-primary">$ {{ finalTotal }}</span>
            </div>
          </v-card-text>

          <div class="pa-4">
            <v-btn color="primary" block size="large" variant="flat">
              前往結帳
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCartStore, type CartItem } from '../../../../stores/cart';

const cartStore = useCartStore();

// 外送費計算方式可能要改
const deliveryFee = ref(30);

const finalTotal = computed(() => cartStore.totalPrice + deliveryFee.value);

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

useHead({
  title: '您的購物車'
});
</script>