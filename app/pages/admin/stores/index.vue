<template>
  <v-container class="py-8">
    <!-- 頂部標題與操作區 -->
    <v-row align="center" justify="space-between" class="mb-8">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold text-primary d-flex align-center">
          <v-icon start color="primary" class="mr-3">mdi-store-cog</v-icon>
          管理店家
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          管理所有餐廳資訊、菜單與營業狀態
        </p>
      </v-col>
      <v-col cols="12" md="auto" class="d-flex gap-4">
        <v-btn
          color="primary"
          size="large"
          elevation="2"
          prepend-icon="mdi-plus"
          to="/admin/stores/new"
          class="text-none px-6"
          rounded="pill"
        >
          新增餐廳
        </v-btn>
      </v-col>
    </v-row>

    <!-- 搜尋與篩選區 -->
    <v-card elevation="0" border rounded="lg" class="mb-8 bg-grey-lighten-5">
      <v-card-text class="py-6 px-6">
        <v-row align="center">
          <v-col cols="12" md="8" lg="6">
            <v-text-field
              v-model="searchTerm"
              placeholder="輸入餐廳名稱、電話或地址搜尋..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              bg-color="white"
              class="search-field"
              rounded="lg"
            >
              <template #append-inner>
                <v-fade-transition>
                  <v-progress-circular
                    v-if="pending && !loadingMore"
                    size="20"
                    width="2"
                    color="primary"
                    indeterminate
                  ></v-progress-circular>
                </v-fade-transition>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="4" lg="6" class="text-right d-none d-md-block">
            <span class="text-caption text-medium-emphasis">
              共找到 {{ stores.length }} 間餐廳（持續滾動載入更多）
            </span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 載入狀態 -->
    <div v-if="pending && stores.length === 0" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6 text-medium-emphasis">正在載入餐廳資料...</p>
    </div>

    <template v-else>
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        border="start"
        class="mb-6"
        closable
      >
        載入餐廳資料時發生錯誤，請稍後再試。
      </v-alert>

      <!-- 餐廳列表 -->
      <v-row v-if="stores.length > 0">
        <v-col
          v-for="store in stores"
          :key="store._id"
          cols="12"
          class="py-2"
        >
          <AdminStoreCard
            :id="store._id"
            :name="store.name"
            :image="store.image"
            :phone="store.phone"
            :count="store.menu.length"
            :rating="store.rating"
            class="store-card-hover"
          />
        </v-col>
      </v-row>

      <!-- 載入更多 -->
      <div v-if="loadingMore" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
        <p class="mt-2 text-body-2 text-medium-emphasis">載入更多...</p>
      </div>

      <!-- 無資料狀態 -->
      <v-sheet
        v-if="!pending && stores.length === 0"
        class="d-flex flex-column align-center justify-center py-16 rounded-lg border border-dashed bg-transparent"
        min-height="400"
      >
        <v-avatar color="grey-lighten-4" size="120" class="mb-6">
          <v-icon size="60" color="grey-lighten-1">mdi-store-search-outline</v-icon>
        </v-avatar>
        <h3 class="text-h5 font-weight-bold text-grey-darken-1 mb-2">找不到符合條件的店家</h3>
        <p class="text-body-1 text-grey mb-6">試著調整搜尋關鍵字，或新增一間餐廳</p>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          to="/admin/stores/new"
        >
          新增第一間餐廳
        </v-btn>
      </v-sheet>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { useInfiniteFetch } from '@composable/useInfiniteFetch';
import debounce from 'lodash-es/debounce';

interface menuItem { _id: string; name: string; price: number; image: string; info: string; }
interface store { _id: string; name: string; address: string; phone: string; image: string; info: string; menu: menuItem[]; rating: number; }

const searchTerm = ref('');
const debouncedSearchTerm = ref<string>(searchTerm.value);
const searchQuery = computed(() => debouncedSearchTerm.value.trim());

const limit = 28;
const buildQuery = (skip: number) => ({
  address: '基隆市中正區北寧路2號',
  search: searchQuery.value,
  limit,
  skip,
});

const { items: stores, pending, loadingMore, error, fetchItems } = useInfiniteFetch<store>({
  api: '/api/restaurants',
  limit,
  buildQuery,
  immediate: true,
});

watch(searchTerm, debounce((newValue: string) => {
  debouncedSearchTerm.value = newValue;
}, 800));

watch(
    searchQuery,
    () => {
      fetchItems({ reset: true });
    },
    { immediate: true }
);

useHead({ title: '管理店家' });
</script>

<style scoped>
.gap-4 {
  gap: 16px;
}

.search-field :deep(.v-field__outline__start) {
  border-radius: 8px 0 0 8px !important;
}
.search-field :deep(.v-field__outline__end) {
  border-radius: 0 8px 8px 0 !important;
}

.store-card-hover {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.store-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
  z-index: 1;
}
</style>