<template>
  <v-container class="login-container d-flex justify-center align-center">
    <v-col cols="12" class="d-flex flex-column align-center">
      <div class="ais-logo mb-2">
        <div class="logo">
          <img
            src="https://ais.ntou.edu.tw/Images/RWDImage/ntoulogomenublue.png"
            alt="NTOU"
            class="ntou-logo-img mr-3"
            width="48"
            height="48"
          />
          <div class="school-name">
            <div class="name-ch">國立臺灣海洋大學 餐飲外送系統</div>
            <div class="name-en">National Taiwan Ocean University Food Delivery System</div>
          </div>
        </div>
      </div>
      <v-card class="pa-6 login-card" elevation="4">
        <v-card-title class="text-h5 font-weight-bold text-center">{{ $t('login.title') }}</v-card-title>
        <v-card-subtitle class="mb-4 text-center">{{ $t('login.subtitle') }}</v-card-subtitle>

        <v-card-text class="pt-4">
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <v-form ref="formRef" v-model="formValid" @submit.prevent="onSubmit">
            <!-- 電子郵件欄位 -->
            <label for="login-email" class="form-label mb-1">{{ $t('common.email') }}</label>
            <v-text-field
              id="login-email"
              v-model="email"
              label=""
              type="email"
              autocomplete="email"
              variant="outlined"
              density="comfortable"
              required
              class="mb-3"
            />

            <!-- 密碼欄位 -->
            <label for="login-password" class="form-label mb-1">{{ $t('common.password') }}</label>
            <v-text-field
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label=""
              :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click:append-inner="showPassword = !showPassword"
              autocomplete="current-password"
              variant="outlined"
              density="comfortable"
              required
              class="mb-1"
            />

            <!-- 身份選擇 -->
            <v-radio-group
              v-model="loginRole"
              class="mb-1 login-role-group"
            >
              <div class="d-flex gap-4 justify-space-between">
                <v-radio :label="$t('common.customer')" value="customer"></v-radio>
                <v-radio :label="$t('common.delivery')" value="delivery"></v-radio>
              </div>
            </v-radio-group>
            <div>{{ $t('login.switchRoleInfo') }}</div>
            <div class="d-flex justify-end mb-4">
              <NuxtLink to="/forgot-password" class="text-caption">{{ $t('login.forgotPassword') }}</NuxtLink>
            </div>

            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!formValid || loading"
              block
            >
              {{ $t('login.loginButton') }}
            </v-btn>
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-center">
          <span class="text-caption">{{ $t('login.registerPrompt') }}</span>
          <NuxtLink to="/register" class="text-caption ml-1">{{ $t('login.registerLink') }}</NuxtLink>
        </v-card-actions>
      </v-card>
    </v-col>
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
  <div
    class="language-switch"
    :class="{ 'language-switch--chinese': isChinese }"
    @click="toggleLanguage"
  >
    <span class="label left">A</span>
    <span class="label right">文</span>
    <div class="switch-handle"></div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@stores/user'
import { useSnackbarStore } from '@utils/snackbar'

// const { locale } = useI18n()

const router = useRouter()
const formRef = ref()
const formValid = ref(false)

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const loginRole = ref<'customer' | 'delivery'>('customer')
const snackbarStore = useSnackbarStore()

const userStore = useUserStore()

const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const getErrorMessage = (message: string) => {
  if (message === 'Missing required fields: email, password.') {
    return $t('login.missingFields')
  } else if (message.startsWith('Account is temporarily locked. Please try again later.')) {
    const lockUntil = message.split('\n')[1]
    if (lockUntil) {
      const lockTime =formatTime(new Date(lockUntil))
      return $t('login.temporarilyLockedUntil', { time: lockTime })
    } else {
      return $t('login.temporarilyLocked')
    }
  } else if (message === 'Account has been banned.') {
    return $t('login.banned')
  } else {
    return $t('login.errorMessage')
  }
}

const onSubmit = async () => {
  errorMessage.value = ''
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  loading.value = true
  try {
    await userStore.loginPost(email.value, password.value)
    userStore.setRole(loginRole.value)

    snackbarStore.showSnackbar($t('login.successMessage'), 'success')

    if (userStore.token) {
      if (userStore?.info?.role === 'admin')
        router.push('/admin/stores')
      else if (loginRole.value === 'delivery')
        router.push('/delivery/customer-orders')
      else
        router.push('/customer/stores')
    } else {
      errorMessage.value = $t('login.errorMessage')
      snackbarStore.showSnackbar(errorMessage.value, 'error')
    }
  } catch (e: any) {
    errorMessage.value = getErrorMessage(e?.message || e?.data?.message || undefined)
    snackbarStore.showSnackbar(errorMessage.value, 'error')
  } finally {
    loading.value = false
  }
}

definePageMeta({layout: false,})

useHead({title: '登入', });

// 語言切換邏輯

const { locale, setLocale } = useI18n()

const isChinese = ref(true)

const toggleLanguage = () => {
  isChinese.value = !isChinese.value
  setLocale(isChinese.value ? 'zh' : 'en')
}

// 如果 locale 被外部改動，更新 Switch 狀態
watch(locale, (newVal) => {
  isChinese.value = newVal === 'zh'
})

</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-width: 100vw;
  background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%);
}

.login-card {
  width: 420px;
  max-width: 92vw;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(21, 62, 110, 0.12) !important;
}

.ais-logo {
  text-align: center;
}
.ais-logo .logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ais-logo .school-name .name-ch {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #153e6e;
}
.ais-logo .school-name .name-en {
  font-size: 12px;
  color: #6b7280;
}


.ntou-logo-img {
  border-radius: 12px;
  background: none !important;
  object-fit: contain;
}

.form-label {
  font-size: 15px;
  font-weight: 500;
  color: #153e6e;
  margin-bottom: 2px;
  margin-left: 2px;
  display: inline-block;
}

.login-role-group {
  width: 100%;
}

.language-switch {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  width: 80px;
  height: 40px;
  border-radius: 20px;
  background-color: #ccc;
  cursor: pointer;
  transition: background-color 0.3s;
}

.language-switch--chinese {
  background-color: #4caf50; /* 中文狀態背景色 */
}

.label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-weight: bold;
  user-select: none;
  pointer-events: none;
  z-index: 2;          /* 文字在圓球上層 */
}

.label.left {
  left: 15px;
}

.label.right {
  right: 12px;
}

.switch-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: white;
  transition: left 0.3s;
}

.language-switch--chinese .switch-handle {
  left: 42px; /* 滑到右邊 */
}

:not(.language-switch--chinese) .label.left {
  color: #888;
}

.language-switch--chinese .label.left {
  color: #fff;
}

.language-switch--chinese .label.right {
  color: #888;
}

.language-switch:hover {
  background-color: #bbb;
}

:deep(.login-role-group .v-radio) {
  flex: 1;
}

:deep(.v-input--focused .v-field) {
  box-shadow: 0 0 0 3px #a8d5ff !important;
}

:deep(.v-input--focused .v-field__outline) {
  --v-field-border-color: #756363 !important;
}

:deep(.v-input--focused .v-field__outline__start),
:deep(.v-input--focused .v-field__outline__notch),
:deep(.v-input--focused .v-field__outline__end) {
  border-color: #6f5f5f !important;
}
</style>
