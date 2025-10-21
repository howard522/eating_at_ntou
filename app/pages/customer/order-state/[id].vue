<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <div class="text-center mt-4 mb-8">
          <h1 class="text-h3 font-weight-bold mb-2">訂單已送出！</h1>
          <p class="text-h6 text-medium-emphasis">
            您可以在下方追蹤您的訂單狀態
          </p>
        </div>

        <div class="d-flex align-center justify-center my-10 px-md-4">
          <template v-for="(step, index) in steps" :key="step.id">
            <div class="d-flex flex-column align-center">
              <v-icon
                  v-if="step.id < currentStep"
                  color="success"
                  size="40"
              >
                mdi-check-circle
              </v-icon>

              <v-sheet
                  v-else-if="step.id === currentStep"
                  color="primary"
                  rounded="circle"
                  width="40"
                  height="40"
                  class="d-flex align-center justify-center"
              >
                <span class="text-h6 font-weight-bold text-white">{{ step.id }}</span>
              </v-sheet>

              <v-sheet
                  v-else
                  border
                  rounded="circle"
                  width="40"
                  height="40"
                  class="d-flex align-center justify-center"
              >
                <span class="text-h6 font-weight-bold text-medium-emphasis">{{ step.id }}</span>
              </v-sheet>

              <div
                  class="text-body-1 font-weight-medium mt-2"
                  :class="{
                  'font-weight-bold text-primary': step.id === currentStep,
                  'text-medium-emphasis': step.id > currentStep,
                }"
                  style="white-space: nowrap"
              >
                {{ step.title }}
              </div>
            </div>

            <template v-if="index < steps.length - 1">
              <v-divider
                  class="mx-4"
                  style="flex-grow: 1"
                  :color="step.id < currentStep ? 'success' : 'grey-darken-2'"
                  thickness="2"
              ></v-divider>
            </template>
          </template>
        </div>
        <v-card flat border rounded="lg" class="mb-6">
          <v-list-item lines="two" class="pa-5">
            <template v-slot:prepend>
              <v-avatar size="56" class="me-4">
                <v-img :src="deliver.img" cover>
                  <template #error>
                    <v-sheet
                        color="white"
                        rounded="circle"
                        width="56"
                        height="56"
                        class="d-flex align-center justify-center"
                    >
                      <v-icon color="blue" size="30">mdi-account</v-icon>
                    </v-sheet>
                  </template>
                </v-img>
              </v-avatar>
            </template>
            <v-list-item-title class="text-h6 font-weight-bold mb-1">
              外送員：{{ deliver.name }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ deliver.status }}</v-list-item-subtitle>
            <template v-slot:append>
              <span class="text-body-1 font-weight-medium text-medium-emphasis">{{ deliver.phone }}</span>
            </template>
          </v-list-item>
        </v-card>

        <v-card flat border rounded="lg" class="mb-6">
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="text-h6 font-weight-bold mb-4">餐點資訊</h3>
                <div
                    v-for="item in order.items"
                    :key="item.id"
                    class="text-body-1 mb-2"
                >
                  {{ item.name }} x {{ item.quantity }}
                </div>
                <v-divider class="my-4"></v-divider>
                <div class="text-h6 font-weight-bold">
                  總計 ${{ order.total }}
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="text-h6 font-weight-bold mb-4">餐廳資訊</h3>
                <div
                    v-for="restaurant in order.restaurants"
                    :key="restaurant.id"
                    class="text-body-1 mb-2"
                >
                  {{ restaurant.name }} ({{ restaurant.phone }})
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-btn
            color="success"
            block
            size="x-large"
            class="mt-4"
            @click="markAsDelivered"
        >
          <span class="text-h6 font-weight-bold">已接收</span>
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const steps = ref([
  { id: 1, title: '準備中' },
  { id: 2, title: '在路上' },
  { id: 3, title: '已接收' },
  { id: 4, title: '已完成' },
]);

// 之後根據id打api拿到訂單資料
// const router = useRoute();
// const orderId = route.params.id;
const currentStep = ref(3);
// 外送員資訊
const deliver = ref({
  name: '王大明',
  phone: '0987654321',
  img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSF6jwre87YE2xVWsEpo-X0jVkGsQ5WbSF96Q&s",
  status: '正在為您配送中...',
});
// 訂單資訊
const order = ref({
  items: [
    { id: 1, name: '無骨鹹酥雞 (大份)', quantity: 2 },
    { id: 2, name: '紅燒牛肉麵', quantity: 1 },
  ],
  restaurants: [
    { id: 1, name: '阿姨鹹酥雞', phone: '(02) 24621111' },
    { id: 2, name: '巷口牛肉麵', phone: '(02) 24682222' },
  ],
  total: 290,
});

const markAsDelivered = () => {
  // 打api更新狀態為已接收
  currentStep.value = 4;
  // 如果外送員點了已送達，更新狀態為已完成
  currentStep.value = 5;
};

useHead({
  title: '訂單狀態',
});
</script>