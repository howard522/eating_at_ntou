<template>
  <v-container class="py-8">
    <div v-if="pending" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6">正在載入餐廳資料...</p>
    </div>

    <v-alert v-else-if="error" type="error">
      載入資料時發生錯誤：{{ error?.message || '未知錯誤' }}
    </v-alert>

    <v-row v-else-if="editableStore" justify="center">
      <v-col cols="12" lg="10">
        <v-form ref="form">
          <v-card elevation="2" rounded="lg" class="overflow-visible">
            <!-- 新頂部工具列 -->
            <v-toolbar flat density="comfortable" color="primary" class="rounded-t toolbar-header">
              <v-toolbar-title class="text-h5 font-weight-bold text-white">編輯餐廳：{{ editableStore.name }}</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                class="text-white"
                :to="`/admin/stores/${storeId}/reviews`"
                prepend-icon="mdi-comment-multiple-outline"
              >
                查看評論
              </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4 pa-md-8">
              <!-- 餐廳資訊區 -->
              <h3 class="section-title mb-6">餐廳資訊</h3>
              <v-row>
                <v-col cols="12" md="8">
                  <p class="text-subtitle-2 mb-1 label-required">餐廳名稱＊</p>
                  <v-text-field
                    v-model="editableStore.name"
                    :rules="[(v: string) => !!v || '餐廳名稱為必填。']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="例：海風食堂"
                  ></v-text-field>

                  <p class="text-subtitle-2 mb-1 mt-4 label-required">介紹</p>
                  <v-textarea
                    v-model="editableStore.info"
                    :rules="[(v: string) => !!v || '介紹為必填。']"
                    variant="outlined"
                    rows="3"
                    placeholder="簡述餐廳特色與招牌餐點..."
                  ></v-textarea>

                  <p class="text-subtitle-2 mb-1 mt-4 label-required">地址＊</p>
                  <v-text-field
                    v-model="editableStore.address"
                    :rules="addressRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="例：基隆市中正區 ×× 路 ×× 號"
                    hint="請輸入包含縣市、鄉鎮市區與詳細門牌"
                    persistent-hint
                  ></v-text-field>

                  <p class="text-subtitle-2 mb-1 mt-4 label-required">電話＊</p>
                  <v-text-field
                    v-model="editableStore.phone"
                    :rules="phoneRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="0xxxxxxxxx"
                    hint="格式：0 開頭共 10 碼"
                    persistent-hint
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <p class="text-subtitle-2 mb-2">封面圖片</p>
                  <div class="image-wrapper">
                    <v-img
                      :src="imagePreviewUrl || editableStore.image"
                      :aspect-ratio="16/9"
                      class="rounded-lg border cover-image clickable-cover"
                      cover
                      @click="triggerCoverSelect"
                    >
                      <template #placeholder>
                        <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                          <v-icon color="grey-lighten-1" size="50">mdi-image-plus-outline</v-icon>
                        </v-sheet>
                      </template>
                      <template #error>
                        <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                          <v-icon color="grey-lighten-1" size="50">mdi-image-off-outline</v-icon>
                        </v-sheet>
                      </template>
                      <div class="image-overlay d-flex flex-column align-center justify-center">
                        <v-icon size="40" color="white">mdi-camera</v-icon>
                        <span class="text-caption text-white mt-1">點擊更換圖片</span>
                      </div>
                    </v-img>
                    <input
                      ref="coverFileInput"
                      type="file"
                      accept="image/*"
                      class="d-none"
                      @change="onCoverFileChange"
                    />
                  </div>
                  <p class="text-caption text-medium-emphasis mt-2 text-center">
                    注意：上傳新圖片將會覆蓋現有圖片。
                  </p>
                </v-col>
              </v-row>

              <v-divider class="my-10"></v-divider>

              <!-- 菜單管理區 -->
              <div class="d-flex align-center justify-space-between mb-4">
                <h3 class="section-title mb-0">菜單管理</h3>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="primary"
                  :disabled="isSaving"
                  @click="addMenuItem"
                >
                  <v-icon start>mdi-plus</v-icon>新增項目
                </v-btn>
              </div>

              <v-alert
                v-if="editableStore.menu.length === 0"
                type="info"
                variant="tonal"
                density="comfortable"
                class="mb-6"
              >
                尚未新增餐點，點擊「新增項目」開始建立菜單。
              </v-alert>

              <v-slide-y-transition group tag="div">
                <div
                  v-for="(item, index) in editableStore.menu"
                  :key="item._id || item._key"
                  class="mb-6"
                >
                  <v-card
                    flat
                    border
                    rounded="lg"
                    class="menu-item-card"
                  >
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" sm="4" md="3">
                          <p class="text-subtitle-2 mb-2 ml-1">餐點照片</p>
                          <div class="menu-image-wrapper mx-auto">
                            <v-img
                              :src="item.imagePreviewUrl || item.image"
                              :aspect-ratio="1"
                              class="rounded-lg border clickable-cover"
                              width="150"
                              cover
                              @click="triggerMenuImageSelect(index)"
                            >
                              <template #placeholder>
                                <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                                  <v-icon color="grey-lighten-1" size="40">mdi-image-plus-outline</v-icon>
                                </v-sheet>
                              </template>
                              <template #error>
                                <v-sheet class="d-flex align-center justify-center fill-height" color="grey-lighten-4">
                                  <v-icon color="grey-lighten-1" size="40">mdi-image-off-outline</v-icon>
                                </v-sheet>
                              </template>
                              <div class="menu-image-overlay d-flex flex-column align-center justify-center">
                                <v-icon size="32" color="white">mdi-camera</v-icon>
                                <span class="text-caption text-white mt-1">點擊更換</span>
                              </div>
                            </v-img>
                            <input
                              :ref="el => menuFileInputs[index] = el"
                              type="file"
                              accept="image/*"
                              class="d-none"
                              @change="e => onMenuFileChange(item, e)"
                            />
                          </div>
                        </v-col>

                        <v-col cols="12" sm="8" md="9">
                          <v-row>
                            <v-col cols="12" md="6">
                              <p class="text-subtitle-2 mb-1 label-required">名稱</p>
                              <v-text-field
                                v-model="item.name"
                                :rules="[(v: string) => !!v || '名稱為必填。']"
                                variant="outlined"
                                density="comfortable"
                                placeholder="餐點名稱"
                              ></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6">
                              <p class="text-subtitle-2 mb-1 label-required">價格</p>
                              <v-text-field
                                v-model.number="item.price"
                                type="number"
                                :rules="[(v: number) => v > 0 || '價格必須大於 0。']"
                                variant="outlined"
                                density="comfortable"
                                suffix="元"
                                placeholder="0"
                              ></v-text-field>
                            </v-col>
                          </v-row>
                          <p class="text-subtitle-2 mb-1 mt-2 label-required">介紹</p>
                          <v-textarea
                            v-model="item.info"
                            :rules="[(v: string) => !!v || '介紹為必填。']"
                            variant="outlined"
                            rows="3"
                            density="comfortable"
                            placeholder="此餐點的特色與口味說明"
                          ></v-textarea>
                        </v-col>
                      </v-row>
                      <div class="d-flex justify-end mt-2">
                        <v-btn
                          color="error"
                          variant="text"
                          size="small"
                          prepend-icon="mdi-delete-outline"
                          @click="removeMenuItem(index)"
                        >
                          移除
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </v-slide-y-transition>

              <!-- 動作列 -->
              <div class="form-actions sticky-actions">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  :loading="isSaving"
                  :disabled="isSaving"
                  @click="saveStore"
                >
                  儲存所有變更
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user';
import { useSnackbarStore } from '@utils/snackbar';
import { useRoute } from 'vue-router';

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
    editableStore.value.menu.unshift({
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

// 圖片處理邏輯 (移植自 new.vue)
const coverFileInput = ref<HTMLInputElement | null>(null);
const triggerCoverSelect = () => coverFileInput.value?.click();
const onCoverFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    imageFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
};

const menuFileInputs = ref<HTMLInputElement[]>([]);
const triggerMenuImageSelect = (idx: number) => {
  menuFileInputs.value[idx]?.click();
};
const onMenuFileChange = (item: MenuItem, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    item.imageFile = file;
    item.imagePreviewUrl = URL.createObjectURL(file);
  }
};

useHead({
  title: () => editableStore.value ? `編輯：${editableStore.value.name}` : "修改餐廳"
});
</script>

<style scoped>
/* 版面與結構強化 */
.toolbar-header {
  background: linear-gradient(135deg, var(--v-theme-primary) 0%, var(--v-theme-primary-darken-1) 100%);
}

.section-title {
  font-weight: 600;
  position: relative;
  padding-left: 14px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  border-radius: 2px;
  background: var(--v-theme-primary);
}

.label-required::after {
  color: var(--v-theme-error);
  margin-left: 4px;
  font-weight: 600;
}

.form-actions {
  margin-top: 24px;
}
.sticky-actions {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding-top: 8px;
  padding-bottom: 8px;
  box-shadow: 0 -4px 12px -6px rgba(0,0,0,.12);
  backdrop-filter: saturate(180%) blur(6px);
  border-top: 1px solid rgba(0,0,0,0.06);
  z-index: 10;
}

/* 圖片區與懸浮效果 */
.image-wrapper,
.menu-image-wrapper {
  position: relative;
}
.cover-image,
.menu-image-wrapper .v-img {
  transition: box-shadow .25s, transform .25s;
}
.cover-image:hover,
.menu-image-wrapper .v-img:hover {
  box-shadow: 0 6px 18px -6px rgba(0,0,0,.25);
  transform: translateY(-2px);
}
.image-overlay,
.menu-image-overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: linear-gradient(145deg, rgba(0,0,0,.55), rgba(0,0,0,.25));
  transition: opacity .25s;
  border-radius: inherit;
  pointer-events: none;
}
.image-wrapper:hover .image-overlay,
.menu-image-wrapper:hover .menu-image-overlay {
  opacity: 1;
}

/* 菜單項目卡片 */
.menu-item-card {
  transition: box-shadow .25s, transform .25s, border-color .25s;
  background: linear-gradient(145deg, #ffffff 0%, #fafafa 100%);
}
.menu-item-card:hover {
  box-shadow: 0 6px 24px -8px rgba(0,0,0,.25);
  transform: translateY(-3px);
  border-color: var(--v-theme-primary);
}

/* 自適應細節 */
@media (max-width: 600px) {
  .sticky-actions {
    box-shadow: 0 -3px 10px -6px rgba(0,0,0,.18);
  }
  .section-title {
    font-size: 1.05rem;
  }
}

.clickable-cover {
  cursor: pointer;
}
.clickable-cover:hover {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}
.d-none {
  display: none;
}
</style>