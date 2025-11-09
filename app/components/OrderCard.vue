<template>
  <v-card flat border rounded="lg">
    <v-card-text class="pa-5">

      <div v-if="role === 'customer'">
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

        <div class="text-body-2 text-medium-emphasis mb-1">
          {{ order.date }}
        </div>

        <div
            v-if="order.arriveTime && order.status !== 'completed'"
            class="text-body-1 font-weight-bold text-primary mb-3"
        >
          預計送達時間: {{ order.arriveTime }}
        </div>

        <div class="text-body-1 mb-2">{{ itemSummary }}</div>

        <div class="text-h6 font-weight-bold">總金額: ${{ order.total }}</div>
      </div>

      <div v-else-if="role === 'delivery'">
        <div class="d-flex justify-space-between align-start mb-2">
          <h3 class="text-h6 font-weight-bold" :class="deliveryTitle.color">
            {{ deliveryTitle.text }}
          </h3>
          <v-chip
              :color="statusInfo.color"
              variant="flat"
              size="small"
              class="font-weight-bold"
          >
            {{ statusInfo.text }}
          </v-chip>
        </div>

        <div
            v-if="order.arriveTime && order.status !== 'completed'"
            class="text-body-1 font-weight-bold text-primary mb-3"
        >
          預計送達時間: {{ order.arriveTime }}
        </div>
        <div class="text-body-1 mb-1">
          取餐: <span class="text-medium-emphasis">{{ order.restaurantNames }}</span>
        </div>
        <div class="text-body-1 mb-1"> 送餐至: <span class="text-medium-emphasis">{{ order.deliveryAddress }}</span>
        </div>

        <div class="text-right text-h6 font-weight-bold text-success">
          報酬: {{ order.deliveryFee }} 元
        </div>
      </div>

    </v-card-text>

    <v-card-actions v-if="!(role === 'delivery' && order.status === 'completed')" class="pa-4 pt-0">
      <v-btn
          :to="path"
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
interface DisplayOrder {
  id: string;
  status: string;
  restaurantNames: string;
  date?: string;
  items?: OrderItem[];
  total?: number;
  deliveryAddress?: string;
  deliveryFee?: number;
  arriveTime?: string;
}

const props = defineProps<{
  order: DisplayOrder;
  path: string;
  role: 'customer' | 'delivery';
}>();

const itemSummary = computed(() => {
  if (!props.order.items || props.order.items.length === 0) {
    return '無資料';
  }
  return props.order.items
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(', ');
});

const shortId = computed(() => props.order.id.slice(-6).toUpperCase());
const deliveryTitle = computed(() => {
  const isCompleted = props.order.status === 'completed';
  return {
    text: isCompleted ? `歷史 #${shortId.value}` : `任務 #${shortId.value}`,
    color: isCompleted ? 'text-success' : 'text-primary'
  };
});

const statusInfo = computed(() => {
  const s = props.order.status;
  if (s === 'on_the_way') {
    return { text: '外送中', color: 'primary' };
  }
  if (s === 'delivered') {
    return { text: '已送達', color: 'info' };
  }
  if (s === 'preparing') {
    return { text: '準備中', color: 'warning' };
  }
  if (s === 'received') {
    return { text: '已接收', color: 'info' };
  }
  if (s === 'completed') {
    return { text: '已完成', color: 'success' };
  }
  return { text: '未知', color: 'grey' };
});
</script>