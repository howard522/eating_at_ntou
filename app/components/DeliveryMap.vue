<!-- src/components/DeliveryMap.vue -->
<template>
  <ClientOnly>
    <div ref="mapContainer" class="delivery-map"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

type LatLng = [number, number]

const props = defineProps<{
  driverPosition?: LatLng | null
  customerPosition?: LatLng | null
  restaurantPositions?: LatLng[] | null
}>()

const mapContainer = ref<HTMLDivElement | null>(null)

let map: any = null
let L: any = null
let driverMarker: any = null
let customerMarker: any = null
let restaurantMarkers: any[] = []
let routePolyline: any = null

const fallbackCenter: LatLng = [25.15081780087686, 121.77303369797978]
const initialZoom = 15

function iconSizeByZoom(zoom: number) {
  const base = 32        
  const factor = 2 ** ((zoom - 14) * 0.15) 
  const px = Math.max(20, Math.min(64, Math.round(base * factor))) 
  return px
}

function makeEmojiIcon(emoji: string, zoom: number) {
  const size = iconSizeByZoom(zoom)
  return L.divIcon({
    className: 'emoji-marker',
    html: `<span class="emoji" aria-hidden="true" style="font-size:${size}px">${emoji}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function updateEmojiIcon(marker: any, emoji: string) {
  if (!map) return
  const zoom = map.getZoom()
  marker.setIcon(makeEmojiIcon(emoji, zoom))
}

function buildEmojiMarker(pos: LatLng, emoji: string, zIndexOffset = 0) {
  const zoom = map.getZoom()
  return L.marker(pos, {
    icon: makeEmojiIcon(emoji, zoom),
    zIndexOffset,
  })
}

let onZoomEnd: any = null

onMounted(async () => {
  await nextTick()
  if (!mapContainer.value) {
    console.warn('[DeliveryMap] 找不到 mapContainer')
    return
  }

  L = await import('leaflet')

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

  onZoomEnd = () => {
    if (driverMarker) updateEmojiIcon(driverMarker, '🛵')
    if (customerMarker) updateEmojiIcon(customerMarker, '🏠')
    for (const m of restaurantMarkers) updateEmojiIcon(m, '🍽️')
  }
  map.on('zoomend', onZoomEnd)
})

// 監聽座標變化
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
  if (driverMarker) { driverMarker.remove(); driverMarker = null }
  if (customerMarker) { customerMarker.remove(); customerMarker = null }
  if (restaurantMarkers.length) {
    restaurantMarkers.forEach(m => m.remove())
    restaurantMarkers = []
  }
  if (routePolyline) { routePolyline.remove(); routePolyline = null }
}

/**
 * 呼叫 OSRM Route API
 */
async function fetchRouteFromOSRM(points: LatLng[]): Promise<LatLng[] | null> {
  if (points.length < 2) return null
  const coordsStr = points.map(([lat, lng]) => `${lng},${lat}`).join(';')
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

  // 1) 外送員：🛵
  if (props.driverPosition) {
    driverMarker = buildEmojiMarker(props.driverPosition, '🛵', 1000)
    driverMarker.addTo(map).bindPopup('外送員位置')
    boundsPoints.push(props.driverPosition)
    routePoints.push(props.driverPosition)
  }

  // 2) 餐廳：🍽️（多個）
  if (props.restaurantPositions && props.restaurantPositions.length > 0) {
    props.restaurantPositions.forEach((pos, idx) => {
      const m = buildEmojiMarker(pos, '🍽️')
      m.addTo(map).bindPopup(`餐廳 ${idx + 1}`)
      restaurantMarkers.push(m)
      boundsPoints.push(pos)
      routePoints.push(pos)
    })
  }

  // 3) 顧客：🏠
  if (props.customerPosition) {
    customerMarker = buildEmojiMarker(props.customerPosition, '🏠')
    customerMarker.addTo(map).bindPopup('顧客位置')
    boundsPoints.push(props.customerPosition)
    routePoints.push(props.customerPosition)
  }

  // 4) 路線
  if (routePoints.length >= 2) {
    const osrmRoute = await fetchRouteFromOSRM(routePoints)
    if (osrmRoute && osrmRoute.length >= 2) {
      routePolyline = L.polyline(osrmRoute, { weight: 4, opacity: 0.9 }).addTo(map)
    } else {
      routePolyline = L.polyline(routePoints, { weight: 4, opacity: 0.8, dashArray: '6 4' }).addTo(map)
    }
  }

  // 5) 自動縮放
  if (boundsPoints.length > 0) {
    const bounds = L.latLngBounds(boundsPoints)
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 18 })
  } else {
    map.setView(fallbackCenter, initialZoom)
  }
}

onBeforeUnmount(() => {
  if (map && onZoomEnd) map.off('zoomend', onZoomEnd)
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
.delivery-map {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
}

/* 簡單陰影，提升白底可讀性 */
.emoji-marker {
  background: transparent;
  border: none;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
  pointer-events: auto;
}
</style>
