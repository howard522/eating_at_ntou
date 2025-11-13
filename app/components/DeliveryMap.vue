<template>
  <ClientOnly>
    <div ref="mapContainer" class="delivery-map"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

// 簡單的經緯度型別：[緯度, 經度]
type LatLng = [number, number]

// 先定義好這個元件會收到哪些座標
const props = defineProps<{
  driverPosition?: LatLng | null
  customerPosition?: LatLng | null
  restaurantPositions?: LatLng[] | null
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null

onMounted(async () => {
  console.log('[DeliveryMap] onMounted, props =', {
    driverPosition: props.driverPosition,
    customerPosition: props.customerPosition,
    restaurantPositions: props.restaurantPositions,
  })

  // 等 DOM（包含 <ClientOnly> slot）真正畫完
  await nextTick()

  if (!mapContainer.value) {
    console.warn('[DeliveryMap] 找不到 mapContainer')
    return
  }

  const L = await import('leaflet')

  // 如果有顧客或外送員座標，就用它們當中心，沒有再 fallback
  const fallbackCenter: LatLng = [25.15081780087686, 121.77303369797978] // 海洋大學
  const center: LatLng =
    props.customerPosition ??
    props.driverPosition ??
    fallbackCenter

  const zoom = 15

  map = L.map(mapContainer.value).setView(center, zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  console.log('[DeliveryMap] 地圖已建立，中心點 =', center)
})

watch(
  () => ({
    driver: props.driverPosition,
    customer: props.customerPosition,
    restaurants: props.restaurantPositions,
  }),
  (val) => {
    console.log('[DeliveryMap] 座標 props 改變：', val)
    // Day 2 先只 log，不動地圖
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.delivery-map {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
