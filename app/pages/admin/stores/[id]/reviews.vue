<template>
  <v-container class="py-8" style="max-width: 1000px;">
    <!-- Header Section -->
    <div class="d-flex align-center mb-8">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="`/admin/stores/${storeId}`"
        class="mr-4"
        color="grey-darken-2"
      ></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold text-grey-darken-3">餐廳評價管理</h1>
        <p class="text-subtitle-1 text-grey-darken-1 mt-1">查看並管理所有顧客對此餐廳的評論</p>
      </div>
    </div>

    <!-- Toolbar / Filter -->
    <v-card flat class="bg-grey-lighten-5 border rounded-lg mb-6 px-4 py-3 d-flex flex-wrap align-center justify-space-between gap-4">
      <div class="d-flex align-center text-grey-darken-2 px-2">
        <v-icon icon="mdi-comment-multiple-outline" class="mr-2" color="primary"></v-icon>
        <span class="font-weight-bold text-h6">{{ reviews.length }}</span>
        <span class="text-body-2 ml-2 text-grey-darken-1">則評論</span>
      </div>
      
      <div style="width: 200px;">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          item-title="title"
          item-value="value"
          label="排序方式"
          variant="outlined"
          density="compact"
          hide-details
          bg-color="white"
          prepend-inner-icon="mdi-sort"
          class="rounded-lg"
          color="primary"
        ></v-select>
      </div>
    </v-card>

    <!-- Reviews List -->
    <div v-if="pending && reviews.length === 0">
      <v-skeleton-loader
        v-for="n in 3"
        :key="n"
        type="article, actions"
        class="mb-4 rounded-lg border"
        elevation="0"
      ></v-skeleton-loader>
    </div>

    <div v-else-if="reviews.length > 0" class="d-flex flex-column ga-4">
      <v-fade-transition group>
        <div
          v-for="review in reviews"
          :key="review._id"
          class="review-wrapper"
        >
          <div class="d-flex flex-column flex-md-row align-start ga-4">
             <div class="flex-grow-1 w-100">
                <CustomerReviewCard :review="review" class="elevation-1 rounded-lg border" />
             </div>
             
             <!-- Delete Action -->
             <div class="d-flex align-center pt-2 pt-md-0">
                <v-btn
                  color="error"
                  variant="tonal"
                  prepend-icon="mdi-delete-outline"
                  @click="deleteReview(review._id)"
                  :loading="deleting === review._id"
                  class="text-none px-6"
                  rounded="lg"
                  height="44"
                  block
                >
                  刪除評論
                </v-btn>
             </div>
          </div>
        </div>
      </v-fade-transition>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 bg-grey-lighten-5 rounded-xl border border-dashed">
      <v-avatar color="white" size="100" class="mb-4 elevation-1">
        <v-icon size="48" color="grey-lighten-1">mdi-message-text-outline</v-icon>
      </v-avatar>
      <h3 class="text-h5 text-grey-darken-2 font-weight-bold">暫無評論</h3>
      <p class="text-body-1 text-grey mt-2">目前還沒有顧客對此餐廳發表評論。</p>
    </div>

    <!-- Loading More -->
    <div v-if="loadingMore" class="py-6 text-center">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
    </div>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="bottom center"
      timeout="3000"
      rounded="pill"
      content-class="text-center font-weight-medium"
    >
      <div class="d-flex align-center justify-center">
        <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" class="mr-2"></v-icon>
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { useInfiniteFetch } from '@composable/useInfiniteFetch'
import type { Review } from '@types/review'
import { useUserStore } from "@stores/user"

const userStore = useUserStore()
const route = useRoute()
const storeId = route.params.id as string

const sortBy = ref('newest')
const sortOptions = [
  { title: '最新發布', value: 'newest' },
  { title: '最高評分', value: 'highest' },
  { title: '最低評分', value: 'lowest' },
]

const {
  items: reviews,
  pending,
  loadingMore,
  fetchItems
} = useInfiniteFetch<Review>({
  api: '/api/reviews',
  limit: 28,
  buildQuery: (skip: number) => ({
    restaurantId: storeId,
    sort: sortBy.value,
    skip,
    limit: 28,
  }),
  immediate: true
})

watch(sortBy, () => {
  fetchItems({ reset: true })
})

const deleting = ref<string | null>(null)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const deleteReview = async (id: string) => {
  if (!id) return
  if (!confirm('確定要刪除這則評論嗎？此操作無法復原。')) return

  deleting.value = id
  try {
    await $fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    // 本地即時更新
    const index = reviews.value.findIndex(r => r._id === id)
    if (index !== -1) {
      reviews.value.splice(index, 1)
    }

    snackbar.value = { show: true, text: '評論已成功刪除', color: 'success' }
  } catch (e: any) {
    const errorMsg = e.response?._data?.message || '刪除失敗，請稍後再試'
    snackbar.value = { show: true, text: errorMsg, color: 'error' }
  } finally {
    deleting.value = null
  }
}

useHead({
  title: '管理評價'
})
</script>

<style scoped>
.review-wrapper {
  transition: all 0.3s ease;
}
</style>