<template>
  <v-card class="mb-4" flat border rounded="lg">
    <v-card-item class="pb-2">
      <template v-slot:prepend>
        <v-avatar color="grey-lighten-3" size="48" class="elevation-1">
          <v-img
            v-if="review.user?.img"
            :src="review.user.img"
            alt="Avatar"
            cover
          ></v-img>
          <v-icon v-else icon="mdi-account" color="grey-darken-1" size="28"></v-icon>
        </v-avatar>
      </template>

      <v-card-title class="text-subtitle-1 font-weight-bold text-grey-darken-3">
        {{ review.user?.name || '未知使用者' }}
      </v-card-title>

      <v-card-subtitle class="text-caption text-grey-darken-1 d-flex align-center mt-1">
        <v-icon icon="mdi-clock-outline" size="14" class="mr-1"></v-icon>
        {{ formatDate(review.createdAt) }}
      </v-card-subtitle>

      <template v-slot:append>
        <div class="d-flex align-center bg-amber-lighten-5 px-3 py-1 rounded-pill border border-amber-lighten-4">
          <v-rating
            :model-value="review.rating"
            color="amber-darken-1"
            active-color="amber"
            density="compact"
            size="x-small"
            readonly
            half-increments
          ></v-rating>
          <span class="text-caption font-weight-bold text-amber-darken-4 ml-2">{{ review.rating }}</span>
        </div>
      </template>
    </v-card-item>

    <v-divider class="mx-4 opacity-20"></v-divider>

    <v-card-text class="pt-4 text-body-1 text-grey-darken-3" style="word-break: break-word; white-space: pre-wrap; line-height: 1.6;">
      {{ review.content || '沒有留下文字評論。' }}
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Review } from "@types/review";

const props = defineProps<{
  review: Review
}>();

// 日期格式化
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>
