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

// 各種圖層的暫存
let driverMarker: any = null
let customerMarker: any = null
let restaurantMarkers: any[] = []
let routePolyline: any = null

const fallbackCenter: LatLng = [25.15081780087686, 121.77303369797978] // 海洋大學
const initialZoom = 15

onMounted(async () => {
  // console.log('[DeliveryMap] onMounted, props =', {
  //   driverPosition: props.driverPosition,
  //   customerPosition: props.customerPosition,
  //   restaurantPositions: props.restaurantPositions,
  // })

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
  await updateMarkersAndRoute()
})

// 監聽座標變化（外送員移動、資料更新時會觸發）
watch(
  () => ({
    driver: props.driverPosition,
    customer: props.customerPosition,
    restaurants: props.restaurantPositions,
  }),
  async () => {
    if (!map || !L) return
    await updateMarkersAndRoute()
  },
  { deep: true }
)

function clearMarkersAndRoute() {
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
  if (routePolyline) {
    routePolyline.remove()
    routePolyline = null
  }
}

/**
 * 呼叫 OSRM Route API，根據實際道路回傳 polyline
 * @param points 路線途經點，格式為 [lat, lng]
 * @returns 轉成 Leaflet 可用的 LatLng[]（[lat, lng]），失敗回傳 null
 */
async function fetchRouteFromOSRM(points: LatLng[]): Promise<LatLng[] | null> {
  if (points.length < 2) return null

  // OSRM 要經緯度順序為 lng,lat
  const coordsStr = points
    .map(([lat, lng]) => `${lng},${lat}`)
    .join(';')

  const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn('[DeliveryMap] OSRM 請求失敗', res.status, await res.text())
      return null
    }

    const data = await res.json()
    if (!data.routes || !data.routes[0] || !data.routes[0].geometry) {
      console.warn('[DeliveryMap] OSRM 回傳格式異常', data)
      return null
    }

    const coordinates: [number, number][] = data.routes[0].geometry.coordinates

    // OSRM 回傳 [lng, lat]，轉為 Leaflet 的 [lat, lng]
    const latLngs: LatLng[] = coordinates.map(([lng, lat]) => [lat, lng])

    return latLngs
  } catch (err) {
    console.error('[DeliveryMap] OSRM 呼叫錯誤', err)
    return null
  }
}

async function updateMarkersAndRoute() {
  if (!map || !L) return

  clearMarkersAndRoute()

  const boundsPoints: LatLng[] = []
  const routePoints: LatLng[] = []

  // 1) 外送員標記
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
    routePoints.push(props.driverPosition)
  }

  // 2) 餐廳標記（可能有多家）
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
      routePoints.push(pos) // 路線依照陣列順序串接餐廳
    })
  }

  // 3) 顧客標記
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
    routePoints.push(props.customerPosition)
  }

  // 4) 畫出「外送員 ➜ 餐廳們 ➜ 顧客」的路線（優先用 OSRM，失敗則退回直線）
  if (routePoints.length >= 2) {
    const osrmRoute = await fetchRouteFromOSRM(routePoints)

    if (osrmRoute && osrmRoute.length >= 2) {
      // 用 OSRM 回傳的實際道路 polyline
      routePolyline = L.polyline(osrmRoute, {
        weight: 4,
        opacity: 0.9,
        
      }).addTo(map)
    } else {
      // OSRM 呼叫失敗時，回到原本的直線示意
      routePolyline = L.polyline(routePoints, {
        weight: 4,
        opacity: 0.8,
        dashArray: '6 4',   // 虛線，看起來像路線示意
      }).addTo(map)
    }
  }

  // 5) 自動縮放到剛好包含所有點
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
