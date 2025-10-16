<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card v-if="item" rounded="lg">
      <v-img :src="item.image" height="200px" cover></v-img>

      <v-card-title class="text-h5 font-weight-bold pt-4">
        {{ item.name }}
      </v-card-title>

      <v-card-text>
        <p class="mb-4">{{ item.info }}</p>
        <p class="text-h6 font-weight-bold mb-4">${{ item.price }}</p>
        <div class="d-flex align-center justify-center">
          <v-btn icon="mdi-minus" variant="tonal" color="grey" @click="decreaseQuantity"></v-btn>
          <span class="mx-6 text-h5 font-weight-bold">{{ quantity }}</span>
          <v-btn icon="mdi-plus" variant="tonal" color="grey" @click="increaseQuantity"></v-btn>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn
            size="large"
            variant="tonal"
            @click="closeDialog"
        >
          取消
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
            color="primary"
            size="large"
            variant="flat"
            @click="confirmAddToCart"
        >
          加入購物車
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
  modelValue: boolean
  item: MenuItem | null
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'addToCart', payload: { item: MenuItem, quantity: number }): void
}>();


const quantity = ref(1);

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const increaseQuantity = () => quantity.value++;
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};
const closeDialog = () => dialog.value = false;

const confirmAddToCart = () => {
  if (!props.item) return;
  emit('addToCart', { item: props.item, quantity: quantity.value });
  closeDialog();
};
</script>