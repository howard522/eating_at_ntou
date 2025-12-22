<template>
  <v-card class="mb-4" elevation="2" rounded="lg">
    <v-card-item>
      <template v-slot:prepend>
        <v-avatar color="grey-lighten-2" size="48">
          <v-img
            v-if="review.user?.img"
            :src="review.user.img"
            alt="Avatar"
            cover
          ></v-img>
          <v-icon v-else icon="mdi-account" color="grey-darken-1"></v-icon>
        </v-avatar>
      </template>

      <v-card-title class="text-subtitle-1 font-weight-bold">
        {{ review.user?.name || '未知使用者' }}
      </v-card-title>

      <v-card-subtitle class="text-caption">
        {{ formatDate(review.createdAt) }}
      </v-card-subtitle>

      <template v-slot:append>
        <v-rating
          :model-value="review.rating"
          color="amber-darken-2"
          density="compact"
          size="small"
          readonly
          half-increments
        ></v-rating>
      </template>
    </v-card-item>

    <v-card-text class="pt-2 text-body-1" style="word-break: break-word; white-space: pre-wrap;">
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
