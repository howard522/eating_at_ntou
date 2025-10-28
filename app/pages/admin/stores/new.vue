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
              <v-text-field v-model="newStore.name" :rules="[(v: string) => !!v || '餐廳名稱為必填。']" variant="outlined" density="comfortable"></v-text-field>

              <p class="text-subtitle-2 mb-1 mt-2">介紹</p>
              <v-textarea v-model="newStore.info" :rules="[(v: string) => !!v || '介紹為必填。']" variant="outlined" rows="3"></v-textarea>

              <p class="text-subtitle-2 mb-1 mt-2">地址</p>
              <v-text-field v-model="newStore.address" :rules="addressRules" variant="outlined" density="comfortable"></v-text-field>

              <p class="text-subtitle-2 mb-1 mt-2">電話</p>
              <v-text-field v-model="newStore.phone" :rules="phoneRules" variant="outlined" density="comfortable"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <p class="text-subtitle-2 mb-1">封面圖片</p>
              <v-img
                  :src="imagePreviewUrl"
                  :aspect-ratio="16/9"
                  class="rounded-lg border"
                  cover
              >
                <v-sheet v-if="!imagePreviewUrl" class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                  <div class="text-center text-grey-lighten-1">
                    <v-icon size="50">mdi-image-off-outline</v-icon>
                    <p class="mt-2">尚未上傳圖片</p>
                  </div>
                </v-sheet>
              </v-img>
              <v-file-input
                  v-model="imageFile"
                  label="上傳封面圖片"
                  variant="outlined" density="comfortable" class="mt-4"
                  accept="image/*" prepend-icon="mdi-camera"
                  @update:modelValue="previewMainImage"
              ></v-file-input>
            </v-col>
          </v-row>

          <v-divider class="my-8"></v-divider>

          <h3 class="text-h6 mb-4">菜單管理</h3>
          <div v-if="newStore.menu.length === 0" class="text-center text-grey-lighten-1 pa-4 mb-4 border rounded">
            點擊下方按鈕新增第一個菜單項目
          </div>
          <div v-for="(item, index) in newStore.menu" :key="item._key" class="mb-4">
            <v-card flat border>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="3" class="text-center">
                    <p class="text-subtitle-2 mb-2">餐點照片</p>
                    <v-img
                        :src="item.imagePreviewUrl"
                        :aspect-ratio="1"
                        class="rounded-lg border mx-auto"
                        width="150"
                        cover
                    >
                      <template #error>
                        <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                          <v-icon color="grey-lighten-1" size="40">mdi-image-off-outline</v-icon>
                        </v-sheet>
                      </template>
                    </v-img>
                    <v-file-input
                        v-model="item.imageFile"
                        label="上傳圖片"
                        variant="underlined" density="compact" class="mt-2"
                        accept="image/*" prepend-icon="mdi-camera"
                        hide-details clearable
                        @update:modelValue="() => previewMenuImage(item)"
                    ></v-file-input>
                  </v-col>
                  <v-col cols="12" md="9">
                    <v-row>
                      <v-col cols="12" md="6">
                        <p class="text-subtitle-2 mb-1">名稱</p>
                        <v-text-field v-model="item.name" :rules="[(v: string) => !!v || '名稱為必填。']" variant="outlined" density="comfortable"></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <p class="text-subtitle-2 mb-1">價格</p>
                        <v-text-field v-model.number="item.price" type="number" :rules="[(v: number) => v > 0 || '價格必須大於 0。']" variant="outlined" density="comfortable" prefix="$"></v-text-field>
                      </v-col>
                    </v-row>
                    <p class="text-subtitle-2 mb-1 mt-2">介紹</p>
                    <v-textarea v-model="item.info" :rules="[(v: string) => !!v || '介紹為必填。']" variant="outlined" rows="3" density="comfortable"></v-textarea>
                  </v-col>
                </v-row>
                <div class="d-flex justify-end mt-n4">
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

          <v-btn color="red" size="large" block class="mt-4" :loading="isSaving" @click="createStore">
            建立新餐廳
          </v-btn>
        </v-card-text>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
interface MenuItem {
  _key: string | number;
  name: string;
  price: number;
  info: string;
  image: string;
  imageFile?: File;
  imagePreviewUrl?: string;
}
interface Store {
  _id?: string;
  name: string;
  info: string;
  address: string;
  phone: string;
  image?: string;
  menu: MenuItem[];
}

const form = ref<any>(null);
const isSaving = ref(false);
const newStore = ref<Store>({
  name: '',
  info: '',
  address: '',
  phone: '',
  menu: [],
});
const imageFile = ref<File>(null);
const imagePreviewUrl = ref<string | undefined>(undefined);

const addressRules = [
  (value: string) => !!value || '外送地址為必填欄位。',
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

const createStore = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) {
    alert('請修正表單中的錯誤後再建立。');
    return;
  }
  isSaving.value = true;

  const formData = new FormData();
  formData.append('name', newStore.value.name);
  formData.append('info', newStore.value.info);
  formData.append('address', newStore.value.address);
  formData.append('phone', newStore.value.phone);
  if (imageFile.value) {
    formData.append('image', imageFile.value);
  }
  const cleanMenu = newStore.value.menu.map((item, index) => {
    if (item.imageFile && item.imageFile instanceof File) {
      formData.append(`menuImage_${index}`, item.imageFile);
    }
    const { imageFile, imagePreviewUrl, _key, ...rest } = item;
    return rest;
  });
  formData.append('menu', JSON.stringify(cleanMenu));
  // 之後會改成用api新增到db
  // try {
  //   await $fetch('/api/restaurants', {
  //     method: 'POST',
  //     body: formData,
  //   });
  // } catch (e) {
  //   console.error('Failed to create store:', e);
  //   alert('新增失敗，請檢查 Console 中的錯誤訊息。');
  // } finally {
  //   isSaving.value = false;
  // }
  isSaving.value = false;
  alert("新增成功!");
};

const addMenuItem = () => {
  newStore.value.menu.push({
    _key: `new_${Date.now()}_${Math.random()}`,
    name: '',
    price: 0,
    info: '',
    image: '',
    imageFile: undefined,
    imagePreviewUrl: undefined,
  });
};

const removeMenuItem = (index: number) => {
  if (newStore.value) {
    newStore.value.menu.splice(index, 1);
  }
};

const previewMainImage = () => {
  if (imageFile.value) {
    imagePreviewUrl.value = URL.createObjectURL(imageFile.value);
  } else {
    imagePreviewUrl.value = undefined;
  }
};

const previewMenuImage = (item: MenuItem) => {
  if (item.imageFile) {
    const file = item.imageFile;
    item.imagePreviewUrl = URL.createObjectURL(file);
  } else {
    item.imagePreviewUrl = undefined;
  }
};

useHead({
  title: () => "新增餐廳"
});
</script>

<style scoped>

</style>