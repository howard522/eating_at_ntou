<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card rounded="lg" border>
          <v-card-text class="pa-8">
            <h1 class="text-h5 font-weight-bold text-center mb-6">建立新帳戶</h1>

            <v-form ref="formRef" v-model="isValid" @submit.prevent="onSubmit">
              <v-text-field
                v-model="form.name"
                label="暱稱"
                :rules="nameRules"
                clearable
                required
              />
                <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                :rules="emailRules"
                clearable
                required
              />
              <v-text-field
                v-model="form.password"
                label="密碼"
                :type="showPwd ? 'text' : 'password'"
                :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPwd = !showPwd"
                :rules="passwordRules"
                clearable
                required
              />
              <v-text-field
                v-model="form.address"
                label="預設外送地址（選填）"
                clearable
              />
              <v-text-field
                v-model="form.phone"
                label="聯絡電話（選填）"
                clearable
              />

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                class="mt-4"
                :loading="loading"
                :disabled="loading || !isValid"
              >
                立即註冊
              </v-btn>
            </v-form>

            <div class="text-center mt-6">
              <NuxtLink to="/login" class="text-primary text-body-2">已有帳號？前往登入</NuxtLink>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '../../../stores/user'

const router = useRouter()
const formRef = ref()
const isValid = ref(false)
const loading = ref(false)
const showPwd = ref(false)

const userStore = useUserStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
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
]

async function onSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value = true
  userStore.clearUserData()
  userStore.registerPost(form.name, form.email, form.password)
}

useHead({ title: '註冊' })
</script>

<style scoped>
</style>
