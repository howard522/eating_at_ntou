<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">待接單：顧客訂單列表</h1>

    <v-row>
      <v-col cols="12" sm="4" md="3">
        <v-select
            v-model="sortOption"
            :items="sortItems"
            item-title="title"
            item-value="value"
            label="排序"
            variant="outlined"
            density="compact"
            hide-details
        ></v-select>
      </v-col>
      <v-col cols="12" sm="4" md="3">
        <v-select
            v-model="filterOption"
            :items="restaurantList"
            item-title="title"
            item-value="value"
            label="篩選"
            variant="outlined"
            density="compact"
            hide-details
        ></v-select>
      </v-col>
    </v-row>

    <v-row v-if="pending" class="mt-10">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4 text-medium-emphasis">正在載入可接訂單...</p>
      </v-col>
    </v-row>

    <v-row v-else-if="error" class="mt-10">
      <v-col cols="12" class="text-center text-red-darken-2">
        <v-icon size="60">mdi-alert-circle-outline</v-icon>
        <p class="mt-4 text-h6">載入訂單失敗</p>
        <p class="text-medium-emphasis">{{ error.message }}</p>
      </v-col>
    </v-row>

    <v-row v-else class="mt-6">
      <v-col v-if="sortedOrders.length === 0" cols="12">
        <p class="text-center text-medium-emphasis mt-10">
          目前沒有可接的訂單
        </p>
      </v-col>
      <v-col
          v-else
          v-for="order in sortedOrders"
          :key="order.id"
          cols="12"
          md="10"
          lg="8"
          class="mx-auto"
      >
        <CustomerOrderCard :order="order" />
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '../../../../stores/user';

interface ApiOrderItem {
  restaurant: { id: string; name: string; };
}
interface ApiOrder {
  _id: string;
  items: ApiOrderItem[];
  deliveryFee: number;
  deliveryInfo: { address: string; };
  createdAt: string;
  arriveTime: string;
}
interface ApiResponse {
  success: boolean;
  data: ApiOrder[];
}
interface DisplayOrder {
  id: string;
  restaurantNameDisplay: string;
  restaurantNamesArray: string[];
  deliveryAddress: string;
  deliveryFee: number;
  deliveryTime: string;
  createdAt: string;
}

const userStore = useUserStore();
const allOrders = ref<DisplayOrder[]>([]);
const pending = ref(true);
const error = ref<Error | null>(null);

const sortOption = ref('newest');
const filterOption = ref('all');

const sortItems = [
  { title: '最新發佈', value: 'newest' },
  { title: '最高外送費', value: 'deliveryFee' },
  { title: '最早送達時間', value: 'deliveryTime' },
];


const fetchAvailableOrders = async () => {
  if (!userStore.token) {
    error.value = new Error('請先登入');
    pending.value = false;
    return;
  }
  pending.value = true;
  error.value = null;
  try {
    const response = await $fetch<ApiResponse>('/api/orders/available', {
      headers: { 'Authorization': `Bearer ${userStore.token}` }
    });

    if (!response.success) throw new Error('無法取得可接訂單');

    allOrders.value = response.data.map(order => {
      const uniqueNamesArray = Array.from(
          new Set(order.items.map(item => item.restaurant.name))
      );
      return {
        id: order._id,
        restaurantNameDisplay: uniqueNamesArray.join(', '),
        restaurantNamesArray: uniqueNamesArray,
        deliveryAddress: order.deliveryInfo.address,
        deliveryFee: order.deliveryFee,
        deliveryTime: order.arriveTime,
        createdAt: order.createdAt
      };
    });
  } catch (err: any) {
    console.error('Error:', err);
    error.value = err;
  } finally {
    pending.value = false;
  }
};

// 篩選
const restaurantList = computed(() => {
  const allIndividualNames = new Set<string>();
  allOrders.value.forEach(order => {
    order.restaurantNamesArray.forEach(name => {
      allIndividualNames.add(name);
    });
  });

  const list = Array.from(allIndividualNames).map(name => ({
    title: name,
    value: name
  }));
  return [
    { title: '所有餐廳', value: 'all' },
    ...list
  ];
});
const filteredOrders = computed(() => {
  if (filterOption.value === 'all') {
    return allOrders.value;
  }
  return allOrders.value.filter(order =>
      order.restaurantNamesArray.includes(filterOption.value)
  );
});

// 排序
const sortedOrders = computed(() => {
  const sorted = [...filteredOrders.value];

  switch (sortOption.value) {
    // 最高外送費
    case 'deliveryFee':
      return sorted.sort((a, b) => b.deliveryFee - a.deliveryFee);
    // 最早送達
    case 'deliveryTime':
      return sorted.sort((a, b) =>
          new Date(a.deliveryTime).getTime() - new Date(b.deliveryTime).getTime()
      );
    // 最新發佈
    case 'newest':
    default:
      return sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
});

onMounted(() => {
  fetchAvailableOrders();
});

useHead({ title: '瀏覽可接訂單' });

</script>

<style scoped>

</style>