<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex flex-column mb-4">
          <span class="text-grey-darken-1 mb-1">外送至</span>
          <div v-if="!isEditingAddress" class="d-flex align-center cursor-pointer" @click="startEditingAddress">
            <span class="text-h6 font-weight-bold">{{ deliveryAddress }}</span>
            <v-icon color="primary">mdi-chevron-down</v-icon>
          </div>
          <v-text-field v-else v-model="deliveryAddress" variant="solo" autofocus hide-details density="compact" prepend-inner-icon="mdi-map-marker-outline" append-inner-icon="mdi-check" @click:append-inner="saveAddress" @keydown.enter="saveAddress" style="max-width: 450px;"></v-text-field>
        </div>
      </v-col>
    </v-row>
    <v-row class="mt-n4">
      <v-col cols="12">
        <v-text-field
            v-model="searchTerm"
            label="搜尋餐廳、美食"
            variant="solo"
            prepend-inner-icon="mdi-magnify"
            clearable
            rounded
            hide-details
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-chip-group v-if="tags.length > 0" v-model="selectedTag" selected-class="text-primary" mandatory>
          <v-chip value="全部">全部</v-chip>
          <v-chip
              v-for="tag in tags"
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
        <StoreCard :name="store.name" :image="store.image" />
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

interface menuItem { _id: string; name: string; price: number; image: string; info: string; }
interface store { _id: string; name: string; address: string; phone: string; image: string; info: string; tags: string[]; menu: menuItem[]; }

const isEditingAddress = ref(false);
const deliveryAddress = ref('海洋大學工學大樓');
const startEditingAddress = () => { isEditingAddress.value = true; };
const saveAddress = () => { isEditingAddress.value = false; };

const { data: apiResponse, error } = await useFetch('/api/restaurants');

const stores = computed(() => apiResponse.value?.data || []);

const tags = computed<string[]>(() => {
  if (!apiResponse.value || !apiResponse.value.data) {
    return [];
  }
  const allTags = new Set(apiResponse.value.data.flatMap(restaurant => restaurant.tags || []));
  return [...allTags];
});

</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>