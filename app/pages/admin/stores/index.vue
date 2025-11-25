<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">管理店家</h1>

    <v-row class="mb-6" align="center" justify="space-between">
      <v-col cols="12" md="6">
        <v-text-field
            v-model="searchTerm"
            placeholder="輸入餐廳名稱搜尋..."
            prepend-inner-icon="mdi-magnify"
            class="mt-1"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="auto">
        <v-btn
            color="red"
            size="large"
            prepend-icon="mdi-plus"
            to="/admin/stores/new"
        >
          新增餐廳
        </v-btn>
      </v-col>
    </v-row>

    <div v-if="pending" class="text-center py-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">正在載入餐廳資料...</p>
    </div>

    <template v-else>
      <v-alert v-if="error" type="error" class="mb-6">
        載入餐廳資料時發生錯誤，請稍後再試。
      </v-alert>

      <v-row v-if="stores.length > 0">
        <v-col
            v-for="store in stores"
            :key="store._id"
            cols="12"
            class="py-2"
        >
          <AdminStoreCard :id="store._id" :name="store.name" :image="store.image" :phone="store.phone" :count="store.menu.length"  />
        </v-col>
      </v-row>

      <div v-if="loadingMore" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">正在載入餐廳資料...</p>
      </div>

      <v-row v-if="stores && stores.length === 0" class="mt-10">
        <v-col cols="12" class="text-center text-grey">
          <v-icon size="50">mdi-store-search-outline</v-icon>
          <p class="mt-4 text-h6">找不到符合條件的店家</p>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import debounce from 'lodash-es/debounce';
import { useInfiniteFetch } from '~/composable/useInfiniteFetch';

interface menuItem { _id: string; name: string; price: number; image: string; info: string; }
interface store { _id: string; name: string; address: string; phone: string; image: string; info: string; menu: menuItem[]; }

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

</style>