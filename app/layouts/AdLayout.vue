<template>
  <slot />
  <v-dialog v-model="showAd" max-width="400px" persistent>
    <v-card>
      <v-card-title class="text-h6 font-weight-bold text-center">廣告</v-card-title>
      <v-card-text class="text-center py-4">
        應徵廣告欄位
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn color="primary" @click="closeAd">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { useAdPopup } from '../composable/useAdPopup'

const { showAd, closeAd } = useAdPopup({
  rampStartMinutes: 3,
  rampDurationMinutes: 5,
  checkIntervalMs: 30 * 1000,
  silenceMs: 5000,
})

</script>
