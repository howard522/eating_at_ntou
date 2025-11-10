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
        <v-card-title class="text-h5 font-weight-bold text-center">Login to Your Account</v-card-title>
        <v-card-subtitle class="mb-4 text-center">Enter your account & password to login</v-card-subtitle>

        <v-card-text class="pt-4">
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <!-- Snackbar 提示 -->
          <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
            {{ snack.text }}
          </v-snackbar>

          <v-form ref="formRef" v-model="formValid" @submit.prevent="onSubmit">
            <!-- 電子郵件欄位 -->
            <label for="login-email" class="form-label mb-1">電子郵件</label>
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
            <label for="login-password" class="form-label mb-1">密碼</label>
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
                <v-radio label="顧客" value="customer"></v-radio>
                <v-radio label="外送員" value="delivery"></v-radio>
              </div>
            </v-radio-group>
            <div>可在"我的帳戶"切換身份</div>

            <div class="d-flex justify-end mb-4">
              <NuxtLink to="/forgot-password" class="text-caption">忘記密碼？</NuxtLink>
            </div>

            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!formValid || loading"
              block
            >
              登入
            </v-btn>
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-center">
          <span class="text-caption">還沒有帳號？</span>
          <NuxtLink to="/register" class="text-caption ml-1">建立帳號</NuxtLink>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '../../../stores/user'

const router = useRouter()
const formRef = ref()
const formValid = ref(false)

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const loginRole = ref<'customer' | 'delivery'>('customer')

// snackbar 狀態
const snack = reactive({
  show: false,
  text: '',
  color: 'success' as 'success' | 'error'
})

const userStore = useUserStore()

const onSubmit = async () => {
  errorMessage.value = ''
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  loading.value = true
  try {
    await userStore.loginPost(email.value, password.value)
    userStore.setRole(loginRole.value)

    snack.text = '登入成功'
    snack.color = 'success'
    snack.show = true

    if (userStore.token) {
      if (userStore?.info?.role === 'admin')
        router.push('/admin/stores')
      else if (loginRole.value === 'delivery')
        router.push('/delivery/customer-orders')
      else
        router.push('/customer/stores')
    } else {
      errorMessage.value = '登入失敗，請檢查帳號或密碼'
      snack.text = errorMessage.value
      snack.color = 'error'
      snack.show = true
    }
  } catch (e: any) {
    errorMessage.value =
      e?.message || e?.data?.message || '登入失敗，請檢查帳號或密碼'
    snack.text = errorMessage.value
    snack.color = 'error'
    snack.show = true
  } finally {
    loading.value = false
  }
}

definePageMeta({layout: false,})

useHead({title: '登入', });

</script>

<style scoped>
.login-container {
  min-height: 100vh;
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
