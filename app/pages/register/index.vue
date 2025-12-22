<template>
  <v-container class="register-container fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card rounded="lg" border>
          <v-card-text class="pa-4">
            <h1 class="text-h5 font-weight-bold text-center mb-3">{{ $t('register.title') }}</h1>

            <!-- 點擊頭像觸發裁切對話框 -->
            <div class="text-center mt-2 mb-4">
              <v-avatar color="primary" size="80" class="cursor-pointer" @click="showCropper = true">
                <v-img :src="imagePreviewUrl" cover></v-img>
              </v-avatar>
              <p class="text-body-1 text-medium-emphasis">
                {{ userStore.info?.email }}
              </p>
            </div>

            <!-- 裁切頭像 Dialog -->
            <v-dialog v-model="showCropper" max-width="600">
              <v-card>
                <v-card-title class="font-weight-bold">{{ $t('avatarCropper.dialogTitle') }}</v-card-title>
                <v-card-text>
                  <AvatarCropper :imageFile="imageFile" @cropped="onAvatarCropped" />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="showCropper = false">{{ $t('common.cancel') }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- 暱稱欄位 -->
            <v-form ref="formRef" v-model="isValid" @submit.prevent="onSubmit">
              <v-text-field
                v-model="formData.name"
                :label="$t('common.nickname')"
                :rules="nameRules"
                clearable
                required
                class="mb-2"
              ></v-text-field>

              <!-- 電子郵件欄位 -->
              <v-text-field
                v-model="formData.email"
                :label="$t('common.email')"
                type="email"
                :rules="emailRules"
                clearable
                required
                class="mb-2"
              ></v-text-field>

              <!-- 密碼欄位 -->
              <v-text-field
                v-model="formData.password"
                :label="$t('common.password')"
                :type="showPwd ? 'text' : 'password'"
                :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPwd = !showPwd"
                :rules="passwordRules"
                clearable
                required
                class="mb-2"
              ></v-text-field>

              <!-- 地址欄位 -->
              <v-text-field
                v-model="formData.address"
                :label="$t('register.defaultDeliveryAddress')"
                clearable
                class="mb-2"
              ></v-text-field>

              <!-- 電話欄位 -->
              <v-text-field
                v-model="formData.phone"
                :label="$t('register.contactPhone')"
                clearable
                class="mb-2"
              ></v-text-field>

              <!-- 註冊按鈕 -->
              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                class="mt-2"
                :loading="loading"
                :disabled="loading || !isValid"
              >
                {{ $t('register.registerButton') }}
              </v-btn>
            </v-form>

            <div class="text-center mt-3">
              <NuxtLink to="/login" class="text-primary text-body-2">{{
                $t('register.loginPrompt')
              }}</NuxtLink>
            </div>

            <div class="text-center mt-3">
              若您同意註冊本平台，即表示您已閱讀並同意我們的
              <NuxtLink to="/terms-of-service" class="text-primary">{{ $t('register.termsOfService') }}</NuxtLink>
              和
              <NuxtLink to="/privacy-policy" class="text-primary">{{ $t('register.privacyPolicy') }}</NuxtLink>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-snackbar
    v-model="snackbarStore.show"
    :color="snackbarStore.color"
    :timeout="snackbarStore.timeout"
    location="top"
  >
    {{ snackbarStore.text }}
    <template v-slot:actions>
      <v-btn variant="text" @click="snackbarStore.show = false">{{ $t('common.close') }}</v-btn>
    </template>
  </v-snackbar>

  <!-- 🌐 語言切換按鈕 -->
  <LanguageSwitch class="language-switch" />
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user'
import { useSnackbarStore } from '@utils/snackbar'
import { generateRandomAvatar } from '@utils/defaultAvatar'

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
  (v: string) => !!v || $t('register.pleaseEnter', { field: $t('common.nickname').toLowerCase() }),
]
const emailRules = [
  (v: string) => !!v || $t('register.pleaseEnter', { field: $t('common.email').toLowerCase() }),
  (v: string) => /.+@.+\..+/.test(v) || $t('register.invalidEmailFormat'),
]
const passwordRules = [
  (v: string) => !!v || $t('register.pleaseEnter', { field: $t('common.password').toLowerCase() }),
  (v: string) => v.length >= 6 || $t('register.passwordTooShort'),
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
      imageFile.value ?? undefined
    )

    snackbarStore.showSnackbar($t('register.successMessage'), 'success')
    setTimeout(() => router.push('/login'), 600)
  } catch (err: any) {
    let msg = $t('register.errorMessage')

    const status = err.response?.status || err.statusCode || err.status || err.data?.statusCode
    const data = err.response?._data || err.data
    const serverMsg = data?.message || err.message

    if (
      status === 409 ||
      serverMsg === '電子信箱已經註冊' ||
      (typeof serverMsg === 'string' &&
        (serverMsg.includes('已註冊') || serverMsg.includes('Email has already been registered')))
    ) {
      msg = $t('register.emailExists')
    } else if (serverMsg && status && status !== 500) {
      msg = serverMsg
    } else if (status === 400) {
      msg = $t('register.missingFields')
    } else if (err.code === 'NETWORK_ERROR' || (!status && !err.response)) {
      msg = $t('register.networkError')
    } else if (status >= 500) {
      msg = $t('register.serverError')
    }

    console.error(err)
    snackbarStore.showSnackbar(msg, 'error')
  } finally {
    loading.value = false
  }
}

definePageMeta({ layout: false })

useHead({ title: '註冊' })

onMounted(async () => {
  // 產生預設頭像
  const file = await generateRandomAvatar()
  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  min-width: 100vw;
  background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%);
  padding: 1rem;
}

.v-text-field {
  margin-bottom: 12px !important;
}

.language-switch {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
}
</style>
