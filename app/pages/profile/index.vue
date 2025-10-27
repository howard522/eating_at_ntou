<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">

        <v-card flat border rounded="lg">
          <v-card-text class="pa-6">
            <v-btn
                color="primary"
                variant="flat"
                class="font-weight-bold"
                style="position: absolute; top: 24px; right: 24px"
                @click="userStore.logout()"
                to="/login"
            >
              登出
            </v-btn>

            <div class="text-center mt-4 mb-10">
              <v-avatar color="primary" size="96">
                <v-img
                    :src="userStore.info?.img"
                    cover
                >
                </v-img>
              </v-avatar>
              <h2 class="text-h5 font-weight-bold mt-4">
                {{ userStore.info?.name }}
              </h2>
              <p class="text-body-1 text-medium-emphasis">
                {{ userStore.info?.email }}
              </p>
            </div>

            <v-form @submit.prevent="saveChanges">
              <div class="mb-4">
                <p class="text-caption text-medium-emphasis mb-n1">暱稱</p>
                <v-text-field
                    v-model="formData.name"
                    variant="plain"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <div class="mb-4">
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

              <div class="mb-4">
                <p class="text-caption text-medium-emphasis mb-n1">聯絡電話</p>
                <v-text-field
                    v-model="formData.phone"
                    variant="plain"
                    hide-details
                    class="font-weight-medium"
                ></v-text-field>
              </div>

              <div class="mb-4">
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

              <div class="mb-4">
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
                  class="mt-6"
              >
                <span class="text-h6 font-weight-bold">儲存變更</span>
              </v-btn>
            </v-form>

            <v-divider class="my-6"></v-divider>

            <div class="text-center">
              <v-btn
                  variant="outlined"
                  color="primary"
                  block
                  size="large"
                  :disabled="roleButton.disabled"
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
import { useUserStore } from '../../../stores/user'

const userStore = useUserStore()

const formData = ref({
  name: userStore.info?.name || '無法取得用戶暱稱',
  address: userStore.info?.address || '無法取得用戶地址',
  phone: userStore.info?.phone || '無法取得用戶電話',
  password: '',
  passwordConfirm: '',
})

function saveChanges() {
  // 密碼一致性檢查
  if (formData.value.password) {
    if (formData.value.password !== formData.value.passwordConfirm) {
      alert('兩次輸入的密碼不一致')
      return
    }
  }

  const dataToUpdate: any = {
    name: formData.value.name,
    address: formData.value.address,
    phone: formData.value.phone,
  }

  if (formData.value.password) {
    dataToUpdate.password = formData.value.password
  }

  // 直接更新 store（之後改成呼叫 API，再在成功時更新 store）
  userStore.$patch({
    info: {
      ...(userStore.info || {}),
      ...dataToUpdate,
    },
  })
  alert('變更已儲存！')
  formData.value.password = ''
  formData.value.passwordConfirm = ''
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

function manageRole() {
  const action = roleButton.value.action
  if (action === 'switch') {
    const current = userStore.currentRole
    const newRole = current === 'customer' ? 'delivery' : 'customer'
    userStore.setRole?.(newRole as 'customer' | 'delivery')
    alert(`身分已切換為 ${newRole === 'customer' ? '顧客' : '外送員'}`)
  }
}

useHead({title: '我的帳戶',});
</script>

<style scoped>

</style>