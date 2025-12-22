<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-h4 font-weight-bold mb-4">管理會員</h2>

        <v-card flat color="transparent">
          <v-row align="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchTerm"
                label="依據暱稱或Email進行搜尋"
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                density="comfortable"
                hide-details
                clearable
                rounded="lg"
              ></v-text-field>
            </v-col>

            <v-col cols="6" md="3">
              <v-select
                v-model="sortBy"
                :items="sortByOptions"
                label="排序依據"
                item-title="title"
                item-value="value"
                prepend-inner-icon="mdi-sort"
                variant="solo-filled"
                density="comfortable"
                hide-details
                rounded="lg"
              ></v-select>
            </v-col>

            <v-col cols="6" md="3">
              <v-select
                v-model="sortOrder"
                :items="sortOrderOptions"
                label="排序方式"
                item-title="title"
                item-value="value"
                :prepend-inner-icon="sortOrderIcon"
                variant="solo-filled"
                density="comfortable"
                hide-details
                rounded="lg"
              ></v-select>
            </v-col>
          </v-row>

          <v-row class="mt-2">
            <v-col cols="12">
              <div class="d-flex align-center">
                <v-chip-group
                  v-model="selectedRole"
                  selected-class="text-primary"
                  mandatory
                >
                  <v-chip value="all" filter variant="outlined">全部</v-chip>
                  <v-chip value="admin" filter variant="outlined" color="primary">管理員</v-chip>
                  <v-chip value="multi" filter variant="outlined" color="primary">一般用戶</v-chip>
                  <v-chip value="banned" filter variant="outlined" color="primary">停權名單</v-chip>
                </v-chip-group>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="pending && users.length === 0">
      <v-col v-for="n in 8" :key="`skeleton-${n}`" cols="12" sm="6" md="4" lg="3" xl="3">
        <v-skeleton-loader type="avatar, article" elevation="2"></v-skeleton-loader>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="user in users"
        :key="user.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        xl="3"
      >
        <AdminUserCard :user="user" />
      </v-col>
    </v-row>

    <v-row v-if="loadingMore" class="mt-4">
      <v-col v-for="n in 4" :key="`loading-${n}`" cols="12" sm="6" md="4" lg="3" xl="3">
        <v-skeleton-loader type="avatar, article" elevation="2"></v-skeleton-loader>
      </v-col>
    </v-row>

    <v-row v-if="!pending && users.length === 0" class="mt-10">
      <v-col cols="12" class="text-center text-grey">
        <v-icon size="64" color="grey-lighten-2">mdi-account-off-outline</v-icon>
        <p class="mt-4 text-h6">找不到符合條件的使用者</p>
      </v-col>
    </v-row>

    <v-snackbar v-model="showError" color="error" location="bottom right">
      載入使用者失敗
      <template v-slot:actions>
        <v-btn variant="text" @click="showError = false">關閉</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { useInfiniteFetch } from '@composable/useInfiniteFetch';
import type { User } from '@types/user';
import debounce from 'lodash-es/debounce';

const searchTerm = ref('');
const debouncedSearchTerm = ref('');
const selectedRole = ref<string>('all');
const sortBy = ref('createdAt');
const sortOrder = ref('desc');
const showError = ref(false);
const limit = 28;

// 選單選項
const sortByOptions = [
  { title: '註冊時間', value: 'createdAt' },
  { title: '暱稱', value: 'name' },
  { title: 'Email', value: 'email' },
];

const sortOrderOptions = [
  { title: '降冪', value: 'desc' },
  { title: '升冪', value: 'asc' },
];

const sortOrderIcon = computed(() =>
  sortOrder.value === 'desc' ? 'mdi-sort-descending' : 'mdi-sort-ascending'
);

const {
  items: users,
  pending,
  loadingMore,
  error,
  fetchItems
} = useInfiniteFetch<User>({
  api: '/api/admin/users',
  limit,
  buildQuery: (skip) => {
    const query: Record<string, any> = {
      limit,
      skip,
      sortBy: sortBy.value,
      order: sortOrder.value,
    };
    if (debouncedSearchTerm.value) {
      query.q = debouncedSearchTerm.value;
    }
    if (selectedRole.value && selectedRole.value !== 'all') {
      query.role = selectedRole.value;
    }
    return query;
  },
  immediate: true
});

watch(searchTerm, debounce((newValue: string) => {
  debouncedSearchTerm.value = newValue;
}, 800));

watch(
  [debouncedSearchTerm, selectedRole, sortBy, sortOrder],
  () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchItems({ reset: true });
  }
);

watch(error, (newError) => {
  if (newError) {
    showError.value = true;
  }
});

onActivated(() => {
  fetchItems({ reset: true });
});

useHead({
  title: '管理會員'
});
</script>

<style scoped>

</style>
