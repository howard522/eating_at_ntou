<template>
  <v-app>
    <v-app-bar app color="white" flat border>
      <v-btn
          to="/"
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
          </v-btn>
        </v-btn-toggle>
      </div>

      <v-spacer></v-spacer>

      <v-btn icon to="/customer/cart">
        <v-badge
            :content="cartStore.totalItemsCount"
            :model-value="cartStore.totalItemsCount > 0"
            color="red"
            floating
        >
          <v-icon>mdi-cart-outline</v-icon>
        </v-badge>
      </v-btn>

      <v-btn icon to="/profile" class="mr-2">
        <v-icon>mdi-account-outline</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main style="background-color: #f1f2f6;">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useCartStore } from '../../stores/cart';

interface link {
  title: string;
  to: string;
  value: string;
}

const cartStore = useCartStore();
// 未來會改用store判斷
const role = ref<string>('customer');
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
      { title: '管理會員', to: '/admin/accounts', value: 'admin-accounts' },
    ];
  }
  else {
    return [];
  }
});

watch(links, (newLinks) => {
  if (newLinks.length > 0)
  {
    activeNav.value = newLinks[0]?.value || '';
  } else
  {
    activeNav.value = '';
  }
}, { immediate: true });
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
</style>