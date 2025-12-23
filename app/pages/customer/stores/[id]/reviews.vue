<template>
  <v-container class="py-8" style="max-width: 1000px;">
    <!-- Header Section -->
    <div class="d-flex align-center mb-8">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="`/customer/stores/${storeId}`"
        class="mr-4"
        color="grey-darken-2"
      ></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold text-grey-darken-3">餐廳評價</h1>
        <p class="text-subtitle-1 text-grey-darken-1 mt-1">查看大家的用餐體驗或分享您的想法</p>
      </div>
    </div>

    <!-- Write Review Section -->
    <v-card class="mb-8 rounded-xl border overflow-hidden" elevation="0">
      <div class="bg-primary-lighten-5 px-6 py-4 border-b">
        <h3 class="text-h6 font-weight-bold text-primary-darken-2 d-flex align-center">
          <v-icon icon="mdi-pencil-outline" class="mr-2"></v-icon>
          撰寫您的評價
        </h3>
      </div>
      <div class="pa-6">
        <div class="d-flex flex-column flex-sm-row align-start align-sm-center mb-6 gap-4">
          <span class="text-subtitle-1 font-weight-medium text-grey-darken-2 mr-2">整體評分</span>
          <div class="d-flex align-center">
            <v-rating
              v-model="newReview.rating"
              color="amber"
              active-color="amber-darken-2"
              half-increments
              hover
              density="comfortable"
              size="large"
              class="mr-3"
            ></v-rating>
            <v-chip color="amber-darken-2" variant="flat" size="small" class="font-weight-bold">
              {{ newReview.rating }} 分
            </v-chip>
          </div>
        </div>

        <v-textarea
          v-model="newReview.content"
          label="分享您的訂餐體驗..."
          placeholder="餐點口味如何？外送速度快嗎？"
          variant="outlined"
          rows="4"
          auto-grow
          counter
          maxlength="200"
          hide-details="auto"
          class="mb-6"
          bg-color="grey-lighten-5"
          color="primary"
        ></v-textarea>

        <div class="d-flex justify-end">
          <v-btn
            color="primary"
            @click="submitReview"
            :loading="submitting"
            :disabled="newReview.rating === 0"
            prepend-icon="mdi-send"
            rounded="lg"
            elevation="2"
            height="44"
            class="px-6"
          >
            送出評價
          </v-btn>
        </div>
      </div>
    </v-card>

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
        <CustomerReviewCard
          v-for="review in reviews"
          :key="review._id"
          :review="review"
          class="elevation-1 rounded-lg border"
        />
      </v-fade-transition>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 bg-grey-lighten-5 rounded-xl border border-dashed">
      <v-avatar color="white" size="100" class="mb-4 elevation-1">
        <v-icon size="48" color="grey-lighten-1">mdi-message-draw</v-icon>
      </v-avatar>
      <h3 class="text-h5 text-grey-darken-2 font-weight-bold">暫無評論</h3>
      <p class="text-body-1 text-grey mt-2">目前還沒有評論，成為第一個評論的人吧！</p>
    </div>

    <!-- Loading More -->
    <div v-if="loadingMore" class="py-6 text-center">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useInfiniteFetch } from '@composable/useInfiniteFetch';
import { useUserStore } from '@stores/user';
import { useSnackbarStore } from '@utils/snackbar';
import type { Review } from "@types/review";

const route = useRoute();
const userStore = useUserStore();
const snackbarStore = useSnackbarStore();
const storeId = route.params.id as string;

const submitting = ref(false);
const newReview = reactive({
  rating: 5,
  content: ''
});
const sortBy = ref('newest');
const sortOptions = [
  { title: '最新發布', value: 'newest' },
  { title: '最高評分', value: 'highest' },
  { title: '最低評分', value: 'lowest' },
];

const {
  items: reviews,
  pending,
  loadingMore,
  fetchItems
} = useInfiniteFetch<Review>({
  api: '/api/reviews',
  limit: 28,
  buildQuery: (skip) => ({
    restaurantId: storeId,
    sort: sortBy.value,
    skip,
    limit: 28,
  }),
  immediate: true
});

watch(sortBy, () => {
  fetchItems({ reset: true });
});

const submitReview = async () => {
  if (!userStore.token) {
    snackbarStore.showSnackbar('請先登入才能評價', 'error');
    return;
  }
  if (newReview.rating === 0) {
    snackbarStore.showSnackbar('請選擇評分星數', 'warning');
    return;
  }
  submitting.value = true;
  try {
    const response = await $fetch('/api/reviews', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userStore.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        restaurantId: storeId,
        rating: newReview.rating,
        content: newReview.content,
      }
    });
    snackbarStore.showSnackbar('評價送出成功！', 'success');
    newReview.rating = 5;
    newReview.content = '';
    if (sortBy.value !== 'newest') {
      sortBy.value = 'newest';
    } else {
      fetchItems({ reset: true });
    }
  } catch (error: any) {
    console.error('Submit review error:', error);
    snackbarStore.showSnackbar(error?.data?.message || '評價送出失敗，請稍後再試', 'error');
  } finally {
    submitting.value = false;
  }
};

useHead({
  title: '餐廳評價'
});
</script>

<style scoped>
.sort-select-container {
  width: 200px;
}

@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.75rem !important;
  }
  
  .sort-select-container {
    width: 160px;
  }
}
</style>
