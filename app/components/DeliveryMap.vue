<template>
  <ClientOnly>
    <div ref="mapContainer" class="delivery-map"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

// 維持跟頁面一致的型別：[緯度, 經度]
type LatLng = [number, number]

const props = defineProps<{
  driverPosition?: LatLng | null
  customerPosition?: LatLng | null
  restaurantPositions?: LatLng[] | null
}>()

const mapContainer = ref<HTMLDivElement | null>(null)

let map: any = null
let L: any = null

// 分別存各種 marker，之後更新時先移除舊的
let driverMarker: any = null
let customerMarker: any = null
let restaurantMarkers: any[] = []

const fallbackCenter: LatLng = [25.15081780087686, 121.77303369797978] // 海洋大學附近
const initialZoom = 15

onMounted(async () => {
  console.log('[DeliveryMap] onMounted, props =', {
    driverPosition: props.driverPosition,
    customerPosition: props.customerPosition,
    restaurantPositions: props.restaurantPositions,
  })

  await nextTick()

  if (!mapContainer.value) {
    console.warn('[DeliveryMap] 找不到 mapContainer')
    return
  }

  // 動態載入 Leaflet，避免 SSR 問題
  L = await import('leaflet')

  // 選一個初始中心：顧客 > 外送員 > fallback
  const center: LatLng =
    props.customerPosition ??
    props.driverPosition ??
    fallbackCenter

  map = L.map(mapContainer.value).setView(center, initialZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  console.log('[DeliveryMap] 地圖已建立，中心點 =', center)

  // 一開始就畫一次 marker
  updateMarkersAndFit()
})

// 監聽座標變化（未來你移動外送員位置會用到）
watch(
  () => ({
    driver: props.driverPosition,
    customer: props.customerPosition,
    restaurants: props.restaurantPositions,
  }),
  () => {
    if (!map || !L) return
    updateMarkersAndFit()
  },
  { deep: true }
)

function clearMarkers() {
  if (driverMarker) {
    driverMarker.remove()
    driverMarker = null
  }
  if (customerMarker) {
    customerMarker.remove()
    customerMarker = null
  }
  if (restaurantMarkers.length) {
    restaurantMarkers.forEach(m => m.remove())
    restaurantMarkers = []
  }
}

function updateMarkersAndFit() {
  if (!map || !L) return

  clearMarkers()

  const boundsPoints: LatLng[] = []

  // 外送員標記
  if (props.driverPosition) {
    driverMarker = L.circleMarker(props.driverPosition, {
      radius: 9,
      color: '#1976d2',       // 藍色：外送員
      weight: 3,
      fillColor: '#2196f3',
      fillOpacity: 0.9,
    }).addTo(map)
    driverMarker.bindPopup('外送員位置')
    boundsPoints.push(props.driverPosition)
  }

  // 顧客標記
  if (props.customerPosition) {
    customerMarker = L.circleMarker(props.customerPosition, {
      radius: 8,
      color: '#2e7d32',       // 綠色：顧客
      weight: 3,
      fillColor: '#43a047',
      fillOpacity: 0.9,
    }).addTo(map)
    customerMarker.bindPopup('顧客位置')
    boundsPoints.push(props.customerPosition)
  }

  // 餐廳標記（可能有多家）
  if (props.restaurantPositions && props.restaurantPositions.length > 0) {
    props.restaurantPositions.forEach((pos, index) => {
      const marker = L.circleMarker(pos, {
        radius: 7,
        color: '#f57c00',      // 橘色：餐廳
        weight: 3,
        fillColor: '#ffb300',
        fillOpacity: 0.9,
      }).addTo(map)
      marker.bindPopup(`餐廳 ${index + 1}`)
      restaurantMarkers.push(marker)
      boundsPoints.push(pos)
    })
  }

  // 如果有任何點，就自動縮放讓所有點都在畫面內
  if (boundsPoints.length > 0) {
    const bounds = L.latLngBounds(boundsPoints)
    map.fitBounds(bounds, {
      padding: [32, 32],
      maxZoom: 18,
    })
  } else {
    // 沒有任何座標時，回到預設中心
    map.setView(fallbackCenter, initialZoom)
  }
}

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
