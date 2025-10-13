<template>
  <v-card hover rounded="lg">
    <v-img
        :src="image"
        height="150px"
        cover
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

    <v-card-title class="text-center font-weight-bold">
      {{ name }}
    </v-card-title>
  </v-card>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>

</style>