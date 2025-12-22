<template>
  <v-container class="fill-height align-start bg-grey-lighten-4 pa-0 pa-md-4" fluid>
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">

        <!-- 頂部標題與操作區 -->
        <v-row align="center" justify="space-between" class="mb-8 mt-2 px-2">
          <v-col cols="12">
            <h1 class="text-h4 font-weight-bold text-primary d-flex align-center">
              <v-icon start color="primary" class="mr-3">mdi-clipboard-list-outline</v-icon>
              訂單管理
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis mt-1">
              檢視所有歷史與進行中的訂單詳情
            </p>
          </v-col>
        </v-row>

        <!-- 搜尋與篩選區 -->
        <v-card elevation="0" border rounded="lg" class="mb-8 bg-white">
          <v-card-text class="py-6 px-6">
            <v-row dense align="center">
              <v-col cols="12" sm="4" md="3">
                <v-menu v-model="menuFrom" :close-on-content-click="false" location="bottom start">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                        v-bind="props"
                        v-model="filters.from"
                        label="起始日期"
                        variant="outlined"
                        density="compact"
                        prepend-inner-icon="mdi-calendar-start"
                        hide-details
                        readonly
                        clearable
                        bg-color="white"
                        @click:clear="clearDate('from')"
                    ></v-text-field>
                  </template>
                  <v-card min-width="300">
                    <v-date-picker
                        v-model="rawDateFrom"
                        color="primary"
                        show-adjacent-months
                        hide-header
                        @update:model-value="updateDate('from', $event)"
                    ></v-date-picker>
                  </v-card>
                </v-menu>
              </v-col>

              <v-col cols="12" sm="4" md="3">
                <v-menu v-model="menuTo" :close-on-content-click="false" location="bottom start">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                        v-bind="props"
                        v-model="filters.to"
                        label="結束日期"
                        variant="outlined"
                        density="compact"
                        prepend-inner-icon="mdi-calendar-end"
                        hide-details
                        readonly
                        clearable
                        bg-color="white"
                        @click:clear="clearDate('to')"
                    ></v-text-field>
                  </template>
                  <v-card min-width="300">
                    <v-date-picker
                        v-model="rawDateTo"
                        color="primary"
                        show-adjacent-months
                        hide-header
                        @update:model-value="updateDate('to', $event)"
                    ></v-date-picker>
                  </v-card>
                </v-menu>
              </v-col>

              <v-col cols="12" sm="4" md="3">
                <v-select
                    v-model="filters.sortOption"
                    :items="sortItems"
                    item-title="title"
                    item-value="value"
                    label="排序條件"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-sort"
                    hide-details
                    bg-color="white"
                    @update:model-value="fetchOrders"
                ></v-select>
              </v-col>

              <v-col cols="12" sm="12" md="3" class="d-flex align-center justify-end pl-4">
                <v-btn
                    icon="mdi-refresh"
                    variant="tonal"
                    color="primary"
                    class="mr-3"
                    @click="fetchOrders"
                    :loading="pending"
                ></v-btn>
                <div class="text-h6 font-weight-bold text-grey-darken-2">
                  共 {{ orders.length }} 筆
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-tabs
            v-model="tab"
            color="primary"
            align-tabs="start"
            class="mb-4 bg-transparent"
            @update:model-value="handleTabChange"
        >
          <v-tab value="inProgress" class="text-h6 px-6 rounded-t-lg text-capitalize">
            <v-icon start class="mr-2">mdi-progress-clock</v-icon>
            未完成
          </v-tab>
          <v-tab value="completed" class="text-h6 px-6 rounded-t-lg text-capitalize">
            <v-icon start class="mr-2">mdi-check-circle-outline</v-icon>
            已完成
          </v-tab>
        </v-tabs>

        <v-row v-if="pending">
          <v-col v-for="n in 3" :key="n" cols="12">
            <v-skeleton-loader
                class="rounded-lg mb-3 border"
                type="article"
                elevation="1"
                height="200"
            ></v-skeleton-loader>
          </v-col>
        </v-row>

        <v-alert
            v-else-if="error"
            type="error"
            variant="tonal"
            border="start"
            elevation="2"
            class="mb-6"
            icon="mdi-alert"
        >
          <div class="text-h6">載入失敗</div>
          <div>{{ error.message }} - 請檢查網路連線或稍後再試。</div>
        </v-alert>

        <v-window v-else v-model="tab">
          <v-window-item :value="tab">

            <div v-if="orders.length === 0" class="text-center py-10">
              <v-icon size="100" color="grey-lighten-2" class="mb-4">mdi-clipboard-text-off-outline</v-icon>
              <h3 class="text-h5 text-grey-darken-1">目前沒有符合條件的訂單</h3>
              <p class="text-subtitle-1 text-grey">試著調整日期範圍或篩選條件</p>
            </div>

            <AdminOrderCard
                v-else
                v-for="order in orders"
                :key="order.id"
                :order="order"
            />

          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useInfiniteFetch } from '@composable/useInfiniteFetch';

const tab = ref('inProgress');
const rawDateFrom = ref<Date | null>(null);
const rawDateTo = ref<Date | null>(null);
const menuFrom = ref(false);
const menuTo = ref(false);

const filters = ref({
  from: '',
  to: '',
  sortOption: 'createdAt_desc'
});

const sortItems = [
  { title: '最新建立', value: 'createdAt_desc' },
  { title: '最早建立', value: 'createdAt_asc' },
  { title: '金額 (高到低)', value: 'total_desc' },
  { title: '金額 (低到高)', value: 'total_asc' },
  { title: '外送費 (高到低)', value: 'deliveryFee_desc' },
];

const handleTabChange = () => {
  fetchItems({ reset: true });
};

const updateDate = (type: 'from' | 'to', date: any) => {
  if (!date) return;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  if (type === 'from') {
    filters.value.from = formattedDate;
    menuFrom.value = false;
  } else {
    filters.value.to = formattedDate;
    menuTo.value = false;
  }
  fetchItems({ reset: true });
};

const clearDate = (type: 'from' | 'to') => {
  if (type === 'from') {
    filters.value.from = '';
    rawDateFrom.value = null;
  } else {
    filters.value.to = '';
    rawDateTo.value = null;
  }
  fetchItems({ reset: true });
};

const { items: rawOrders, pending, loadingMore, error, fetchItems } = useInfiniteFetch<ApiOrder>({
  api: '/api/admin/orders',
  limit: 20,
  buildQuery: (skip) => {
    const [sortBy, order] = filters.value.sortOption.split('_');
    const isCompleted = tab.value === 'completed';
    const queryParams: any = {
      completed: isCompleted,
      sortBy,
      order,
      skip,
      limit: 20,
    };
    if (filters.value.from) queryParams.from = filters.value.from;
    if (filters.value.to) queryParams.to = filters.value.to;
    return queryParams;
  },
  immediate: true
});

const orders = computed(() => rawOrders.value.map(order => {
  const restaurantNames = Array.from(
      new Set(order.items.map(item => item.restaurant.name))
  ).join(', ');

  const d = new Date(order.createdAt);
  const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  return {
    id: order._id,
    restaurantNames: restaurantNames,
    userName: order.deliveryInfo.contactName || order.user.name,
    userPhone: order.deliveryInfo.contactPhone,
    deliveryPersonName: order.deliveryPerson ? order.deliveryPerson.name : null,
    deliveryPersonPhone: order.deliveryPerson ? order.deliveryPerson.phone : null,
    items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
    total: order.total,
    deliveryFee: order.deliveryFee,
    customerStatus: order.customerStatus,
    deliveryStatus: order.deliveryStatus,
    createdAtFormatted: dateStr,
  };
}));

watch([() => filters.value.sortOption, () => filters.value.from, () => filters.value.to, tab], () => {
  fetchItems({ reset: true });
});

onActivated(() => {
  fetchItems({ reset: true });
});

useHead({
  title: '管理訂單',
});
</script>