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
            >
              登出
            </v-btn>

            <div class="text-center mt-4 mb-10">
              <v-avatar color="primary" size="96">
                <v-img
                    :src="userStore.info.value.img"
                    cover
                >
                </v-img>
              </v-avatar>
              <h2 class="text-h5 font-weight-bold mt-4">
                {{ userStore.info.value.name }}
              </h2>
              <p class="text-body-1 text-medium-emphasis">
                {{ userStore.info.value.email }}
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
                    v-model="formData.password"
                    variant="plain"
                    type="password"
                    placeholder="留空表示不修改"
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
import { useRouter } from "nuxt/app";
const router = useRouter();
// 之後會從userStore拿資料
// const userStore = useUserStore();
const userStore = {
  info: ref({
    name: '王大明',
    email: 'david_wang@email.com',
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSF6jwre87YE2xVWsEpo-X0jVkGsQ5WbSF96Q&s",
    address: '海洋大學資工系館',
    phone: '0912345678',
    role: 'customer',
    activeRole: 'customer',
  }),
  updateProfile(data: any) {
    userStore.info.value.name = data.name;
    userStore.info.value.address = data.address;
    userStore.info.value.phone = data.phone;
    alert('變更已儲存！');
  },
  logout() {
    // userStore.logout
    router.push('/login');
  },
  applyForDelivery() {
    alert('已成為外送員！');
    // 更新db，加上外送員身分
    userStore.info.value.role = 'both';
  },
  applyForCustomer() {
    alert('已成為顧客！');
    // 更新db，加上顧客身分
    userStore.info.value.role = 'both';
  },
  switchRole() {
    const newRole = userStore.info.value.activeRole === 'customer' ? 'deliverer' : 'customer';
    userStore.info.value.activeRole = newRole;
    alert(`身分已切換為 ${newRole === 'customer' ? '顧客' : '外送員'}`);
    router.push(newRole === 'customer' ? '/customer/stores' : '/delivery/orders');
  },
};

const formData = ref({
  name: userStore.info.value.name,
  address: userStore.info.value.address,
  phone: userStore.info.value.phone,
  password: '',
});

function saveChanges() {
  const dataToUpdate: any = {
    name: formData.value.name,
    address: formData.value.address,
    phone: formData.value.phone,
  };

  if (formData.value.password) {
    dataToUpdate.password = formData.value.password;
  }

  // 將修改更新到資料庫中
  userStore.updateProfile(dataToUpdate);
  formData.value.password = '';
}

const roleButton = computed(() => {
  const role = userStore.info.value.role;
  const activeRole = userStore.info.value.activeRole;

  if (role === 'customer') {
    return { text: '我想成為外送員', action: 'applyForDelivery', disabled: false };
  }

  if (role === 'delivery') {
    return { text: '我想成為顧客', action: 'applyForCustomer', disabled: false };
  }

  if (role === 'both') {
    if (activeRole === 'customer') {
      return { text: '切換為外送員', action: 'switch', disabled: false };
    } else {
      return { text: '切換為顧客', action: 'switch', disabled: false };
    }
  }
  return { text: '身分管理', action: null, disabled: true };
});

function manageRole() {
  const action = roleButton.value.action;
  if (action === 'applyForCustomer')
  {
    userStore.applyForCustomer();
  }
  else if (action === 'applyForDelivery')
  {
    userStore.applyForDelivery();
  }
  else if (action === 'switch') {
    userStore.switchRole();
  }
}

useHead({
  title: '我的帳戶',
});
</script>

<style scoped>

</style>