<template>
  <v-card variant="flat" class="d-flex align-center pa-3 border-b">

    <v-avatar size="80" rounded="lg" class="mr-4">
      <v-img :src="item.image" cover>
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
      <h3 class="font-weight-bold text-subtitle-1 mb-1">{{ item.name }}</h3>
      <p class="text-medium-emphasis text-body-2 mb-2">{{ item.info }}</p>
      <span class="text-primary font-weight-bold text-subtitle-1">${{ item.price }}</span>
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
</script>