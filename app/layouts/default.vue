<template>
  <AdLayout>
    <v-app>
    <v-app-bar app color="white" flat border>
      <v-btn
          to="/introduction"
          variant="tonal"
          color="#27187E"
          class="font-weight-bold ml-2"
          rounded="lg"
          size="large"
      >
        海大
      </v-btn>

      <div class="ml-4">
        <v-btn-toggle
          v-model="activeNav"
          mandatory
          group
          class="custom-btn-toggle"
          density="comfortable"
          rounded="lg"
          color="primary"
        >
          <v-btn
            v-for="link in links"
            :key="link.value"
            :to="link.to"
            :value="link.value"
            class="custom-btn"
            variant="text"
          >
            {{ link.title }}
            <v-badge
              v-if="(link.value === 'customer-orders' || link.value === 'delivery-orders') && notificationStore.notificationCount > 0"
              color="error"
              :content="notificationStore.notificationCount"
              inline
              class="ml-1 notification-badge"
            ></v-badge>
          </v-btn>
        </v-btn-toggle>
      </div>

      <v-spacer></v-spacer>

      <v-tooltip v-if="role === 'customer'" text="購物冰箱" location="bottom">
        <template #activator="{ props: act }">
          <v-btn
            icon
            to="/customer/cart"
            v-bind="{ ...act, ref: setFridgeIcon }"
          >
            <v-badge
                :content="cartStore.totalItemsCount"
                :model-value="cartStore.totalItemsCount > 0"
                color="red"
                floating
            >
              <v-icon>mdi-fridge-outline</v-icon>
            </v-badge>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip v-if="role !== 'admin'" text="我的帳戶" location="bottom">
        <template #activator="{ props }">
          <v-btn icon to="/profile" v-bind="props" class="md-4 mr-8">
            <v-icon>mdi-account-outline</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip
          v-else
          text="登出"
          location="bottom"
      >
        <template #activator="{ props }">
          <v-btn icon v-bind="props" class="md-4 mr-8" @click="userStore.logout()" to="/login">
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

    </v-app-bar>

    <v-main style="background-color: #f1f2f6;">
      <slot />
    </v-main>

    <!-- 全局 Snackbar -->
    <v-snackbar v-model="snackbarStore.show" :color="snackbarStore.color" :timeout="snackbarStore.timeout">
      {{ snackbarStore.text }}
    </v-snackbar>

    </v-app>
  </AdLayout>
</template>

<script setup lang="ts">
import { useAdPopup } from '@composable/useAdPopup';
import { useCartStore } from '@stores/cart';
import { useUserStore } from '@stores/user';
import { useNotificationStore } from '@stores/notification';
import { useSnackbarStore } from '@utils/snackbar';
import AdLayout from './AdLayout.vue';

const { showAd, closeAd } = useAdPopup()

interface link {
  title: string;
  to: string;
  value: string;
}

// 提供購物車圖示元素給 AddToCartDialog 使用 ---
const fridgeIcon = ref<HTMLElement | null>(null);
const setFridgeIcon = (el: any) => {
  fridgeIcon.value = el?.$el || el || null;
};
const fridgeIconEl = computed(() => fridgeIcon.value?.$el || fridgeIcon.value);
provide('cartIconEl', fridgeIconEl);

const cartStore = useCartStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const snackbarStore = useSnackbarStore();

const role = computed(() => {
  if (userStore?.info?.role === 'admin') {
    return 'admin';
  }
  if (userStore?.currentRole === 'delivery') {
    return 'delivery';
  }
  return 'customer';
});
const activeNav = ref<string>('');
const links = computed<link[]>(() => {
  if (role.value === 'customer')
  {
    return [
      { title: '瀏覽店家', to: '/customer/stores', value: 'customer-stores' },
      { title: '我的訂單', to: '/customer/orders', value: 'customer-orders' },
    ];
  }
  else if (role.value === 'delivery') {
    return [
      { title: '顧客訂單', to: '/delivery/customer-orders', value: 'delivery-customer-orders' },
      { title: '我的訂單', to: '/delivery/orders', value: 'delivery-orders' },
    ];
  }
  else if (role.value === 'admin') {
    return [
      { title: '管理店家', to: '/admin/stores', value: 'admin-stores' },
      { title: '查看訂單', to: '/admin/orders', value: 'admin-orders' },
      { title: '管理會員', to: '/admin/users', value: 'admin-users' },
    ];
  }
  else {
    return [];
  }
});

watch(links, (newLinks) => {
  if (newLinks.length > 0)
  {
    activeNav.value = newLinks[0?.value] || '';
  } else
  {
    activeNav.value = '';
  }
}, { immediate: true });

onMounted(async () => {
  if (role.value === 'customer') {
    await cartStore.fetchCart();
  }
});
</script>

<style scoped>
.custom-btn-toggle {
  background: transparent;
}

.custom-btn {
  font-weight: 500;
  padding: 0 20px;
  min-width: 100px;
}

.custom-btn:hover {
  background-color: #f0f0f0;
}

.v-btn--active {
  background-color: #e0e0e0 !important;
}

.notification-badge :deep(.v-badge__badge) {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 82, 82, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
  }
}

.cart-shake {
  animation: cart-shake-anim 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes cart-shake-anim {
  0%   { transform: rotate(0deg) translateX(0); }
  10%  { transform: rotate(-5deg) translateX(-1px); }
  20%  { transform: rotate(4deg) translateX(2px); }
  30%  { transform: rotate(-4deg) translateX(-3px); }
  40%  { transform: rotate(3deg) translateX(3px); }
  50%  { transform: rotate(-3deg) translateX(-3px); }
  60%  { transform: rotate(2deg) translateX(2px); }
  70%  { transform: rotate(-2deg) translateX(-1px); }
  80%  { transform: rotate(1deg) translateX(1px); }
  90%  { transform: rotate(-1deg) translateX(-1px); }
  100% { transform: rotate(0deg) translateX(0); }
}
</style>
