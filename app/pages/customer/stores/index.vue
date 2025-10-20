<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex flex-column mb-4">
          <span class="text-grey-darken-1 mb-1">外送至</span>
          <v-combobox
              v-model="addressInput"
              :items="presetLocations"
              item-title="title"
              item-value="title"
              :rules="addressRule"
              label="輸入地址或選擇預設地點"
              variant="solo"
              prepend-inner-icon="mdi-map-marker-outline"
              clearable
              style="max-width: 450px;"
          ></v-combobox>
        </div>
      </v-col>
    </v-row>

    <v-row class="mt-n4">
      <div style="width: 1200px; height: 60px;">
        <v-text-field
          v-model="searchTerm"
          label="搜尋餐廳、美食"
          variant="solo"
          prepend-inner-icon="mdi-magnify"
          rounded
          density="comfortable"
        ></v-text-field>
      </div>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-chip-group v-if="tags.length > 0" v-model="selectedTags" multiple>
          <v-chip
              v-for="tag in tags"
              filter
              :key="tag"
              :value="tag"
          >
            {{ tag }}
          </v-chip>
        </v-chip-group>
      </v-col>
    </v-row>

    <v-row v-if="pending">
      <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="image, article"></v-skeleton-loader>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
          v-for="store in stores"
          :key="store._id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <StoreCard :id="store._id" :name="store.name" :image="store.image" :info="store.info" />
      </v-col>
    </v-row>

    <v-row v-if="loadingMore" class="mt-4">
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="image, article"></v-skeleton-loader>
      </v-col>
    </v-row>

    <v-row v-if="stores && stores.length === 0" class="mt-10">
      <v-col cols="12" class="text-center text-grey">
        <v-icon size="50">mdi-store-search-outline</v-icon>
        <p class="mt-4 text-h6">找不到符合條件的店家</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import debounce from 'lodash-es/debounce';

interface menuItem { _id: string; name: string; price: number; image: string; info: string; }
interface store { _id: string; name: string; address: string; phone: string; image: string; info: string; menu: menuItem[]; }
interface apiResponse { success: boolean; data: store[]; count: number; }
interface PresetLocation { title: string; value: string; }

const presetLocations = [
  { title: '電資暨綜合教學大樓', value: '202基隆市中正區北寧路2號' },
  { title: '資工及電機二館', value: '202基隆市中正區北寧路67號' },
  { title: '男一宿舍', value: '202基隆市中正區北寧路2號' },
  { title: '男二宿舍', value: '202基隆市中正區北寧路2號' },
  { title: '女一宿舍', value: '202基隆市中正區北寧路2號' },
  { title: '男三女二宿舍', value: '202基隆市中正區北寧路2號' },
];
const tags = ref<string[]>(['咖哩', '中式', '日式', '義式', '美式', '甜點', '飲料', '速食', '火鍋', '燒烤', '素食', '燒肉', '漢堡', '海鮮', '涼麵', '小吃', '手搖', '下午茶']);

const searchTerm = ref('');
const debouncedSearchTerm = ref('');
const selectedTags = ref<string[]>([]);
const addressInput = ref<PresetLocation | string>('電資暨綜合教學大樓');
const debouncedAddressInput = ref<PresetLocation | string>(addressInput.value);
const limit = 28;
const offset = ref(0);
const allStores = ref<store[]>([]);
const loadingMore = ref(false);
const hasMore = ref(true);

const deliveryAddress = computed(() => {
  const input = debouncedAddressInput.value;
  if (typeof input === 'object' && input !== null && 'value' in input) {
    return input.value;
  }
  const foundLocation = presetLocations.find(loc => loc.title === input);
  return foundLocation ? foundLocation.value : input;
});

const validateAddress = (value: PresetLocation | string): boolean | string => {
  if (!value) return '必須輸入地址';
  if (typeof value === 'object') {
    return true;
  }
  if (presetLocations.some(loc => loc.title === value)) {
    return true;
  }
  const regex = /(?<zipcode>(^\d{5}|^\d{3})?)(?<city>\D+[縣市])(?<district>\D+?(市區|鎮區|鎮市|[鄉鎮市區]))(?<others>.+)/;
  return regex.test(value) || '輸入地址格式錯誤';
}
//判斷地址格式
const addressRule = [ validateAddress ];

//停止輸入1s後才更新輸入地址
watch(addressInput, debounce((newValue: PresetLocation | string) => {
  debouncedAddressInput.value = newValue;
}, 1000));

//停止輸入800ms後才更新搜尋內容
watch(searchTerm, debounce((newValue: string) => {
  debouncedSearchTerm.value = newValue;
}, 800));

const selectedTagsString = computed(() => selectedTags.value.join(' '));
const searchQuery = computed(() => [debouncedSearchTerm.value, selectedTagsString.value].join(' ').trim());

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const handleScroll = debounce(() => {
  if (!hasMore.value || loadingMore.value) return;
  
  // 檢查是否滾動到底部
  const bottom = Math.ceil(window.innerHeight + window.pageYOffset);
  const height = document.documentElement.scrollHeight;
  
  if (bottom >= height - 100) {
    loadMore();
  }
}, 200);

// 載入更多資料
const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return;
  
  loadingMore.value = true;
  const nextOffset = offset.value + limit;
  
  try {
    const response = await $fetch<apiResponse>('/api/restaurants/near', {
      query: {
        address: deliveryAddress.value,
        search: searchQuery.value,
        limit: limit,
        skip: nextOffset,
      },
    });
    
    if (response.data && response.data.length > 0) {
      allStores.value.push(...response.data);
      offset.value = nextOffset;
      hasMore.value = response.data.length >= limit;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('載入更多資料失敗:', error);
  } finally {
    loadingMore.value = false;
  }
};

const { data: apiResponse, pending, error, execute } = useFetch<apiResponse>('/api/restaurants/near', {
  query: {
    address: deliveryAddress,
    search: searchQuery,
    limit: limit,
  },
  immediate: false,
  watch: false,
  default: () => ({ success: true, count: 0, data: [] }),
  transform: (response) => {
    offset.value = 0;
    allStores.value = response.data;
    hasMore.value = response.data.length >= limit;
    return response;
  },
});

const stores = computed(() => allStores.value);

watch(
    [deliveryAddress, searchQuery],
    () => {
      const validationResult = validateAddress(debouncedAddressInput.value);
      if (validationResult === true) {
        execute();
      }
    },
    {
      immediate: true,
    }
);
</script>

<style scoped>

</style>