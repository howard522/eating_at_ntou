<template>
  <v-container>
    <v-form ref="form">
      <v-card flat border>
        <v-card-title class="text-h5 font-weight-bold border-b pa-4">
          新增餐廳
        </v-card-title>

        <v-card-text class="pa-6">
          <h3 class="text-h6 mb-4">餐廳資訊</h3>
          <v-row>
            <v-col cols="12" md="8">
              <p class="text-subtitle-2 mb-1">餐廳名稱</p>
              <v-text-field
                  v-model="newStore.name"
                  :rules="[(v: string) => !!v || '餐廳名稱為必填。']"
                  variant="outlined"
                  density="comfortable"
              ></v-text-field>

              <p class="text-subtitle-2 mb-1 mt-2">介紹</p>
              <v-textarea
                  v-model="newStore.info"
                  :rules="[(v: string) => !!v || '介紹為必填。']"
                  variant="outlined"
                  rows="3"
              ></v-textarea>

              <p class="text-subtitle-2 mb-1 mt-2">地址</p>
              <v-text-field
                  v-model="newStore.address"
                  :rules="addressRules"
                  variant="outlined"
                  density="comfortable"
              ></v-text-field>

              <p class="text-subtitle-2 mb-1 mt-2">電話</p>
              <v-text-field
                  v-model="newStore.phone"
                  :rules="phoneRules"
                  variant="outlined"
                  density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <p class="text-subtitle-2 mb-1">封面圖片</p>
              <v-img :src="imagePreviewUrl" :aspect-ratio="16/9" class="rounded-lg border" cover>
                <template #error>
                  <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                    <v-icon color="grey-lighten-1" size="50">mdi-image-plus-outline</v-icon>
                  </v-sheet>
                </template>
                <v-sheet
                    v-if="!imagePreviewUrl"
                    class="d-flex align-center justify-center fill-height"
                    color="grey-lighten-4"
                >
                  <v-icon color="grey-lighten-1" size="50">mdi-image-plus-outline</v-icon>
                </v-sheet>
              </v-img>
              <v-file-input
                  label="上傳封面圖片"
                  variant="outlined"
                  density="comfortable"
                  class="mt-4"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  @update:modelValue="previewMainImage"
              ></v-file-input>
            </v-col>
          </v-row>

          <v-divider class="my-8"></v-divider>

          <h3 class="text-h6 mb-4">菜單管理</h3>

          <div v-for="(item, index) in menuItems" :key="item._key" class="mb-4">
            <v-card flat border>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="3" class="text-center">
                    <p class="text-subtitle-2 mb-2">餐點照片</p>
                    <v-img
                        :src="item.imagePreviewUrl || ''"
                        :aspect-ratio="1"
                        class="rounded-lg border mx-auto"
                        width="150"
                        cover
                    >
                      <template #error>
                        <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                          <v-icon color="grey-lighten-1" size="40">mdi-image-plus-outline</v-icon>
                        </v-sheet>
                      </template>
                      <v-sheet
                          v-if="!item.imagePreviewUrl"
                          class="d-flex align-center justify-center fill-height"
                          color="grey-lighten-4"
                      >
                        <v-icon color="grey-lighten-1" size="40">mdi-image-plus-outline</v-icon>
                      </v-sheet>
                    </v-img>
                    <v-file-input
                        label="上傳圖片"
                        variant="underlined"
                        density="compact"
                        class="mt-2"
                        accept="image/*"
                        prepend-icon="mdi-camera"
                        hide-details
                        @update:modelValue="previewMenuImage(item, $event)"
                    ></v-file-input>
                  </v-col>

                  <v-col cols="12" md="9">
                    <v-row>
                      <v-col cols="12" md="6">
                        <p class="text-subtitle-2 mb-1">名稱</p>
                        <v-text-field
                            v-model="item.name"
                            :rules="[(v: string) => !!v || '名稱為必填。']"
                            variant="outlined"
                            density="comfortable"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <p class="text-subtitle-2 mb-1">價格</p>
                        <v-text-field
                            v-model.number="item.price"
                            type="number"
                            :rules="[(v: number) => v > 0 || '價格必須大於 0。']"
                            variant="outlined"
                            density="comfortable"
                            prefix="$"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <p class="text-subtitle-2 mb-1 mt-2">介紹</p>
                    <v-textarea
                        v-model="item.info"
                        :rules="[(v: string) => !!v || '介紹為必填。']"
                        variant="outlined"
                        rows="3"
                        density="comfortable"
                    ></v-textarea>
                  </v-col>
                </v-row>
                <div class="d-flex justify-end">
                  <v-btn color="grey" variant="text" icon="mdi-delete-outline" @click="removeMenuItem(index)"></v-btn>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <v-btn block size="large" variant="tonal" class="dashed-border mt-4" @click="addMenuItem">
            <v-icon start>mdi-plus</v-icon>
            新增菜單項目
          </v-btn>

          <v-divider class="my-8"></v-divider>

          <v-btn
              color="primary"
              size="large"
              block
              class="mt-4"
              :loading="isSaving"
              @click="saveStore"
          >
            建立餐廳
          </v-btn>
        </v-card-text>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user';
import { useRouter } from 'vue-router';

interface MenuItem {
  _key: string;
  name: string;
  price: number;
  info: string;
  imageFile?: File | null;
  imagePreviewUrl?: string;
}
interface Store {
  name: string;
  info: string;
  address: string;
  phone: string;
  imageFile?: File | null;
}

interface RestaurantApiResponse {
  success: boolean;
  restaurant: {
    _id: string;
    [key: string]: any;
  };
}

const userStore = useUserStore();
const router = useRouter();

const form = ref<any>(null);
const isSaving = ref(false);

const newStore = ref<Store>({
  name: '',
  info: '',
  address: '',
  phone: '',
  imageFile: null,
});
const imagePreviewUrl = ref<string | undefined>(undefined);

const menuItems = ref<MenuItem[]>([]);

const addressRules = [
  (value: string) => !!value || '餐廳地址為必填欄位。',
  (value: string) => {
    const regex = /(?<zipcode>(^\d{5}|^\d{3})?)(?<city>\D+[縣市])(?<district>\D+?(市區|鎮區|鎮市|[鄉鎮市區]))(?<others>.+)/;
    return regex.test(value) || '地址格式不正確，請輸入完整地址。';
  },
];
const phoneRules = [
  (value: string) => !!value || '聯絡電話為必填欄位。',
  (value: string) => {
    const regex = /^0\d{9}$/;
    return regex.test(value) || '請輸入有效的 10 位電話號碼 (格式為 0xxxxxxxxx)。';
  },
];

const getDefaultStore = (): Store => ({
  name: '',
  info: '',
  address: '',
  phone: '',
  imageFile: null,
});

const resetForm = () => {
  newStore.value = getDefaultStore();
  menuItems.value = [];
  imagePreviewUrl.value = undefined;
  if (form.value) {
    form.value.resetValidation();
  }
};



const saveStore = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) {
    alert('請修正表單中的錯誤後再儲存。');
    return;
  }
  isSaving.value = true;
  const headers = {
    'Authorization': `Bearer ${userStore.token}`,
  };

  try {
    // 新增餐聽
    const storeFormData = new FormData();
    storeFormData.append('name', newStore.value.name);
    storeFormData.append('info', newStore.value.info);
    storeFormData.append('address', newStore.value.address);
    storeFormData.append('phone', newStore.value.phone);
    if (newStore.value.imageFile) {
      storeFormData.append('image', newStore.value.imageFile);
    }
    const restaurantResponse = await $fetch<RestaurantApiResponse>(
        `/api/admin/restaurants`,
        { method: 'POST', headers, body: storeFormData }
    );
    if (!restaurantResponse.success || !restaurantResponse.restaurant._id) {
      throw new Error('建立餐廳失敗，未收到餐廳 ID。');
    }
    const newRestaurantId = restaurantResponse.restaurant._id;

    // 新增餐點資訊
    if (menuItems.value.length > 0) {
      const menuPromises: Promise<any>[] = [];

      for (const item of menuItems.value) {
        const menuFormData = new FormData();
        menuFormData.append('name', item.name);
        menuFormData.append('price', item.price.toString());
        menuFormData.append('info', item.info);
        if (item.imageFile) {
          menuFormData.append('image', item.imageFile);
        }
        menuPromises.push($fetch(
            `/api/admin/restaurants/${newRestaurantId}/menu`,
            { method: 'POST', headers, body: menuFormData }
        ));
      }
      const results = await Promise.allSettled(menuPromises);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`第 ${index + 1} 個餐點新增失敗:`, result.reason);
        }
      });
    }
    alert('餐廳建立成功！');
    resetForm();
    await router.push(`/admin/stores/${newRestaurantId}`);
  } catch (e: any) {
    console.error('建立過程中發生錯誤:', e);
    alert(`建立失敗：${e.message || '請檢查主控台(console)錯誤訊息。'}`);
  } finally {
    isSaving.value = false;
  }
};

const addMenuItem = () => {
  menuItems.value.push({
    _key: `new_${Date.now()}_${Math.random()}`,
    name: '',
    price: 0,
    info: '',
    imageFile: null,
    imagePreviewUrl: undefined,
  });
};

const removeMenuItem = (index: number) => {
  menuItems.value.splice(index, 1);
};

const previewMainImage = (files: File) => {
  if (files) {
    newStore.value.imageFile = files;
    imagePreviewUrl.value = URL.createObjectURL(files);
  } else {
    newStore.value.imageFile = null;
    imagePreviewUrl.value = undefined;
  }
};

const previewMenuImage = (item: MenuItem, files: File) => {
  if (files) {
    item.imageFile = files;
    item.imagePreviewUrl = URL.createObjectURL(files);
  } else {
    item.imageFile = null;
    item.imagePreviewUrl = undefined;
  }
};

useHead({
  title: "新增餐廳"
});
</script>

<style scoped>

</style>