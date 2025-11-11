<template>
  <div>
    <NuxtLayout>
      <NuxtPage keepalive/>
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useUserStore } from '@stores/user'
import { useCartStore } from '@stores/cart'

const userStore = useUserStore()
userStore.initialize()
const cartStore = useCartStore()
cartStore.initialize()
</script>