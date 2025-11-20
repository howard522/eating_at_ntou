<template>
  <v-card
      class="mb-4 rounded-lg cursor-pointer"
      elevation="2"
      :to="`/admin/orders/${order.id}`"
      hover
      ripple
  >
    <div class="d-flex align-center flex-wrap px-5 py-3 bg-grey-lighten-4">
      <v-chip
          :color="getStatusColor(order.customerStatus)"
          variant="flat"
          class="font-weight-bold mr-3 text-subtitle-1 px-4"
          label
      >
        {{ getStatusText(order.customerStatus) }}
      </v-chip>

      <span class="text-h6 font-weight-black text-grey-darken-3 mr-auto">
        #{{ order.id.slice(-6).toUpperCase() }}
      </span>

      <span class="text-subtitle-1 font-weight-medium text-grey-darken-2 d-flex align-center mt-2 mt-sm-0">
        <v-icon class="mr-2">mdi-clock-outline</v-icon>
        {{ order.createdAtFormatted }}
      </span>
    </div>

    <v-divider></v-divider>

    <v-card-text class="pa-5">
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-store" color="primary" size="large" class="mr-3"></v-icon>
        <h2 class="text-h5 font-weight-bold text-primary">{{ order.restaurantNames }}</h2>
      </div>

      <v-divider class="mb-4 border-dashed"></v-divider>

      <v-row>
        <v-col cols="12" md="7">
          <v-row>
            <v-col cols="12" sm="6">
              <div class="text-subtitle-1 font-weight-bold text-grey mb-1">顧客資訊</div>
              <div class="text-h6 font-weight-medium text-high-emphasis">
                {{ order.userName }}
              </div>
              <div class="text-body-1 text-grey-darken-3 d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-phone</v-icon>
                {{ order.userPhone }}
              </div>
            </v-col>

            <v-col cols="12" sm="6">
              <div class="text-subtitle-1 font-weight-bold text-grey mb-1">外送員資訊</div>
              <div v-if="order.deliveryPersonName">
                <div class="text-h6 font-weight-medium text-high-emphasis">
                  {{ order.deliveryPersonName }}
                </div>
                <div class="text-body-1 text-grey-darken-3 d-flex align-center">
                  <v-icon size="small" class="mr-2">mdi-phone</v-icon>
                  {{ order.deliveryPersonPhone }}
                </div>
              </div>
              <div v-else class="text-h6 text-grey-lighten-1 font-italic mt-1">
                未指派外送員
              </div>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" md="5" class="d-flex flex-column justify-space-between border-md-left pl-md-6">
          <div class="mb-4">
            <div class="text-subtitle-1 font-weight-bold text-grey mb-1">餐點內容</div>
            <div class="text-body-1 text-grey-darken-3 font-weight-medium text-truncate-2-lines">
              <span v-for="(item, i) in order.items" :key="i" class="mr-3 d-inline-block">
                {{ item.name }} <span class="text-grey-darken-1">x{{ item.quantity }}</span>
                {{ i < order.items.length - 1 ? '、' : '' }}
              </span>
            </div>
          </div>

          <div class="d-flex align-end justify-end flex-column mt-auto">
            <div class="text-body-1 text-grey mb-1">訂單總額 (含運費 ${{ order.deliveryFee }})</div>
            <div class="text-h4 font-weight-black text-green-darken-3">
              NT$ {{ order.total }}
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface DisplayOrder {
  id: string;
  restaurantNames: string;
  userName: string;
  userPhone: string;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  items: { name: string; quantity: number }[];
  total: number;
  deliveryFee: number;
  customerStatus: string;
  createdAtFormatted: string;
}

defineProps<{
  order: DisplayOrder
}>();

const getStatusColor = (status: string) => {
  switch (status) {
    case 'preparing': return 'orange-darken-2';
    case 'on_the_way': return 'info';
    case 'received': return 'purple';
    case 'completed': return 'success';
    default: return 'grey';
  }
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'preparing': '沒人接QAQ',
    'on_the_way': '準備中',
    'received': '已接收',
    'completed': '已完成',
  };
  return map[status] || status;
};
</script>

<style scoped>
.text-truncate-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.border-md-left {
  border-left: 0;
}
@media (min-width: 960px) {
  .border-md-left {
    border-left: 1px solid rgba(0, 0, 0, 0.12);
  }
}
</style>