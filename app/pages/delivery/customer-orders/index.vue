<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">待接單：顧客訂單列表</h1>
    
    <v-row>
      <v-col cols="12" sm="5" md="4">
        <v-text-field
          v-model="keyword"
          label="搜尋餐廳名稱"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          append-inner-icon="mdi-magnify"
          @keydown.enter="fetchAvailableOrders"
          @click:append-inner="fetchAvailableOrders"
        ></v-text-field>
      </v-col>

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
      <v-col v-if="allOrders.length === 0" cols="12">
        <p class="text-center text-medium-emphasis mt-10">
          目前沒有符合條件的訂單
        </p>
      </v-col>
      <v-col
          v-else
          v-for="order in allOrders" :key="order.id"
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
import { useUserStore } from '@stores/user';

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
  _distance?: number; 
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
  distance?: number;
}

const userStore = useUserStore();
const allOrders = ref<DisplayOrder[]>([]);
const pending = ref(true);
const error = ref<Error | null>(null);
const keyword = ref('');
const sortOption = ref('newest');
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);
const geolocationError = ref<string | null>(null);

const sortItems = [
  { title: '最新發佈', value: 'newest' },
  { title: '最高外送費', value: 'deliveryFee' },
  { title: '最早送達時間', value: 'deliveryTime' },
  { title: '距離最近', value: 'distance' },
];

const sortMap: Record<string, { sortBy: string, order: 'asc' | 'desc' }> = {
  'newest': { sortBy: 'createdAt', order: 'desc' },
  'deliveryFee': { sortBy: 'deliveryFee', order: 'desc' },
  'deliveryTime': { sortBy: 'arriveTime', order: 'asc' },
  'distance': { sortBy: 'distance', order: 'asc' },
};

const fetchAvailableOrders = async () => {
  if (!userStore.token) {
    error.value = new Error('請先登入');
    pending.value = false;
    return;
  }
  pending.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams();
    if (keyword.value) {
      params.append('keyword', keyword.value);
    }
    if (latitude.value && longitude.value) {
      params.append('lat', latitude.value.toString());
      params.append('lon', longitude.value.toString());
    }
    let selectedSort = sortMap[sortOption.value];
    if (selectedSort.sortBy === 'distance' && (!latitude.value || !longitude.value)) {
      selectedSort = sortMap['newest'];
    }
    params.append('sortBy', selectedSort.sortBy);
    params.append('order', selectedSort.order);

    const response = await $fetch<ApiResponse>('/api/orders/available', {
      headers: { 'Authorization': `Bearer ${userStore.token}` },
      query: { ...Object.fromEntries(params) },
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
        createdAt: order.createdAt,
        distance: order._distance,
      };
    });
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    error.value = err;
  } finally {
    pending.value = false;
  }
};

onMounted(() => {
  navigator.geolocation.getCurrentPosition(
    // 成功
    (position) => {
      latitude.value = position.coords.latitude;
      longitude.value = position.coords.longitude;
      geolocationError.value = null;
      fetchAvailableOrders();
    },
    // 失敗
    (error) => {
      console.error("Geolocation error:", error.message);
      geolocationError.value = error.message;
      latitude.value = null;
      longitude.value = null;
      fetchAvailableOrders();
    },
    { enableHighAccuracy: true }
  );
});

onActivated(() => {
  navigator.geolocation.getCurrentPosition(
      // 成功
      (position) => {
        latitude.value = position.coords.latitude;
        longitude.value = position.coords.longitude;
        geolocationError.value = null;
        fetchAvailableOrders();
      },
      // 失敗
      (error) => {
        console.error("Geolocation error:", error.message);
        geolocationError.value = error.message;
        latitude.value = null;
        longitude.value = null;
        fetchAvailableOrders();
      },
      { enableHighAccuracy: true }
  );
});

watch(sortOption, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    fetchAvailableOrders();
  }
});

useHead({ title: '瀏覽可接訂單' });
</script>

<style scoped>

</style>