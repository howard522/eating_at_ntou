<template>
  <!-- 一定要用 ClientOnly，避免 SSR 時碰到 window / document -->
  <ClientOnly>
    <div
      id="simple-map"
      style="height: 400px; width: 100%;"
    ></div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(async () => {
  const L = await import('leaflet')

  // 設定一個預設中心點：這裡為海洋大學
  const center: [number, number] = [25.15081780087686, 121.77303369797978]
  const zoom = 15

  const map = L.map('simple-map').setView(center, zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)
})
</script>
