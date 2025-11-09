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
          >
            <OrderCard role="customer" :order="order" :path="`/customer/order-state/${order.id}`"/>
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
          <v-col v-for="order in completedOrders" :key="order.id" cols="12">
            <OrderCard role="customer" :order="order" :path="`/customer/order-state/${order.id}`"/>
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
import { useUserStore } from "../../../../stores/user"

interface ApiOrderItem {
  menuItemId: string;
  name: string;
  image: string | null;
  info: string;
  price: number;
  quantity: number;
  restaurant: {
    id: string;
    name: string;
  };
}
interface ApiOrder {
  _id: string;
  user: string;
  items: ApiOrderItem[];
  total: number;
  deliveryFee: number;
  customerStatus: 'preparing' | 'on_the_way' | 'received' | 'completed';
  createdAt: string;
  arriveTime: string;
}
interface ApiResponse {
  success: boolean;
  data: ApiOrder[];
}
interface DisplayOrder {
  id: string;
  restaurantNames: string;
  date: string;
  items: {
    name: string;
    quantity: number;
  }[];
  total: number;
  status: string;
  arriveTime: string;
}

const tab = ref('inProgress');
const userStore = useUserStore();
const allOrders = ref<DisplayOrder[]>([]);
const pending = ref(false);
const error = ref<Error | null>(null);

const fetchOrders = async () => {
  if (!userStore.token) {
    console.warn('No user token, skipping order fetch.');
    error.value = new Error('請先登入以查看訂單');
    return;
  }
  pending.value = true;
  error.value = null;
  try {
    const response = await $fetch<ApiResponse>('/api/orders', {
      method: 'GET',
      query: { role: 'customer' },
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Accept': 'application/json',
      }
    });
    if (response && response.success) {
      allOrders.value = response.data.map(order => {
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
          status: order.customerStatus,
          arriveTime: arriveTimeFormatted,
        };
      });
    } else {
      throw new Error('API response indicates failure');
    }
  } catch (err: any) {
    console.error('取得訂單失敗:', err);
    error.value = err;
  } finally {
    pending.value = false;
  }
};

const inProgressStatuses = ['preparing', 'on_the_way', 'received'];
const completedStatuses = ['completed'];

const inProgressOrders = computed(() =>
    allOrders.value.filter(order => inProgressStatuses.includes(order.status))
);
const completedOrders = computed(() =>
    allOrders.value.filter(order => completedStatuses.includes(order.status))
);

onMounted(() => {
  fetchOrders();
});

useHead({
  title: '我的訂單',
});
</script>

<style scoped>

</style>