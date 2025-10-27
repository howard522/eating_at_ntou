<template>
  <div>
    <NuxtLayout>
      <NuxtPage keepalive/>
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
userStore.initialize()
</script>