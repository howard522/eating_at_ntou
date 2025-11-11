<template>
  <v-card variant="flat" class="rounded-lg d-flex align-center pa-3 border-b menu-item-card" @click="onAddClick">

    <v-avatar size="80" rounded="lg" class="mr-4 image-container">
      <v-img :src="item.image" cover class="menu-item-image">
        <template #error>
          <v-sheet
              class="d-flex align-center justify-center fill-height"
              style="background-color: #F8E8EE;"
          >
            <span class="text-h6 font-weight-bold" style="color: #E0B4C3;">???</span>
          </v-sheet>
        </template>
      </v-img>
    </v-avatar>

    <div class="flex-grow-1">
      <h3 class="font-weight-bold text-subtitle-1 mb-1 item-name">{{ item.name }}</h3>
      <p class="text-medium-emphasis text-body-2 mb-2 item-info">{{ item.info }}</p>
      <div class="d-flex align-center">
        <span class="text-primary font-weight-bold text-subtitle-1">${{ item.price }}</span>
        <v-chip
          v-if="isInCart"
          size="small"
          color="success"
          variant="tonal"
          class="ml-2"
          prepend-icon="mdi-fridge-outline"
        >
          已在冰箱
        </v-chip>
      </div>
    </div>

    <div class="ml-4">
      <v-btn
          icon="mdi-plus"
          color="primary"
          variant="flat"
          rounded="circle"
          @click="onAddClick"
      ></v-btn>
    </div>

  </v-card>
</template>

<script setup lang="ts">
import { useCartStore } from '@stores/cart';

interface MenuItem {
  _id: string
  name: string
  price: number
  image: string
  info: string
}

const props = defineProps<{
  item: MenuItem
}>();

const emit = defineEmits<{
  (e: 'open-add-dialog', item: MenuItem): void
}>();

const onAddClick = () => {
  emit('open-add-dialog', props.item);
};

const cartStore = useCartStore();
const isInCart = computed(() => cartStore.items?.some(i => i._id === props.item._id) ?? false);
</script>

<style scoped>
.item-name {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.item-info {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.menu-item-card {
  transition: transform 0.3s ease !important;
  background-color: #FFFFFF !important;
}

.menu-item-card:hover {
  background-color: #FFFFFF !important;
}

.image-container {
  overflow: hidden;
}

.menu-item-image {
  transition: transform 0.3s ease;
}

.menu-item-card:hover .menu-item-image {
  transform: scale(1.05);
}
</style>
