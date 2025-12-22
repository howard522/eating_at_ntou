<template>
  <slot />
  <v-dialog v-model="showAd" max-width="400px" persistent>
    <v-card>
      <v-card-title class="text-h6 font-weight-bold text-center">廣告</v-card-title>
      <v-card-text class="text-center py-4">
        {{ adText || '這是一則廣告內容' }}
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn color="primary" @click="closeAd">了解了</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { useAdPopup } from '@composable/useAdPopup'
import type { ApiAd } from '@types/ad'
import type { ApiResponse } from '@types/order'

const adText = ref('')

const { showAd, closeAd } = useAdPopup({
  rampStartMinutes: 3,
  rampDurationMinutes: 5,
  checkIntervalMs: 30 * 1000,
  silenceMs: 5000,
})

const fetchRandomAd = async () => {
    try {
        const response = await $fetch<ApiResponse<ApiAd>>('/api/ads/random');
        if (response && response.success) {
            adText.value = response.data.text;
        } else {
            adText.value = '廣告載入失敗，請稍後。';
        }
    } catch (error) {
        adText.value = '廣告載入失敗，請稍後。';
        console.error('Failed to fetch random ad:', error);
    }
}

// 更新廣告內容
watch(showAd, (newVal) => {
    if (newVal) {
        fetchRandomAd();
    }
});

</script>
