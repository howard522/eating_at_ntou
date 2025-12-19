<template>
  <v-container style="max-width: 800px;">
    <v-row class="mb-2">
      <v-col cols="12">
        <v-btn
          prepend-icon="mdi-arrow-left"
          variant="text"
          :to="`/customer/stores/${storeId}`"
          class="mb-2 px-0"
        >
          返回餐廳
        </v-btn>
        <h1 class="text-h4 font-weight-bold">餐廳評價</h1>
      </v-col>
    </v-row>

    <v-card class="mb-6 pa-4" elevation="3" border>
      <h3 class="text-h6 font-weight-bold mb-3">撰寫您的評價</h3>

      <div class="d-flex align-center mb-4">
        <v-rating
          v-model="newReview.rating"
          color="amber"
          active-color="amber-darken-2"
          half-increments
          hover
          density="comfortable"
          size="large"
        ></v-rating>
        <span class="ml-2 text-h6 font-weight-bold text-amber-darken-2">{{ newReview.rating }} 分</span>
      </div>

      <v-textarea
        v-model="newReview.content"
        label="分享您的訂餐體驗"
        variant="outlined"
        rows="3"
        auto-grow
        counter
        maxlength="200"
        hide-details="auto"
        class="mb-4"
      ></v-textarea>

      <div class="d-flex justify-end">
        <v-btn
          color="primary"
          @click="submitReview"
          :loading="submitting"
          :disabled="newReview.rating === 0"
          prepend-icon="mdi-send"
        >
          送出評價
        </v-btn>
      </div>
    </v-card>

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
      <CustomerReviewCard
        v-for="review in reviews"
        :key="review._id"
        :review="review"
      />
    </div>

    <div v-if="loadingMore" class="py-4">
      <v-skeleton-loader type="list-item-avatar-three-line"></v-skeleton-loader>
    </div>

    <div v-if="!pending && reviews.length === 0" class="text-center py-10">
      <v-icon size="64" color="grey-lighten-2">mdi-comment-off-outline</v-icon>
      <p class="text-h6 text-grey mt-2">目前還沒有評論，成為第一個評論的人吧！</p>
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
import { useInfiniteFetch } from '@composable/useInfiniteFetch';
import { useUserStore } from '@stores/user';
import type { Review } from "@types/review";

const route = useRoute();
const userStore = useUserStore();
const storeId = route.params.id as string;

const submitting = ref(false);
const newReview = reactive({
  rating: 5,
  content: ''
});
const sortBy = ref('newest');
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});
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
    snackbar.value = { show: true, text: '請先登入才能評價', color: 'error' };
    return;
  }
  if (newReview.rating === 0) {
    snackbar.value = { show: true, text: '請選擇評分星數', color: 'warning' };
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
    snackbar.value = { show: true, text: '評價送出成功！', color: 'success' };
    newReview.rating = 5;
    newReview.content = '';
    if (sortBy.value !== 'newest') {
      sortBy.value = 'newest';
    } else {
      fetchItems({ reset: true });
    }
  } catch (error: any) {
    console.error('Submit review error:', error);
    snackbar.value = {
      show: true,
      text: error?.data?.message || '評價送出失敗，請稍後再試',
      color: 'error'
    };
  } finally {
    submitting.value = false;
  }
};

useHead({
  title: '餐廳評價'
});
</script>

<style scoped>

</style>
