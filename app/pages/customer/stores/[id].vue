<template>
  <div>
    <!--圖片區-->
    <v-img
      :src="store?.image"
      height="350px"
      cover
      class="w-100 position-relative"
    >
      <template #error>
        <v-sheet
          color="grey-lighten-2"
          class="d-flex align-center justify-center fill-height"
        >
          <v-icon color="grey-darken-1" size="80">
            mdi-image-off-outline
          </v-icon>
        </v-sheet>
      </template>
    </v-img>

    <!--懸浮資訊卡-->
    <v-container class="px-4">
      <v-card
        class="info-card mx-auto px-6 py-5"
        max-width="900"
        elevation="8"
      >
        <h1 class="text-h4 font-weight-bold mb-2">{{ store?.name }}</h1>
        <p class="text-body-1 mb-4">{{ store?.info }}</p>

        <div class="d-flex align-center mb-2">
          <v-icon class="mr-2" color="grey-darken-1">mdi-map-marker-outline</v-icon>
          <span>{{ store?.address }}</span>
        </div>
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="grey-darken-1">mdi-phone-outline</v-icon>
          <span>{{ store?.phone }}</span>
        </div>
      </v-card>
    </v-container>

    <!--菜單內容-->
    <v-container class="menu-info pt-0 mt-n10">
      <h2 class="text-h4 font-weight-bold mb-4">菜單</h2>

      <v-row>
        <v-col
            v-for="item in store?.menu"
            :key="item._id"
            cols="12"
            md="6"
        >
          <MenuItemCard
              :item="item"
              @open-add-dialog="openDialog"
          />
        </v-col>
      </v-row>
    </v-container>

    <AddToCartDialog
        v-model="isDialogOpen"
        :item="selectedItem"
        @add-to-cart="handleAddToCart"
    />
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '../../../../stores/cart';

interface MenuItem {
  _id: string
  name: string
  price: number
  image: string
  info: string
}
interface Store {
  _id: string
  name: string
  address: string
  phone: string
  image: string
  info: string
  tags: string[]
  menu: MenuItem[]
}
interface ApiResponse {
  success: boolean
  data: Store
}

const route = useRoute();
const storeId = route.params.id as string;

const { data: apiResponse, pending, error } = useFetch<ApiResponse>(
  `/api/restaurants/${storeId}`
)
const store = computed(() => apiResponse.value?.data);
const cartStore = useCartStore();
const isDialogOpen = ref(false);
const selectedItem = ref<MenuItem | null>(null);
const openDialog = (item: MenuItem) => {
  selectedItem.value = item;
  isDialogOpen.value = true;
};

const handleAddToCart = (payload: { item: MenuItem, quantity: number }) => {
  cartStore.addItem(
      payload.item,
      payload.quantity,
      { id: store.value._id, name: store.value.name }
  );
};

useHead({
  title: () => store.value?.name || '餐廳資訊'
});
</script>

<style scoped>
.position-relative {
  position: relative;
}

.info-card {
  position: relative;
  top: -100px;
  border-radius: 20px;
  background-color: white;
  z-index: 2;
}

.w-100 {
  width: 100%;
}


.info-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: -1;
}

.menu-info {
  position: relative;
  top: -60px;
}
</style>
