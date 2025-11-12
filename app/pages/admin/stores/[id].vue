<template>
  <v-container>
    <div v-if="pending" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6">正在載入餐廳資料...</p>
    </div>

    <v-alert v-else-if="error" type="error">
      載入資料時發生錯誤：{{ error?.message || '未知錯誤' }}
    </v-alert>

    <v-form v-else-if="editableStore" ref="form">
      <v-card flat border>
        <v-card-title class="text-h5 font-weight-bold border-b pa-4">
          編輯餐廳：{{ editableStore.name }}
        </v-card-title>

        <v-card-text class="pa-6">
          <h3 class="text-h6 mb-4">餐廳資訊</h3>
          <v-row>
            <v-col cols="12" md="8">
              <p class="text-subtitle-2 mb-1">餐廳名稱</p>
              <v-text-field v-model="editableStore.name" :rules="[(v: string) => !!v || '餐廳名稱為必填。']" variant="outlined" density="comfortable"></v-text-field>

              <p class="text-subtitle-2 mb-1 mt-2">介紹</p>
              <v-textarea v-model="editableStore.info" :rules="[(v: string) => !!v || '介紹為必填。']" variant="outlined" rows="3"></v-textarea>

              <p class="text-subtitle-2 mb-1 mt-2">地址</p>
              <v-text-field v-model="editableStore.address" :rules="addressRules" variant="outlined" density="comfortable"></v-text-field>

              <p class="text-subtitle-2 mb-1 mt-2">電話</p>
              <v-text-field v-model="editableStore.phone" :rules="phoneRules" variant="outlined" density="comfortable"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <p class="text-subtitle-2 mb-1">封面圖片</p>
              <v-img :src="imagePreviewUrl || editableStore.image" :aspect-ratio="16/9" class="rounded-lg border" cover>
                <template #error>
                  <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                    <v-icon color="grey-lighten-1" size="50">mdi-image-off-outline</v-icon>
                  </v-sheet>
                </template>
              </v-img>
              <v-file-input
                  v-model="imageFile"
                  label="上傳新圖片"
                  variant="outlined" density="comfortable" class="mt-4"
                  accept="image/*" prepend-icon="mdi-camera"
                  @update:modelValue="previewMainImage"
              ></v-file-input>
              <p class="text-caption text-medium-emphasis mt-1">
                注意：上傳新圖片將會覆蓋現有圖片。
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-8"></v-divider>

          <h3 class="text-h6 mb-4">菜單管理</h3>

          <div v-for="(item, index) in editableStore.menu" :key="item._id || item._key" class="mb-4">
            <v-card flat border>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="3" class="text-center">
                    <p class="text-subtitle-2 mb-2">餐點照片</p>
                    <v-img
                        :src="item.imagePreviewUrl || item.image"
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
            儲存所有變更
          </v-btn>
        </v-card-text>
      </v-card>
    </v-form>
  </v-container>

</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUserStore } from '@stores/user'
import { useSnackbarStore } from '../../../utils/snackbar'

interface MenuItem {
  _key?: string; // 本地新增、尚未儲存的項目
  _id?: string; // 資料庫中的 ID
  name: string;
  price: number;
  info: string;
  image: string;
  imageFile?: File | null;
  imagePreviewUrl?: string;
}
interface Store {
  _id: string;
  name: string;
  info: string;
  address: string;
  phone: string;
  image: string;
  menu: MenuItem[];
}
interface ApiResponse {
  success: boolean
  data: Store
}

const route = useRoute();
const storeId = route.params.id as string;
const userStore = useUserStore();

const form = ref<any>(null);
const editableStore = ref<Store | null>(null);
const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | undefined>(undefined);
const isSaving = ref(false);
const snackbarStore = useSnackbarStore()

const pendingDeletionMenuIds = ref<string[]>([]);


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

const { data: apiResponse, pending, error, refresh } = useFetch<ApiResponse>(
    `/api/restaurants/${storeId}`
)
watch(apiResponse, (newApiResponse) => {
  if (newApiResponse && newApiResponse.data) {
    const storeData = JSON.parse(JSON.stringify(newApiResponse.data));
    if (storeData.menu) {
      storeData.menu.forEach((item: MenuItem) => {
        item.imageFile = null;
        item.imagePreviewUrl = undefined;
      });
    }
    editableStore.value = storeData;
  }
}, { immediate: true });

const saveStore = async () => {
  if (!editableStore.value || !form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) {
    snackbarStore.showSnackbar('請修正表單中的錯誤後再儲存。', 'error')
    return
  }
  isSaving.value = true;

  const savePromises: Promise<any>[] = [];
  const headers = {
    'Authorization': `Bearer ${userStore.token}`,
  };

  // 更新餐聽資訊
  const storeFormData = new FormData();
  storeFormData.append('name', editableStore.value.name);
  storeFormData.append('info', editableStore.value.info);
  storeFormData.append('address', editableStore.value.address);
  storeFormData.append('phone', editableStore.value.phone);
  if (imageFile.value) {
    storeFormData.append('image', imageFile.value);
  }
  savePromises.push($fetch(
      `/api/admin/restaurants/${storeId}`,
      { method: 'PATCH', headers, body: storeFormData }
  ));

  // 更新餐點資訊
  for (const item of editableStore.value.menu) {
    const menuFormData = new FormData();
    menuFormData.append('name', item.name);
    menuFormData.append('price', item.price.toString());
    menuFormData.append('info', item.info);
    if (item.imageFile) {
      menuFormData.append('image', item.imageFile);
    }
    if (item._id) {
      savePromises.push($fetch(
          `/api/admin/restaurants/${storeId}/menu/${item._id}`,
          { method: 'PATCH', headers, body: menuFormData }
      ));
    } else if (item._key) {
      savePromises.push($fetch(
          `/api/admin/restaurants/${storeId}/menu`,
          { method: 'POST', headers, body: menuFormData }
      ));
    }
  }

  // 刪除餐點
  for (const menuId of pendingDeletionMenuIds.value) {
    savePromises.push($fetch(
        `/api/admin/restaurants/${storeId}/menu/${menuId}`,
        { method: 'DELETE', headers }
    ));
  }

  try {
    const results = await Promise.allSettled(savePromises);
    let hasError = false;
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        hasError = true;
        console.error(`第 ${index + 1} 個儲存任務失敗:`, result.reason);
      }
    });
    if (hasError) {
      snackbarStore.showSnackbar('部分資料儲存失敗，請檢查主控台(console)錯誤訊息。', 'error')
    } else {
      snackbarStore.showSnackbar('儲存成功！', 'success')
      pendingDeletionMenuIds.value = [];
    }
    await refresh();

  } catch (e) {
    console.error('儲存過程中發生嚴重錯誤:', e);
    snackbarStore.showSnackbar('儲存過程中發生嚴重錯誤。', 'error')
  } finally {
    isSaving.value = false
  }
};

const addMenuItem = () => {
  if (editableStore.value) {
    editableStore.value.menu.push({
      _key: `new_${Date.now()}_${Math.random()}`,
      name: '',
      price: 0,
      info: '',
      image: '',
      imageFile: null,
      imagePreviewUrl: undefined,
    });
  }
};

const removeMenuItem = (index: number) => {
  if (editableStore.value) {
    const item = editableStore.value.menu[index];
    if (item._id) {
      pendingDeletionMenuIds.value.push(item._id);
    }
    editableStore.value.menu.splice(index, 1);
  }
};

const previewMainImage = () => {
  if (imageFile.value) {
    imagePreviewUrl.value = URL.createObjectURL(imageFile.value);
  } else {
    imageFile.value = null;
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
  title: () => editableStore.value ? `編輯：${editableStore.value.name}` : "修改餐廳"
});
</script>

<style scoped>

</style>