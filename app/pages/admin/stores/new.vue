<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <v-form ref="form">
          <v-card elevation="2" rounded="lg" class="overflow-visible">
            <!-- 新頂部工具列 -->
            <v-toolbar flat density="comfortable" color="primary" class="rounded-t toolbar-header">
              <v-toolbar-title class="text-h5 font-weight-bold text-white">新增餐廳</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn variant="text" class="text-white" :disabled="isSaving" @click="resetForm">
                重置
              </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4 pa-md-8">
              <!-- 餐廳資訊區 -->
              <h3 class="section-title mb-6">餐廳資訊</h3>
              <v-row>
                <v-col cols="12" md="8">
                  <p class="text-subtitle-2 mb-1 label-required">餐廳名稱＊</p>
                  <v-text-field
                    v-model="newStore.name"
                    :rules="[(v: string) => !!v || '餐廳名稱為必填。']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="例：海風食堂"
                  ></v-text-field>

                  <p class="text-subtitle-2 mb-1 mt-4 label-required">介紹</p>
                  <v-textarea
                    v-model="newStore.info"
                    :rules="[]"
                    variant="outlined"
                    rows="3"
                    placeholder="簡述餐廳特色與招牌餐點..."
                  ></v-textarea>

                  <p class="text-subtitle-2 mb-1 mt-4 label-required">地址＊</p>
                  <v-text-field
                    v-model="newStore.address"
                    :rules="addressRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="例：基隆市中正區 ×× 路 ×× 號"
                    hint="請輸入包含縣市、鄉鎮市區與詳細門牌"
                    persistent-hint
                  ></v-text-field>

                  <p class="text-subtitle-2 mb-1 mt-4 label-required">電話＊</p>
                  <v-text-field
                    v-model="newStore.phone"
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
                      :src="imagePreviewUrl"
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
                          <v-icon color="grey-lighten-1" size="50">mdi-image-plus-outline</v-icon>
                        </v-sheet>
                      </template>
                      <div class="image-overlay d-flex flex-column align-center justify-center">
                        <v-icon size="40" color="white">mdi-camera</v-icon>
                        <span class="text-caption text-white mt-1">點擊選擇圖片</span>
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
                v-if="menuItems.length === 0"
                type="info"
                variant="tonal"
                density="comfortable"
                class="mb-6"
              >
                尚未新增餐點，點擊「新增項目」開始建立菜單。
              </v-alert>

              <v-slide-y-transition group tag="div">
                <div
                  v-for="(item, index) in menuItems"
                  :key="item._key"
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
                              :src="item.imagePreviewUrl || ''"
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
                                  <v-icon color="grey-lighten-1" size="40">mdi-image-plus-outline</v-icon>
                                </v-sheet>
                              </template>
                              <div class="menu-image-overlay d-flex flex-column align-center justify-center">
                                <v-icon size="32" color="white">mdi-camera</v-icon>
                                <span class="text-caption text-white mt-1">點擊選擇圖片</span>
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
                            :rules="[]"
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
                  建立餐廳
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
const snackbarStore = useSnackbarStore();
const router = useRouter();

const form = ref<any>(null);
const isSaving = ref(false);
const errorMessage = ref('');

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


// 主圖片預覽
const previewMainImage = (file?: File) => {
  if (file) {
    newStore.value.imageFile = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
  } else {
    newStore.value.imageFile = null;
    imagePreviewUrl.value = undefined;
  }
};

// 菜單圖片預覽
const previewMenuImage = (item: MenuItem, file: File) => {
  if (file) {
    item.imageFile = file;
    item.imagePreviewUrl = URL.createObjectURL(file);
  } else {
    item.imageFile = null;
    item.imagePreviewUrl = undefined;
  }
};

const saveStore = async () => {
  if (!form.value) return;
  errorMessage.value = ''
  const { valid } = await form.value.validate();
  if (!valid) {
    errorMessage.value = '請修正表單中的錯誤後再儲存。';
    snackbarStore.showSnackbar(errorMessage.value, 'error');
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
          errorMessage.value = `第 ${index + 1} 個餐點新增失敗: ${result.reason}`;
          snackbarStore.showSnackbar(errorMessage.value, 'error');
        }
      });
    }
    snackbarStore.showSnackbar('餐廳建立成功！', 'success');
    resetForm();
    await router.push(`/admin/stores/${newRestaurantId}`);
  } catch (e: any) {
    console.error('建立過程中發生錯誤:', e);
    errorMessage.value = `建立失敗：${e.message || '請檢查主控台(console)錯誤訊息。'}`;
    snackbarStore.showSnackbar(errorMessage.value, 'error');
  } finally {
    isSaving.value = false;
  }
};

const addMenuItem = () => {
  menuItems.value.unshift({
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

const coverFileInput = ref<HTMLInputElement | null>(null);
const triggerCoverSelect = () => coverFileInput.value?.click();
const onCoverFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  previewMainImage(file);
};

const menuFileInputs = ref<HTMLInputElement[]>([]);
const triggerMenuImageSelect = (idx: number) => {
  menuFileInputs.value[idx]?.click();
};
const onMenuFileChange = (item: MenuItem, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  previewMenuImage(item, file);
};

useHead({
  title: "新增餐廳"
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
}

.dashed-border {
  border: 2px dashed var(--v-theme-primary);
  background: rgba(0,0,0,0.02);
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