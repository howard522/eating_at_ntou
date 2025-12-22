<template>
  <v-container style="max-width: 800px;">
    <v-row class="mb-2">
      <v-col cols="12">
        <v-btn
            prepend-icon="mdi-arrow-left"
            variant="text"
            :to="`/admin/stores/${storeId}`"
            class="mb-2 px-0"
        >
          返回餐廳
        </v-btn>
        <h1 class="text-h4 font-weight-bold">餐廳評價</h1>
      </v-col>
    </v-row>

    <v-divider class="my-6"></v-divider>

    <div class="d-flex align-center justify-space-between mb-4">
      <h3 class="text-h6">所有評價</h3>

      <div class="d-flex align-center" style="width: 200px;">
        <v-select
            v-model="sortBy"
            :items="sortOptions"
            item-title="title"
            item-value="value"
            label="排序方式"
            variant="solo-filled"
            density="compact"
            hide-details
            rounded="lg"
            prepend-inner-icon="mdi-sort"
        ></v-select>
      </div>
    </div>

    <div v-if="pending && reviews.length === 0">
      <v-skeleton-loader
          v-for="n in 3"
          :key="n"
          type="list-item-avatar-three-line"
          class="mb-4"
      ></v-skeleton-loader>
    </div>

    <div v-else>
      <v-row
          v-for="review in reviews"
          :key="review._id"
          class="mb-4 align-start"
          no-gutters
      >

        <v-col cols="10" class="pa-0">
          <CustomerReviewCard :review="review" />
        </v-col>

        <v-col cols="2" tabindex="-1" class="d-flex align-center pa-0">
          <v-btn
              color="red"
              variant="text"
              class="bg-transparent"
              @click="deleteReview(review._id)"
              :loading="deleting === review._id"
          >
            刪除評論
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <div v-if="loadingMore" class="py-4">
      <v-skeleton-loader type="list-item-avatar-three-line"></v-skeleton-loader>
    </div>

    <div v-if="!pending && reviews.length === 0" class="text-center py-10">
      <v-icon size="64" color="grey-lighten-2">mdi-comment-off-outline</v-icon>
      <p class="text-h6 text-grey mt-2">目前還沒有評論。</p>
    </div>

    <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        location="top"
        timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">關閉</v-btn>
      </template>
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

    snackbar.value = { show: true, text: '刪除成功', color: 'success' }
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