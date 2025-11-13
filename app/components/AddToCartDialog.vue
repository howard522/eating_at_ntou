<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card v-if="item" rounded="lg">
      <v-img :src="item.image" height="200px" cover ref="itemImg"></v-img>

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

        <v-alert
          :type="isInCart ? 'success' : 'info'"
          variant="tonal"
          density="comfortable"
          :icon="hintIcon"
          class="mt-4"
        >
          {{ hintText }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn
            size="large"
            variant="tonal"
            @click="closeDialog"
        >
          再想想
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
            color="primary"
            size="large"
            variant="flat"
            @click="confirmAddToCart"
        >
          {{ isInCart ? '再來一份' : '馬上冰！' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useCartStore } from '@stores/cart';
import { createCartImageAnimator } from '@utils/cartAnimation';

interface MenuItem {
  _id: string
  name: string
  price: number
  image: string
  info: string
}

// 動畫相關
const cartIconEl = inject('cartIconEl') as Ref<HTMLElement | null>;
const itemImg = ref<any>(null);
const {
  floatingImages,
  createFloatingImage,
  removeOneFloatingImage,
  flyAllImagesToCart,
  clearFloatingImages,
  flyOneImageToCartFrom
} = createCartImageAnimator(cartIconEl);


// 監聽 dialog 關閉，決定播放音效
const addToCartSuccess = ref(false);

const playSound = (type: 'clap' | 'cry') => {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.volume = 0.6;
  audio.play();
};

const props = defineProps<{
  modelValue: boolean
  item: MenuItem | null
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'addToCart', payload: { item: MenuItem, quantity: number }): void
}>();

const quantity = ref(1);

// 判斷是否已加入冰箱
const cartStore = useCartStore();
const isInCart = computed(() => {
  if (!props.item) return false;
  return cartStore.items?.some(i => i.menuItemId === props.item!._id) ?? false;
});
const hintText = computed(() => isInCart.value ? '冰箱內已有該餐點' : '此餐點還沒冰入購物冰箱');
const hintIcon = computed(() => isInCart.value ? 'mdi-check-circle-outline' : 'mdi-information-outline');

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// 調整餐點數量
const increaseQuantity = () => {
  quantity.value++;
  if (props.item) {
    createFloatingImage(props.item.image);
  }
};
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
    removeOneFloatingImage();
  }
};
const closeDialog = () => dialog.value = false;

const confirmAddToCart = () => {
  if (!props.item) return;
  if (floatingImages.value.length === 0) {
    const originEl = itemImg.value?.$el || itemImg.value;
    if (originEl) {
      flyOneImageToCartFrom(props.item.image, originEl);
    }
  } else {
    flyAllImagesToCart();
  }
  emit('addToCart', { item: props.item, quantity: quantity.value });
  addToCartSuccess.value = true;
  closeDialog();
};

watch(dialog, (val, oldVal) => {
  if (val && !oldVal) {
    quantity.value = 1;
  }
  if (oldVal && !val) {
    if (!addToCartSuccess.value) {
      clearFloatingImages();
    }
    if (addToCartSuccess.value) {
      playSound('clap');
    } else {
      playSound('cry');
    }
    addToCartSuccess.value = false;
  }
});

watch(() => props.item, (newItem) => {
  if (newItem) {
    quantity.value = 1;
    clearFloatingImages();
  }
});
</script>