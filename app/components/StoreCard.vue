<template>

  <v-card 
    class="rounded-lg store-card" 
    :to="`/customer/stores/${id}`"
    :style="{ '--hover-bg': hoverBgColor }"
  >

    <div class="image-container">
      <v-img
          :src="image"
          height="150px"
          cover
          class="store-image"
      >
        <template v-slot:error>
          <div
              class="d-flex align-center justify-center fill-height"
              style="background-color: #E0E0E0;"
          >
            <span class="text-h3 text-white font-weight-bold letter-spacing-lg">
              ? ? ? ? ?
            </span>
          </div>
        </template>
      </v-img>
    </div>

    <v-card-title class="font-weight-bold">
      {{ name }}
    </v-card-title>

    <v-card-subtitle class="mt-1 mb-1 store-info-subtitle">
      {{ info }}
    </v-card-subtitle>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  info: {
    type: String,
    default: '',
  },
});

const hoverBgColor = ref('#FFFFFF');

const updateHoverColor = () => {
  if (!props.image) return;
  
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = props.image;
  
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 50;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    
    try {
      const data = ctx.getImageData(0, 0, size, size).data;
      
      const buckets: { r: number; g: number; b: number; count: number }[] = Array.from({ length: 12 }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
      let totalR = 0, totalG = 0, totalB = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        totalR += r;
        totalG += g;
        totalB += b;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        const l = (max + min) / 2;

        if (d < 20 || l < 20 || l > 235) continue;

        let h = 0;
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;

        const bucketIndex = Math.floor(h * 2) % 12;
        buckets[bucketIndex].r += r;
        buckets[bucketIndex].g += g;
        buckets[bucketIndex].b += b;
        buckets[bucketIndex].count++;
      }

      const bestBucket = buckets.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), buckets[0]);
      
      let finalR, finalG, finalB;

      if (bestBucket.count > 0) {
        finalR = bestBucket.r / bestBucket.count;
        finalG = bestBucket.g / bestBucket.count;
        finalB = bestBucket.b / bestBucket.count;
      } else {
        const pixelCount = size * size;
        finalR = totalR / pixelCount;
        finalG = totalG / pixelCount;
        finalB = totalB / pixelCount;
      }

      const mix = 0.8;
      const newR = Math.round(finalR + (255 - finalR) * mix);
      const newG = Math.round(finalG + (255 - finalG) * mix);
      const newB = Math.round(finalB + (255 - finalB) * mix);
      
      hoverBgColor.value = `rgb(${newR}, ${newG}, ${newB})`;
    } catch (e) {
      console.warn('無法提取圖片顏色', e);
    }
  };
};

onMounted(() => {
  updateHoverColor();
});

watch(() => props.image, updateHoverColor);
</script>

<style scoped>
.store-card {
  transition: transform 0.3s ease !important;
  background-color: #FFFFFF !important;
  min-height: 230px;
  display: flex;
  flex-direction: column;
}

.store-card:hover {
  background-color: var(--hover-bg, #FFFFFF) !important;
}

.image-container {
  overflow: hidden;
}

.store-image {
  transition: transform 0.3s ease;
}

.store-card:hover .store-image {
  transform: scale(1.05);
}

.store-info-subtitle {
  min-height: 24px;
  display: block;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>