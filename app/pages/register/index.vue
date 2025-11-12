<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card rounded="lg" border>
          <v-card-text class="pa-4">
            <h1 class="text-h5 font-weight-bold text-center mb-3">建立新帳戶</h1>

            <!-- 點擊頭像觸發裁切對話框 -->
            <div class="text-center mt-2 mb-4">
              <v-avatar color="primary" size="80" class="cursor-pointer" @click="showCropper = true">
                <v-img
                    :src="imagePreviewUrl"
                    cover
                ></v-img>
              </v-avatar>
              <p class="text-body-1 text-medium-emphasis">
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

            <v-form ref="formRef" v-model="isValid" @submit.prevent="onSubmit">
              <v-text-field
                v-model="formData.name"
                label="暱稱"
                :rules="nameRules"
                clearable
                required
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="formData.email"
                label="Email"
                type="email"
                :rules="emailRules"
                clearable
                required
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="formData.password"
                label="密碼"
                :type="showPwd ? 'text' : 'password'"
                :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPwd = !showPwd"
                :rules="passwordRules"
                clearable
                required
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="formData.address"
                label="預設外送地址（選填）"
                clearable
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="formData.phone"
                label="聯絡電話（選填）"
                clearable
                class="mb-2"
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                class="mt-2"
                :loading="loading"
                :disabled="loading || !isValid"
              >
                立即註冊
              </v-btn>
            </v-form>

                        <div class="text-center mt-3">
              <NuxtLink to="/login" class="text-primary text-body-2">已有帳號？前往登入</NuxtLink>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user'
import { useSnackbarStore } from '../../utils/snackbar'

const router = useRouter()
const formRef = ref()
const isValid = ref(false)
const loading = ref(false)
const showPwd = ref(false)

const userStore = useUserStore()
const snackbarStore = useSnackbarStore()

const formData = ref({
  name: '',
  email: '',
  password: '',
  address: '',
  phone: '',
})

const nameRules = [
  (v: string) => !!v || '請輸入暱稱',
]
const emailRules = [
  (v: string) => !!v || '請輸入 Email',
  (v: string) => /.+@.+\..+/.test(v) || 'Email 格式不正確',
]
const passwordRules = [
  (v: string) => !!v || '請輸入密碼',
  (v: string) => v.length >= 6 || '密碼長度至少 6 個字元',
]

const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | undefined>(undefined)
const showCropper = ref(false)

function onAvatarCropped(blob: Blob) {
  imageFile.value = new File([blob], 'avatar.png', { type: 'image/png' })
  imagePreviewUrl.value = URL.createObjectURL(imageFile.value)
  showCropper.value = false
}

async function onSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value = true
  userStore.clearUserData()

  try {
    await userStore.registerPost(
      formData.value.name,
      formData.value.email,
      formData.value.password,
      formData.value.address,
      formData.value.phone,
      imageFile.value,
    )

    snackbarStore.showSnackbar('註冊成功，請登入', 'success')
    setTimeout(() => router.push('/login'), 600)
  } catch (err: any) {
    let msg = err?.message || err?.data?.message || '註冊失敗，請稍後再試'
    if (
      typeof msg === 'string' &&
      (msg.toLowerCase().includes('email'))
    ) {
      msg = '註冊失敗，該電子郵件已被註冊'
    }
    console.error(err)
    snackbarStore.showSnackbar(msg, 'error')
  } finally {
    loading.value = false
  }
}

definePageMeta({layout: false,})

useHead({ title: '註冊' })
</script>

<style scoped>
.v-text-field {
  margin-bottom: 12px !important;
}
</style>
