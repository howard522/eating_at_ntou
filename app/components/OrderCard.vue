<template>
  <v-card flat border rounded="lg">
    <v-card-text class="pa-5">
      <div class="d-flex justify-space-between align-start mb-2">
        <h3 class="text-h6 font-weight-bold">{{ order.restaurantNames }}</h3>
        <v-chip
            :color="statusInfo.color"
            variant="flat"
            size="small"
            class="font-weight-bold"
        >
          {{ statusInfo.text }}
        </v-chip>
      </div>

      <div class="text-body-2 text-medium-emphasis mb-3">
        {{ order.date }}
      </div>

      <div class="text-body-1 mb-2">{{ itemSummary }}</div>

      <div class="text-h6 font-weight-bold">總金額: ${{ order.total }}</div>
    </v-card-text>

    <v-card-actions v-if="order.status !== 'completed'" class="pa-4 pt-0">
      <v-btn
          :to="`/customer/order-state/${order.id}`"
          color="primary"
          block
          size="large"
          variant="flat"
      >
        <span class="font-weight-bold">查看詳情</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  restaurantNames: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'preparing' | 'delivering' | 'received' | 'completed';
}

const props = defineProps<{
  order: Order;
}>();

const itemSummary = computed(() => {
  return props.order.items
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(', ');
});

const statusInfo = computed(() => {
  if (props.order.status === 'preparing') {
    return { text: '準備中', color: 'warning' };
  }
  else if (props.order.status === 'delivering') {
    return { text: '配送中', color: 'primary' };
  }
  else if (props.order.status === 'received') {
    return { text: '已接收', color: 'info' };
  }
  else if (props.order.status === 'completed') {
    return { text: '已完成', color: 'success' };
  }
  return { text: '未知', color: 'grey' };
});
</script>