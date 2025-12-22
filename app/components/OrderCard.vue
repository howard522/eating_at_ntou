<template>
  <v-card flat border rounded="lg">
    <v-card-text class="pa-3 pa-sm-5">

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

    <v-card-actions v-if="!(role === 'delivery' && order.status === 'completed')" class="pa-3 pa-sm-4 pt-0">
      <div class="d-flex w-100" style="gap: 12px">
        <v-badge
            :model-value="hasNotification"
            color="error"
            dot
            class="notification-badge flex-grow-1"
        >
          <v-btn
              :to="path"
              color="primary"
              class="w-100"
              size="large"
              variant="flat"
          >
            <span class="font-weight-bold">查看詳情</span>
          </v-btn>
        </v-badge>
        <v-btn
            v-if="role === 'customer'"
            color="secondary"
            class="flex-grow-1"
            size="large"
            variant="tonal"
            :loading="addingToCart"
            @click="buyAgain"
        >
          <span class="font-weight-bold">再買一次</span>
        </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { DisplayOrder } from '@types/order';
import { useCartStore } from '@stores/cart';
import { useUserStore } from '@stores/user';
import { useSnackbarStore } from '@utils/snackbar';
import { createCartImageAnimator } from '@utils/cartAnimation';

const props = defineProps<{
  order: DisplayOrder;
  path: string;
  role: 'customer' | 'delivery';
  hasNotification?: boolean;
}>();

const cartStore = useCartStore();
const userStore = useUserStore();
const snackbarStore = useSnackbarStore();
const cartIconEl = inject('cartIconEl') as Ref<HTMLElement | null>;
const { flyAllImagesToCart, createFloatingImage } = createCartImageAnimator(cartIconEl);

const addingToCart = ref(false);

const buyAgain = async () => {
  addingToCart.value = true;
  try {
    const response = await $fetch<{ success: boolean, data: any }>(`/api/orders/${props.order.id}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    });

    if (!response.success || !response.data) {
      throw new Error('無法取得訂單資訊');
    }

    const orderItems = response.data.items;
    if (!orderItems || orderItems.length === 0) {
      snackbarStore.showWarning('此訂單沒有商品');
      return;
    }

    let addedCount = 0;
    for (const item of orderItems) {
      const menuItemId = item.menuItemId || item._id || `temp_${Date.now()}_${Math.random()}`;
      const restaurantId = item.restaurant?.id;
      const restaurantName = item.restaurant?.name || '未知餐廳';

      if (!restaurantId) {
        console.warn('無法加入購物車：缺少餐廳 ID', item);
        continue;
      }

      const menuItem = {
        menuItemId: menuItemId,
        name: item.name,
        price: item.price,
        image: item.image || '',
        info: item.info || ''
      };

      cartStore.addItem(menuItem, item.quantity, {
        id: restaurantId,
        name: restaurantName
      });

      if (item.image) {
        createFloatingImage(item.image);
      }
      addedCount++;
    }

    if (addedCount > 0) {
      flyAllImagesToCart();
      snackbarStore.showSuccess(`已將 ${addedCount} 項商品加入購物車`);
    } else {
      snackbarStore.showWarning('無法加入商品（資料不完整）');
    }
  } catch (e) {
    console.error(e);
    snackbarStore.showError('加入購物車失敗');
  } finally {
    addingToCart.value = false;
  }
};

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
  const isCustomer = props.role === 'customer';
  const map: Record<string, { text: string; color: string }> = {
    on_the_way: {
      text: isCustomer ? '準備中' : '配送中',
      color: 'primary'
    },
    preparing: {
      text: isCustomer ? '沒人接QAQ' : '準備中',
      color: 'warning'
    },
    delivered: { text: '已送達', color: 'info' },
    received:  { text: '已接收', color: 'info' },
    completed: { text: '已完成', color: 'success' }
  };
  return map[s] || { text: '未知', color: 'grey' };
});
</script>

<style scoped>
.notification-badge :deep(.v-badge__badge) {
  animation: pulse 1.5s infinite;
  border: 2px solid white;
  width: 12px;
  height: 12px;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
  }
}
</style>