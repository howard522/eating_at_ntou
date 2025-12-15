<template>
  <v-card flat border :to="`/admin/stores/${id}`">
    <v-card-text class="d-flex align-center">
      <v-avatar
          size="80"
          rounded="lg"
          class="mr-4"
      >
        <v-img :src="image" :alt="name" cover></v-img>
      </v-avatar>

      <div class="flex-grow-1">
        <div class="text-h6 font-weight-bold">{{ name }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          <span>電話: {{ phone || '未提供' }}</span>
          <span class="mx-2">|</span>
          <span>菜單數量: {{ count || 0 }}</span>
        </div>
      </div>

      <v-btn
          color="primary"
          variant="flat"
          :to="`/admin/stores/${id}/reviews`"
          class="ms-4 me-2 flex-shrink-0"
      >
        查看評論
      </v-btn>

      <v-btn
          color="red-lighten-2"
          variant="flat"
          :to="`/admin/stores/${id}`"
          class="flex-shrink-0"
      >
        編輯
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  count: {
    type: Number,
    default: 0,
  },
});
</script>
