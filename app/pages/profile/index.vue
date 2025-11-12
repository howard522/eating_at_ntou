<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card flat border rounded="lg">
          <v-card-text class="pa-4">
            <v-btn
                color="primary"
                variant="flat"
                class="font-weight-bold"
                style="position: absolute; top: 16px; right: 16px"
                @click="userStore.logout()"
                to="/login"
            >
              登出
            </v-btn>

            <div class="text-center mt-2 mb-6">
              <!-- 點擊頭像觸發裁切對話框 -->
              <v-avatar color="primary" size="80" class="cursor-pointer" @click="showCropper = true">
                <v-img
                    :src="imagePreviewUrl || userStore.info?.img"
                    cover
                ></v-img>
              </v-avatar>
              <h2 class="text-h5 font-weight-bold mt-2">
                {{ userStore.info?.name }}
              </h2>
              <p class="text-body-1 text-medium-emphasis mb-0">
                {{ userStore.info?.email }}
              </p>
            </div>

            <!-- 裁切頭像 Dialog -->
            <v-dialog v-model="showCropper" max-width="600">
              <v-card>
                <v-card-title class="font-weight-bold">裁切頭像</v-card-title>
                <v-card-text>
                  <AvatarCropper @cropped="onAvatarCropped"/>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="showCropper = false">取消</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-form @submit.prevent="saveChanges">
              <div class="mb-2">
                <p class="text-caption text-medium-emphasis mb-n1">暱稱</p>
                <v-text-field
                    v-model="formData.name"
                    variant="plain"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <div class="mb-2">
                <p class="text-caption text-medium-emphasis mb-n1">
                  預設外送地址
                </p>
                <v-text-field
                    v-model="formData.address"
                    variant="plain"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <div class="mb-2">
                <p class="text-caption text-medium-emphasis mb-n1">聯絡電話</p>
                <v-text-field
                    v-model="formData.phone"
                    variant="plain"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <div class="mb-2">
                <p class="text-caption text-medium-emphasis mb-n1">舊密碼密碼</p>
                <v-text-field
                    v-model="formData.currentPassword"
                    variant="plain"
                    type="password"
                    placeholder="留空表示不修改"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <div class="mb-2">
                <p class="text-caption text-medium-emphasis mb-n1">新密碼</p>
                <v-text-field
                    v-model="formData.password"
                    variant="plain"
                    type="password"
                    placeholder="留空表示不修改"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <div class="mb-2">
                <p class="text-caption text-medium-emphasis mb-n1">確認密碼</p>
                <v-text-field
                    v-model="formData.passwordConfirm"
                    variant="plain"
                    type="password"
                    placeholder="請再次輸入新密碼"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <v-btn
                  type="submit"
                  color="primary"
                  block
                  size="large"
                  class="mt-4"
                  :disabled="saving"
              >
                <span class="text-h6 font-weight-bold">儲存變更</span>
              </v-btn>
            </v-form>

            <v-divider class="my-4"></v-divider>

            <div class="text-center">
              <v-btn
                  variant="outlined"
                  color="primary"
                  block
                  size="large"
                  :disabled="roleButton.disabled"
                  class="mb-0"
                  @click="manageRole"
              >
                <span class="text-body-1 font-weight-bold">{{ roleButton.text }}</span>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user'
import { useSnackbarStore } from '@utils/snackbar'

const userStore = useUserStore()
const saving = ref(false)
const snackbarStore = useSnackbarStore()

const formData = ref({
  name: userStore.info?.name || '無法取得用戶暱稱',
  address: userStore.info?.address || '無法取得用戶地址',
  phone: userStore.info?.phone || '無法取得用戶電話',
  currentPassword: '',
  password: '',
  passwordConfirm: '',
})

const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | undefined>(undefined)
const showCropper = ref(false)

function onAvatarCropped(blob: Blob) {
  imageFile.value = new File([blob], 'avatar.png', { type: 'image/png' })
  imagePreviewUrl.value = URL.createObjectURL(imageFile.value)
  showCropper.value = false
}

async function saveChanges() {
  // 密碼一致性檢查
  if (formData.value.password) {
    if (formData.value.password.length < 6) {
      snackbarStore.showSnackbar('新密碼長度至少 6 個字元', 'error')
      return
    }
    if (formData.value.password !== formData.value.passwordConfirm) {
      snackbarStore.showSnackbar('兩次輸入的密碼不一致', 'error')
      return
    }
  }

  const dataToUpdate: any = {
    name: formData.value.name,
    address: formData.value.address,
    phone: formData.value.phone,
  }

  saving.value = true
  try {
    userStore.$patch({
      info: {
        ...(userStore.info || {}),
        ...dataToUpdate,
      },
    })

    if (imageFile.value) {
      userStore.info.img = imageFile.value
    }

    await userStore.syncUserInfoWithDB()
    userStore.saveToStorage()
    snackbarStore.showSnackbar('資料已更新', 'success')

    if (formData.value.currentPassword && formData.value.password) {
      await userStore.updatePassword(formData.value.currentPassword, formData.value.password)
      snackbarStore.showSnackbar('密碼已更新', 'success')
    }

    formData.value.currentPassword = ''
    formData.value.password = ''
    formData.value.passwordConfirm = ''
  } catch (e: any) {
    snackbarStore.showSnackbar(e?.message || '更新失敗，請稍後再試', 'error')
  } finally {
    saving.value = false
  }
}

const roleButton = computed(() => {
  const role = userStore.info?.role;
  const currentRole = userStore.currentRole;

  if (!role || !currentRole) {
    return { text: '載入中...', action: null, disabled: true };
  }

  if (role === 'multi') {
    if (currentRole === 'customer') {
      return { text: '切換為外送員', action: 'switch', disabled: false };
    } else {
      return { text: '切換為顧客', action: 'switch', disabled: false };
    }
  }

  return { text: '管理員', action: null, disabled: true };
});

const router = useRouter()
function manageRole() {
  const action = roleButton.value.action
  if (action === 'switch') {
    const current = userStore.currentRole
    const newRole = current === 'customer' ? 'delivery' : 'customer'
    userStore.setRole?.(newRole as 'customer' | 'delivery')

    snackbarStore.showSnackbar(`身分已切換為 ${newRole === 'customer' ? '顧客' : '外送員'}`, 'success')

    if (newRole === 'delivery') {
      router.push('/delivery/customer-orders')
    } else {
      router.push('/customer/stores')
    }
  }
}

useHead({title: '我的帳戶',});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.v-card-text {
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}
</style>