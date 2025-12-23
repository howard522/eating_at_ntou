<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">我的訂單</h1>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="inProgress" class="font-weight-bold">未完成</v-tab>
      <v-tab value="completed" class="font-weight-bold">已完成</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="inProgress">
        <v-row>
          <v-col
              v-for="order in inProgressOrders"
              :key="order.id"
              cols="12"
              md="6"
              lg="4"
          >
            <OrderCard
                role="customer"
                :order="order"
                :path="`/customer/order-state/${order.id}`"
                :has-notification="notificationStore.hasMessage(order.id) || notificationStore.hasStatusUpdate(order.id)"
            />
          </v-col>
          <v-col v-if="inProgressOrders.length === 0" cols="12">
            <p class="text-center text-medium-emphasis mt-10">
              沒有未完成的訂單
            </p>
          </v-col>
        </v-row>
      </v-window-item>

      <v-window-item value="completed">
        <v-row>
          <v-col v-for="order in completedOrders" :key="order.id" cols="12" md="6" lg="4">
            <OrderCard
                role="customer"
                :order="order"
                :path="`/customer/order-state/${order.id}`"
                :has-notification="notificationStore.hasMessage(order.id) || notificationStore.hasStatusUpdate(order.id)"
            />
          </v-col>
          <v-col v-if="completedOrders.length === 0" cols="12">
            <p class="text-center text-medium-emphasis mt-10">
              沒有已完成的訂單
            </p>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { useInfiniteFetch } from '@composable/useInfiniteFetch';
import { useNotificationStore } from '@stores/notification';
import type { ApiOrder, ApiResponse, DisplayOrder } from '@types/order';

const tab = ref('inProgress');
const notificationStore = useNotificationStore();

const { items: rawOrders, fetchItems } = useInfiniteFetch<ApiOrder>({
  api: '/api/orders',
  limit: 7,
  buildQuery: (skip) => ({ role: 'customer', skip, limit: 7 }),
  immediate: true
});

// 監聽通知更新，重新抓取訂單列表
watch(() => notificationStore.lastUpdate, () => {
    fetchItems({ reset: true });
});

const allOrders = computed(() => rawOrders.value.map(order => {
  const restaurantNames = Array.from(
      new Set(order.items.map(item => item.restaurant.name))
  ).join(', ');
  const d = new Date(order.createdAt);
  const date = `${d.getFullYear()}年${(d.getMonth() + 1).toString().padStart(2, '0')}月${d.getDate().toString().padStart(2, '0')}日`;
  const ad = new Date(order.arriveTime);
  const arriveTimeFormatted = `${ad.getHours().toString().padStart(2, '0')}:${ad.getMinutes().toString().padStart(2, '0')}`;
  const displayItems = order.items.map(item => ({
    name: item.name,
    quantity: item.quantity
  }));
  return {
    id: order._id,
    restaurantNames: restaurantNames,
    date: date,
    items: displayItems,
    total: order.total,
    status: order.customerStatus!,
    arriveTime: arriveTimeFormatted,
  };
}));

const inProgressStatuses = ['preparing', 'on_the_way', 'received'];
const completedStatuses = ['completed'];

const inProgressOrders = computed(() =>
    allOrders.value.filter(order => inProgressStatuses.includes(order.status))
);
const completedOrders = computed(() =>
    allOrders.value.filter(order => completedStatuses.includes(order.status))
);

useHead({
  title: '我的訂單',
});
</script>

<style scoped>
</style>