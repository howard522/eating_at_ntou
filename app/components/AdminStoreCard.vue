<template>
  <v-card
    flat
    border
    rounded="lg"
    class="d-flex flex-row align-center pa-3 pa-sm-4 h-100 transition-swing cursor-pointer"
    @click="navigateToEdit"
  >
    <!-- Image -->
    <v-avatar size="72" rounded="lg" class="mr-3 d-flex d-sm-none border bg-grey-lighten-5 flex-shrink-0">
      <v-img :src="image" :alt="name" cover>
        <template #error>
          <div class="d-flex align-center justify-center fill-height text-grey-lighten-1">
            <v-icon size="32">mdi-store-outline</v-icon>
          </div>
        </template>
      </v-img>
    </v-avatar>

    <v-avatar size="88" rounded="lg" class="mr-5 d-none d-sm-flex border bg-grey-lighten-5 flex-shrink-0">
      <v-img :src="image" :alt="name" cover>
        <template #error>
          <div class="d-flex align-center justify-center fill-height text-grey-lighten-1">
            <v-icon size="40">mdi-store-outline</v-icon>
          </div>
        </template>
      </v-img>
    </v-avatar>

    <!-- Content -->
    <div class="flex-grow-1 min-w-0">
      <div class="d-flex align-center mb-1 flex-wrap">
        <div class="text-subtitle-1 text-sm-h6 font-weight-bold text-truncate mr-2 mr-sm-3 text-high-emphasis">{{ name }}</div>
        <v-chip
          v-if="rating > 0"
          size="x-small"
          color="amber-darken-2"
          variant="flat"
          class="font-weight-bold px-2"
        >
          {{ rating.toFixed(1) }}
          <v-icon start size="x-small" icon="mdi-star" class="ml-1"></v-icon>
        </v-chip>
        <v-chip v-else size="x-small" variant="tonal" color="grey">無評價</v-chip>
      </div>

      <div class="text-caption text-sm-body-2 text-medium-emphasis d-flex align-center flex-wrap gap-2 gap-sm-4 mt-1 mt-sm-2">
        <div class="d-flex align-center">
          <v-icon size="small" start color="primary" class="mr-1">mdi-phone-outline</v-icon>
          {{ phone || '未提供' }}
        </div>
        <div class="d-flex align-center">
          <v-icon size="small" start color="primary" class="mr-1">mdi-silverware-fork-knife</v-icon>
          {{ count || 0 }} 項餐點
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="d-flex align-center gap-1 gap-sm-2 ml-2 ml-sm-4">
      <v-btn
        variant="text"
        color="medium-emphasis"
        prepend-icon="mdi-comment-text-outline"
        class="d-none d-sm-flex"
        @click.stop="navigateToReviews"
      >
        評論
      </v-btn>
      <v-btn
        icon="mdi-comment-text-outline"
        variant="text"
        color="medium-emphasis"
        class="d-flex d-sm-none"
        size="small"
        @click.stop="navigateToReviews"
      ></v-btn>

      <v-btn
        variant="tonal"
        color="primary"
        prepend-icon="mdi-pencil"
        class="d-none d-sm-flex px-4"
        rounded="pill"
      >
        編輯
      </v-btn>
       <v-btn
        icon="mdi-pencil"
        variant="tonal"
        color="primary"
        class="d-flex d-sm-none"
        rounded="circle"
        size="small"
      ></v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps({
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
  rating: {
    type: Number,
    default: 0,
  },
});

const router = useRouter();

const navigateToEdit = () => {
  router.push(`/admin/stores/${props.id}`);
};

const navigateToReviews = () => {
  router.push(`/admin/stores/${props.id}/reviews`);
};
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.gap-sm-4 {
  gap: 16px;
}
.min-w-0 {
  min-width: 0;
}
.cursor-pointer {
  cursor: pointer;
}
</style>