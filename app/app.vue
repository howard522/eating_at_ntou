<template>
  <div>
    <NuxtLayout>
      <NuxtPage keepalive/>
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useCartStore } from '@stores/cart'
import { useUserStore } from '@stores/user'

const userStore = useUserStore()
userStore.initialize()
const cartStore = useCartStore()
cartStore.initialize()
</script>