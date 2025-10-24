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
            <OrderCard :order="order" />
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
            <OrderCard :order="order" />
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
const tab = ref('inProgress');

// 之後會改用api取得訂單資料
// 未完成訂單
const inProgressOrders = ref([
  {
    id: '12345',
    restaurantNames: '阿姨鹹酥雞, 巷口牛肉麵',
    date: '2025年10月08日',
    items: [
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
      { name: '無骨鹹酥雞 (大份)', quantity: 2 },
      { name: '紅燒牛肉麵', quantity: 1 },
    ],
    total: 290,
    status: 'delivering',
  },
  {
    id: '67890',
    restaurantNames: '好好吃炸機',
    date: '2025年10月12日',
    items: [
      { name: '炸雞腿', quantity: 3 },
      { name: '可樂', quantity: 2 },
    ],
    total: 270,
    status: 'preparing',
  },
  {
    id: 'abcde',
    restaurantNames: '哈囉你好下午茶',
    date: '2025年10月19日',
    items: [
      { name: '超好吃蛋糕', quantity: 5 },
    ],
    total: 1000,
    status: 'received',
  },
]);

// 已完成訂單
const completedOrders = ref([
  {
    id: '12344',
    restaurantNames: '巷口營養三明治',
    date: '2025年10月05日',
    items: [
      { name: '營養三明治', quantity: 2 },
      { name: '木瓜牛奶', quantity: 1 },
    ],
    total: 150,
    status: 'completed',
  },
  {
    id: '12343',
    restaurantNames: '愛喝水飲料店',
    date: '2025年09月28日',
    items: [
      { name: '珍珠奶茶', quantity: 1 },
      { name: '檸檬愛玉', quantity: 1 },
    ],
    total: 80,
    status: 'completed',
  },
]);

useHead({
  title: '我的訂單',
});
</script>

<style scoped>

</style>