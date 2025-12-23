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
      <div class="search-container">
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
        <StoreCard :id="store._id" :name="store.name" :image="store.image" :rating="store.rating" />
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
import { useInfiniteFetch } from '@composable/useInfiniteFetch';
import { useCartStore } from '@stores/cart';
import { useUserStore } from '@stores/user';
import debounce from 'lodash-es/debounce';

interface menuItem { _id: string; name: string; price: number; image: string; info: string; }
interface store { _id: string; name: string; address: string; phone: string; image: string; info: string; menu: menuItem[]; rating: number; }
interface PresetLocation { title: string; value: string; }

const presetLocations = [
  { title: '電資暨綜合教學大樓', value: '202基隆市中正區北寧路2號(電資暨綜合教學大樓)' },
  { title: '資工及電機二館', value: '202基隆市中正區北寧路67號(資工及電機二館)' },
  { title: '男一宿舍', value: '202基隆市中正區北寧路2號(男一宿舍)' },
  { title: '男二宿舍', value: '202基隆市中正區北寧路2號(男二宿舍)' },
  { title: '女一宿舍', value: '202基隆市中正區北寧路2號(女一宿舍)' },
  { title: '男三女二宿舍', value: '202基隆市中正區北寧路2號(男三女二宿舍)' },
];
const limit = 28;
const tags = ref<string[]>(['咖哩', '中式', '日式', '義式', '美式', '甜點', '飲料', '速食', '火鍋', '燒烤', '素食', '燒肉', '漢堡', '海鮮', '涼麵', '小吃', '手搖', '下午茶']);

const cartStore = useCartStore();
const userStore = useUserStore();

const searchTerm = ref('');               // 即時輸入
const debouncedSearchTerm = ref('');      // 防抖後的搜尋詞
const selectedTags = ref<string[]>([]);

const addressInput = ref<PresetLocation | string>(cartStore.deliveryAddress || '電資暨綜合教學大樓');
const debouncedAddressInput = ref<PresetLocation | string>(addressInput.value);

// 計算送貨地址
const deliveryAddress = computed(() => {
  const input = debouncedAddressInput.value;
  if (typeof input === 'object' && input !== null && 'value' in input) {
    return input.value;
  }
  const foundLocation = presetLocations.find(loc => loc.title === input);
  return foundLocation ? foundLocation.value : input;
});
const selectedTagsString = computed(() => selectedTags.value.join(' '));
const searchQuery = computed(() => [debouncedSearchTerm.value, selectedTagsString.value].join(' ').trim());
//const stores = computed(() => allStores.value);

// 驗證地址格式
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
};
const addressRule = [ validateAddress ];

// 輸入防抖 watchers
watch(addressInput, debounce((newValue: PresetLocation | string) => {
  debouncedAddressInput.value = newValue;
}, 1000));

watch(searchTerm, debounce((newValue: string) => {
  debouncedSearchTerm.value = newValue;
}, 800));

// 監聽地址輸入，立即儲存至 Store
watch(addressInput, (newVal) => {
  let finalAddress = '';
  if (typeof newVal === 'object' && newVal !== null && 'value' in newVal) {
    finalAddress = newVal.value;
  } else {
    const foundLocation = presetLocations.find(loc => loc.title === newVal);
    finalAddress = foundLocation ? foundLocation.value : (newVal as string);
  }

  if (finalAddress) {
    cartStore.setDeliveryDetails({
      address: finalAddress,
      phone: cartStore.phoneNumber || userStore.info?.phone || '0912345678',
      receiveName: cartStore.receiveName || userStore.info?.name || '劉俊麟',
      note: cartStore.note,
    });
  }
});

onMounted(() => {
  cartStore.loadFromStorage();
  if (cartStore.deliveryAddress) {
    if (addressInput.value !== cartStore.deliveryAddress) {
      addressInput.value = cartStore.deliveryAddress;
      debouncedAddressInput.value = cartStore.deliveryAddress;
    }
  } else {
    cartStore.setDeliveryDetails({
      address: deliveryAddress.value,
      phone: userStore.info?.phone || '0912345678',
      receiveName: userStore.info?.name || '劉俊麟',
      note: cartStore.note,
    });
  }
});

const { items: stores, pending, loadingMore, fetchItems } = useInfiniteFetch<store>({
  api: '/api/restaurants/near',
  limit,
  buildQuery: (skip) => ({
    address: deliveryAddress.value,
    search: searchQuery.value,
    limit,
    skip,
  }),
  immediate: true,
})

// 初次載入與條件變更
watch(
  [deliveryAddress, searchQuery],
  () => {
    const validationResult = validateAddress(debouncedAddressInput.value);
    if (validationResult === true) {
      fetchItems({ reset: true });
    }
  },
  { immediate: true }
);

useHead({ title: '瀏覽店家' });
</script>

<style scoped>
.search-container {
  width: 100%;
  max-width: 1200px;
  height: 60px;
}
</style>