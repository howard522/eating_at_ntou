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

const cartIconEl = inject('cartIconEl') as Ref<HTMLElement | null>;
const itemImg = ref<any>(null);

const animateToCart = (imageSrc: string) => {
  const originEl = itemImg.value?.$el || itemImg.value;
  const cartEl = cartIconEl.value;
  if (!originEl || !cartEl) return;

  const originRect = originEl.getBoundingClientRect();
  const cartRect = cartEl.getBoundingClientRect();

  const layer = document.body;

  const preload = new Image();
  preload.src = imageSrc;

  const run = (naturalW: number, naturalH: number) => {

    const scale0 = Math.min(originRect.width / naturalW, originRect.height / naturalH);
    const w0 = naturalW * scale0;
    const h0 = naturalH * scale0;
    const left0 = originRect.left + (originRect.width - w0) / 2;
    const top0 = originRect.top + (originRect.height - h0) / 2;

    const imgEl = document.createElement('img');
    imgEl.src = imageSrc;
    imgEl.style.position = 'fixed';
    imgEl.style.left = `${left0}px`;
    imgEl.style.top = `${top0}px`;
    imgEl.style.width = `${w0}px`;
    imgEl.style.height = `${h0}px`;

    imgEl.style.objectFit = 'contain';
    imgEl.style.objectPosition = 'center';
    imgEl.style.borderRadius = '0';
    imgEl.style.zIndex = '9999';
    imgEl.style.pointerEvents = 'none';
    imgEl.style.transform = 'translate3d(0,0,0) scale(1)';
    imgEl.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease';
    layer.appendChild(imgEl);

    const imgCenterX = left0 + w0 / 2;
    const imgCenterY = top0 + h0 / 2;
    const cartCenterX = cartRect.left + cartRect.width / 2;
    const cartCenterY = cartRect.top + cartRect.height / 2;

    const translateX = cartCenterX - imgCenterX;
    const translateY = cartCenterY - imgCenterY;

    const finalScale = Math.max(20 / w0, 20 / h0);

    requestAnimationFrame(() => {
      imgEl.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${finalScale}) rotate(360deg)`;
      imgEl.style.opacity = '0.2';
    });

    setTimeout(() => {
      imgEl.remove();
      cartEl.classList.add('cart-shake');
      setTimeout(() => {
        cartEl.classList.remove('cart-shake');
      }, 400);
    }, 650);
  };

  preload.onload = () => run(preload.naturalWidth, preload.naturalHeight);
  preload.onerror = () => run(originRect.width, originRect.height);
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
  animateToCart(props.item.image);
  emit('addToCart', { item: props.item, quantity: quantity.value });
  closeDialog();
};

watch(() => props.item, (newItem) => {
  if (newItem) {
    quantity.value = 1;
  }
});
</script>