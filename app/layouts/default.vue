<template>
  <v-app>
    <v-app-bar app color="white" flat border>
      <v-btn
          to="/"
          variant="tonal"
          color="blue-darken-4"
          class="font-weight-bold ml-2"
          rounded="xl"
          size="large"
      >
        海大
      </v-btn>

      <div class="ml-4">
        <v-btn-toggle v-model="activeNav" mandatory group>
          <v-btn
              v-for="link in links"
              :key="link.value"
              :to="link.to"
              :value="link.value">
            {{ link.title }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <v-spacer></v-spacer>

      <v-btn icon to="/cart">
        <v-icon>mdi-cart-outline</v-icon>
      </v-btn>

      <v-btn icon to="/profile" class="mr-2">
        <v-icon>mdi-account-outline</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main style="background-color: #f9f9f9;">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
interface link {
  title: string;
  to: string;
  value: string;
}

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
    activeNav.value = newLinks[0].value;
  } else
  {
    activeNav.value = '';
  }
}, { immediate: true });
</script>

<style scoped>

</style>