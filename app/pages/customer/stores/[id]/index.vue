<template>
  <div>
    <v-img
        :src="store?.image"
        height="400px"
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

    <v-container class="px-4">
      <v-card
          class="info-card mx-auto px-6 py-5"
          max-width="950"
          elevation="8"
      >
        <h1 class="text-h4 font-weight-bold mb-1 store-name">{{ store?.name }}</h1>

        <div class="d-flex align-center mb-4">
          <template v-if="store?.rating && store.rating > 0">
            <span class="text-h6 font-weight-bold text-high-emphasis mr-2">
              {{ store.rating.toFixed(1) }}
            </span>
            <v-rating
                :model-value="store.rating"
                color="amber"
                active-color="amber"
                half-increments
                readonly
                density="compact"
                size="small"
            ></v-rating>
          </template>

          <template v-else>
            <span class="text-body-1 text-grey">尚無評價</span>
          </template>
        </div>
        <p class="text-body-1 mb-4">{{ store?.info }}</p>

        <div class="d-flex align-center mb-2">
          <v-icon class="mr-2" color="grey-darken-1">mdi-map-marker-outline</v-icon>
          <span>{{ store?.address }}</span>
        </div>
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="grey-darken-1">mdi-phone-outline</v-icon>
          <span>{{ store?.phone }}</span>
        </div>

        <v-divider class="my-4"></v-divider>
        <v-btn
            block
            color="primary"
            variant="tonal"
            prepend-icon="mdi-comment-text-outline"
            :to="`/customer/stores/${storeId}/reviews`"
            height="45"
        >
          查看評論 / 撰寫評論
        </v-btn>

      </v-card>
    </v-container>

    <v-container class="menu-info pt-0 mt-n10">
      <h2 class="text-h4 font-weight-bold mb-4">菜單</h2>

      <v-row>
        <v-col
            v-for="item in store?.menu"
            :key="item._id"
            cols="12"
            sm="6"
            md="4"
            lg="4"
            class = "pa-2"
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
import { useCartStore } from '@stores/cart';

interface MenuItem {
  menuItemId: string
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
  menu: MenuItem[]
  rating: number
}

interface ApiResponse {
  success: boolean
  data: Store
}

const route = useRoute();
const storeId = route.params.id as string;

const { data: apiResponse, refresh } = useFetch<ApiResponse>(
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

const handleAddToCart = (payload: { item, quantity: number }) => {
  cartStore.addItem(
      {
        menuItemId: payload.item._id,
        name: payload.item.name,
        price: payload.item.price,
        image: payload.item.image,
        info: payload.item.info
      },
      payload.quantity,
      { id: store.value._id, name: store.value.name }
  );
};

onActivated(() => {
  refresh();
});

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
  top: -110px;
  border-radius: 20px;
  background-color: white;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  z-index: 2;
}

.w-100 {
  width: 100%;
}

.store-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-info {
  position: relative;
  top: -60px;
}
</style>