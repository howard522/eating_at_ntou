<template>
  <v-container>
    <div v-if="pending">
      <v-skeleton-loader type="image, article, list-item-two-line@3"></v-skeleton-loader>
    </div>

    <v-alert
        v-else-if="error || !store"
        type="error"
        title="載入失敗"
        text="找不到該餐廳的資訊，或載入時發生錯誤。"
        variant="tonal"
    ></v-alert>

    <div v-else>
      <v-img
          :src="store.image"
          height="300px"
          cover
          class="mb-6 rounded-lg"
      >
        <template v-slot:error>
          <v-sheet
              color="grey-lighten-2"
              class="d-flex align-center justify-center fill-height"
          >
            <v-icon color="grey-darken-1" size="80">mdi-image-off-outline</v-icon>
          </v-sheet>
        </template>
      </v-img>

      <v-row>
        <v-col cols="12" md="8">
          <h1 class="text-h3 font-weight-bold mb-2">{{ store.name }}</h1>
          <div class="mb-4">
            <v-chip
                v-for="tag in store.tags"
                :key="tag"
                class="mr-2"
                color="blue-grey"
                size="small"
                variant="tonal"
            >
              {{ tag }}
            </v-chip>
          </div>

          <p class="text-body-1 mb-4">{{ store.info }}</p>
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2" color="grey-darken-1">mdi-map-marker-outline</v-icon>
            <span>{{ store.address }}</span>
          </div>
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="grey-darken-1">mdi-phone-outline</v-icon>
            <span>{{ store.phone }}</span>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <h2 class="text-h4 font-weight-bold mb-4">菜單</h2>
      <v-list lines="two" bg-color="transparent">
        <v-list-item
            v-for="item in store.menu"
            :key="item._id"
            class="mb-2"
        >
          <template v-slot:prepend>
            <v-avatar size="64" rounded="lg">
              <v-img :src="item.image" cover></v-img>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-bold">{{ item.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.info }}</v-list-item-subtitle>

          <template v-slot:append>
            <span class="text-h6 font-weight-bold text-green-darken-1">${{ item.price }}</span>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </v-container>
</template>

<script setup lang="ts">
interface MenuItem { _id: string; name: string; price: number; image: string; info: string; }
interface Store { _id: string; name: string; address: string; phone: string; image: string; info: string; tags: string[]; menu: MenuItem[]; }
interface ApiResponse { success: boolean; data: Store; }


const route = useRoute();
const storeId = route.params.id as string;

const { data: apiResponse, pending, error } = await useFetch<ApiResponse>(`/api/restaurants/${storeId}`);

const store = computed(() => apiResponse.value?.data);

useHead({
  title: () => store.value?.name || '餐廳資訊'
});
</script>