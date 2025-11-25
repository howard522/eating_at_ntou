<template>

  <v-card class="rounded-lg store-card" :to="`/customer/stores/${id}`">

    <div class="image-container">
      <v-img
          :src="image"
          height="150px"
          cover
          class="store-image"
      >
        <template v-slot:error>
          <div
              class="d-flex align-center justify-center fill-height"
              style="background-color: #E0E0E0;"
          >
            <span class="text-h3 text-white font-weight-bold letter-spacing-lg">
              ? ? ? ? ?
            </span>
          </div>
        </template>
      </v-img>
    </div>

    <v-card-title class="font-weight-bold">
      {{ name }}
    </v-card-title>

    <v-card-subtitle class="mt-1 mb-1 store-info-subtitle">
      {{ info }}
    </v-card-subtitle>
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
  info: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.store-card {
  transition: transform 0.3s ease !important;
  background-color: #FFFFFF !important;
  min-height: 230px;
  display: flex;
  flex-direction: column;
}

.store-card:hover {
  background-color: #FFFFFF !important;
}

.image-container {
  overflow: hidden;
}

.store-image {
  transition: transform 0.3s ease;
}

.store-card:hover .store-image {
  transform: scale(1.05);
}

.store-info-subtitle {
  min-height: 24px;
  display: block;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>