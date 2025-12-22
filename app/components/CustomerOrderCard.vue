<template>
  <v-card flat border rounded="lg" class="mb-4">
    <v-card-text class="pa-5">
      <div class="d-flex justify-space-between align-start mb-3">
        <h3 class="text-h6 font-weight-bold text-blue-darken-1">
          新任務 #{{ shortId }}
        </h3>
        <v-chip
            color="primary"
            variant="outlined"
            size="small"
            class="font-weight-bold"
        >
          <v-icon start icon="mdi-clock-fast"></v-icon>
          送達時間 {{ formattedTime }}
        </v-chip>
      </div>

      <div class="d-flex align-center text-body-1 mb-2">
        <v-icon color="orange" start>mdi-store-outline</v-icon>
        <strong class="mr-1">從：</strong>
        <span>{{ order.restaurantNameDisplay }}</span>
      </div>
      <div class="d-flex align-center text-body-1 mb-4">
        <v-icon color="blue" start>mdi-map-marker-outline</v-icon>
        <strong class="mr-1">至：</strong>
        <span>{{ order.deliveryAddress }}</span>
      </div>

      <div class="text-right">
        <span class="text-medium-emphasis mr-2">外送費</span>
        <span class="text-h5 font-weight-bold text-success">{{ order.deliveryFee }} 元</span>
      </div>
    </v-card-text>

    <v-card-actions class="pa-5 pt-0">
      <v-btn
          :to="`/delivery/customer-orders/${order.id}`"
          color="success"
          block
          size="large"
          variant="flat"
      >
        <v-icon left>mdi-page-next-outline</v-icon>
        <span class="font-weight-bold ml-2">查看並接單</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { AvailableDisplayOrder as DisplayOrder } from '@types/order';
import type { PropType } from 'vue';

const props = defineProps({
  order: {
    type: Object as PropType<DisplayOrder>,
    required: true
  }
});

// 取 _id 的末6碼
const shortId = computed(() => props.order.id.slice(-6).toUpperCase());

const formattedTime = computed(() => {
  if (!props.order.deliveryTime) {
    return '--:--';
  }
  try {
    const d = new Date(props.order.deliveryTime);
    if (isNaN(d.getTime())) {
      return '--:--';
    }
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    console.error('Invalid delivery time:', props.order.deliveryTime, e);
    return '--:--';
  }
});
</script>

<style scoped>

</style>