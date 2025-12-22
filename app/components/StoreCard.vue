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

    <v-card-title class="font-weight-bold pb-0">
      {{ name }}
    </v-card-title>

    <v-card-subtitle class="mt-1 mb-3 d-flex align-center">
      <template v-if="rating > 0">
        <span class="text-body-2 font-weight-bold text-high-emphasis mr-1">
          {{ rating.toFixed(1) }}
        </span>
        <v-rating
            :model-value="rating"
            color="amber"
            active-color="amber"
            half-increments
            readonly
            size="x-small"
            density="compact"
            style="transform: translateY(-2px)"
        ></v-rating>
        <span class="text-caption text-grey ml-1">
          </span>
      </template>

      <template v-else>
        <span class="text-body-2 text-grey">尚無評價</span>
      </template>
    </v-card-subtitle>

  </v-card>
</template>

<script setup lang="ts">
import { useImageHoverColor } from '@composable/useImageHoverColor';

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
  rating: {
    type: Number,
    default: 0,
  },
});

const { hoverBgColor } = useImageHoverColor(toRef(props, 'image'));
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
</style>