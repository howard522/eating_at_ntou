<template>
  <v-container>
    <h2 class="text-h5 font-weight-bold mb-4">{{ $t('avatarCropper.title') }}</h2>
    <v-row>
      <!-- 控制區 -->
      <v-col cols="12" md="5">
        <v-file-input
          v-model="imageFile"
          :label="$t('avatarCropper.selectImage')"
          accept="image/*"
          prepend-icon="mdi-camera"
          @update:modelValue="previewImage"
        />
        <v-radio-group v-model="cropType" class="mt-2" :disabled="!imageObj">
          <v-radio :label="$t('avatarCropper.centerCrop')" value="center" />
          <v-radio :label="$t('avatarCropper.customCrop')" value="custom" />
        </v-radio-group>
        <v-slider
          v-model="cropRadius"
          class="mt-2"
          :min="30"
          :max="sliderMaxRadius"
          step="1"
          :label="$t('avatarCropper.cropRadius')"
          thumb-label
          :disabled="!imageObj"
        />
        <div class="text-caption text-medium-emphasis mt-1">
          {{ $t('avatarCropper.hint') }}
        </div>
        <v-btn color="primary" class="mt-4" :disabled="!imageObj" @click="emitCropped">
          {{ $t('avatarCropper.saveButton') }}
        </v-btn>
      </v-col>

      <!-- 預覽區 -->
      <v-col cols="12" md="7">
        <div class="avatar-preview-wrapper">
          <canvas
            ref="canvasRef"
            :width="canvasSize"
            :height="canvasSize"
            class="preview-canvas"
            @pointerdown="startDrag"
          ></canvas>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const props = defineProps<{
  imageFile?: File | null // 可選的初始圖片檔案
}>()

const emit = defineEmits<{ (e: 'cropped', blob: Blob): void }>()
const imageFile = ref<File | null>(props.imageFile ?? null)
const imageObj = ref<HTMLImageElement | null>(null)
const cropType = ref<'center' | 'custom'>('center')
const canvasSize = 400
const cropRadius = ref(120)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cropCenter = ref({ x: canvasSize / 2, y: canvasSize / 2 })
const dragging = ref(false)
const draggingOffset = ref({ dx: 0, dy: 0 })
let rafId: number | null = null
const pendingPos = ref<{ x: number; y: number } | null>(null)

// 記錄圖片在 canvas 的繪製資訊
const drawRect = ref({ dx: 0, dy: 0, imgW: 0, imgH: 0, scale: 1 })

const sliderMaxRadius = computed(() => {
  if (!imageObj.value) return canvasSize / 2
  return Math.floor(Math.min(drawRect.value.imgW, drawRect.value.imgH) / 2)
})

const dragHitTolerance = 16 // 額外可點擊緩衝

function previewImage() {
  if (!imageFile.value) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new window.Image()
    img.onload = () => {
      imageObj.value = img
      cropCenter.value = { x: canvasSize / 2, y: canvasSize / 2 }
      drawPreview()
      // 根據圖片顯示大小初始化合適半徑
      const init = Math.min(sliderMaxRadius.value, Math.max(60, Math.floor(sliderMaxRadius.value / 2)))
      cropRadius.value = init
      clampCenterToImageBounds()
      drawPreview()
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(imageFile.value)
}

function drawPreview() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  if (imageObj.value) {
    const img = imageObj.value
    const scale = Math.min(canvasSize / img.width, canvasSize / img.height)
    const imgW = img.width * scale
    const imgH = img.height * scale
    const dx = (canvasSize - imgW) / 2
    const dy = (canvasSize - imgH) / 2
    // 存資料供限制與裁切使用
    drawRect.value = { dx, dy, imgW, imgH, scale }

    ctx.drawImage(img, dx, dy, imgW, imgH)
  } else {
    // 沒有圖片時的背景
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, canvasSize, canvasSize)
  }

  // 畫裁切圓形框
  ctx.save()
  ctx.beginPath()
  ctx.arc(cropCenter.value.x, cropCenter.value.y, cropRadius.value, 0, Math.PI * 2)
  ctx.closePath()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#1976d2'
  ctx.stroke()
  ctx.restore()

  // 遮罩外部區域
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.rect(0, 0, canvasSize, canvasSize)
  ctx.arc(cropCenter.value.x, cropCenter.value.y, cropRadius.value, 0, Math.PI * 2, true)
  ctx.closePath()
  ctx.fillStyle = '#fff'
  ctx.fill('evenodd')
  ctx.restore()
}

function pointInCircle(x: number, y: number) {
  const dx = x - cropCenter.value.x
  const dy = y - cropCenter.value.y
  const r = Math.max(cropRadius.value, 32) + dragHitTolerance
  return dx * dx + dy * dy <= r * r
}

function insideImage(x: number, y: number) {
  const { dx, dy, imgW, imgH } = drawRect.value
  return x >= dx && x <= dx + imgW && y >= dy && y <= dy + imgH
}

function clampCenterToImageBounds() {
  const { dx, dy, imgW, imgH } = drawRect.value
  if (!imageObj.value || imgW === 0 || imgH === 0) return
  const minX = dx + cropRadius.value
  const maxX = dx + imgW - cropRadius.value
  const minY = dy + cropRadius.value
  const maxY = dy + imgH - cropRadius.value
  cropCenter.value.x = Math.min(Math.max(cropCenter.value.x, minX), maxX)
  cropCenter.value.y = Math.min(Math.max(cropCenter.value.y, minY), maxY)
}

function getPointerPos(e: PointerEvent) {
  const canvas = canvasRef.value
  const rect = canvas?.getBoundingClientRect()
  if (!rect || !canvas) return { x: 0, y: 0 }

  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

function startDrag(e: PointerEvent) {
  if (cropType.value !== 'custom' || !imageObj.value) return
  const pos = getPointerPos(e)
  // 若沒點中圓，且點在圖片內，直接移動圓心到該點並開始拖曳
  if (!pointInCircle(pos.x, pos.y)) {
    if (insideImage(pos.x, pos.y)) {
      cropCenter.value.x = pos.x
      cropCenter.value.y = pos.y
      clampCenterToImageBounds()
    } else {
      return
    }
  }
  dragging.value = true
  draggingOffset.value.dx = pos.x - cropCenter.value.x
  draggingOffset.value.dy = pos.y - cropCenter.value.y
  ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  window.addEventListener('pointermove', globalMove, { passive: false })
  window.addEventListener('pointerup', globalUp, { passive: false })
  e.preventDefault()
}

function globalMove(e: PointerEvent) {
  if (!dragging.value) return
  pendingPos.value = getPointerPos(e)
  if (rafId == null) {
    rafId = requestAnimationFrame(applyDrag)
  }
  e.preventDefault()
}

function applyDrag() {
  rafId = null
  if (!pendingPos.value) return
  const { x, y } = pendingPos.value
  cropCenter.value.x = x - draggingOffset.value.dx
  cropCenter.value.y = y - draggingOffset.value.dy
  clampCenterToImageBounds()
  drawPreview()
}

function globalUp(e?: PointerEvent) {
  dragging.value = false
  pendingPos.value = null
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (e && (e.target as HTMLElement)?.releasePointerCapture) {
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
  }
  window.removeEventListener('pointermove', globalMove)
  window.removeEventListener('pointerup', globalUp)
}

function emitCropped() {
  if (!imageObj.value) return
  const { dx, dy, scale } = drawRect.value
  const img = imageObj.value

  // 計算裁切中心對應到原圖座標
  const cropX = (cropCenter.value.x - dx) / scale
  const cropY = (cropCenter.value.y - dy) / scale
  const rOnImg = cropRadius.value / scale

  const outSize = cropRadius.value * 2
  const out = document.createElement('canvas')
  out.width = outSize
  out.height = outSize
  const octx = out.getContext('2d')
  if (!octx) return

  octx.save()
  octx.beginPath()
  octx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2)
  octx.closePath()
  octx.clip()

  // 從原圖擷取對應區域繪製到輸出畫布
  octx.drawImage(
    img,
    cropX - rOnImg,           // sx
    cropY - rOnImg,           // sy
    rOnImg * 2,               // sWidth
    rOnImg * 2,               // sHeight
    0,                        // dx
    0,                        // dy
    outSize,                  // dWidth
    outSize                   // dHeight
  )
  octx.restore()

  out.toBlob((blob) => {
    if (blob) emit('cropped', blob)
  }, 'image/png')
}

watch([cropRadius], () => {
  // 半徑變動時確保不超出圖片範圍
  cropRadius.value = Math.min(cropRadius.value, sliderMaxRadius.value)
  clampCenterToImageBounds()
  drawPreview()
})

watch([imageFile, cropType], () => {
  if (imageObj.value) {
    if (cropType.value === 'center') {
      cropCenter.value = { x: canvasSize / 2, y: canvasSize / 2 }
      clampCenterToImageBounds()
    }
    drawPreview()
  }
})

onMounted(() => {
  // 防止預設觸控行為
  canvasRef.value?.setAttribute('touch-action', 'none')
  if (imageFile.value) previewImage() // 初始有圖片的話傳入預覽
})

onUnmounted(() => {
  window.removeEventListener('pointermove', globalMove)
  window.removeEventListener('pointerup', globalUp)
  if (rafId != null) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.avatar-preview-wrapper {
  width: 100%;
  max-width: 560px;
  margin: auto;
}
.preview-canvas {
  width: 100%;
  height: auto;
  border: 1px solid #ccc;
  background: #fafafa;
  border-radius: 8px;
  display: block;
  user-select: none;
  touch-action: none;
  cursor: grab;
}
.preview-canvas:active {
  cursor: grabbing;
}
</style>
