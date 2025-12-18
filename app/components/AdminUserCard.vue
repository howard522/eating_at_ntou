<template>
  <v-card
    class="h-100 admin-user-card"
    elevation="2"
    hover
    :to="`/admin/users/${user.id}`"
    :style="{ '--hover-bg': hoverBgColor }"
  >
    <v-card-item>
      <template v-slot:prepend>
        <v-avatar size="60" color="grey-lighten-2" class="image-container">
          <v-img
            v-if="user.img"
            :src="user.img"
            alt="Avatar"
            cover
            class="user-image"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
              </v-row>
            </template>
            <template v-slot:error>
              <v-icon icon="mdi-account" size="30" color="grey"></v-icon>
            </template>
          </v-img>
          <v-icon v-else icon="mdi-account" size="30" color="grey-darken-1"></v-icon>
        </v-avatar>
      </template>

      <v-card-title class="text-h6 font-weight-bold">
        {{ user.name || '未命名使用者' }}
      </v-card-title>

      <v-card-subtitle class="mt-1 opacity-80">
        <v-icon icon="mdi-email-outline" size="small" class="mr-1"></v-icon>
        {{ user.email }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="pt-2">
      <div class="d-flex align-center justify-space-between">
        <v-chip
          :color="roleColor"
          size="small"
          label
          class="font-weight-medium"
        >
          {{ roleDisplay }}
        </v-chip>

        <span class="text-caption text-grey">
          建立帳號時間： {{ formatDate(user.createdAt) }}
        </span>
      </div>

    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { User } from '@types/user';
import { useImageHoverColor } from '../composable/useImageHoverColor';

const props = defineProps<{
  user: User
}>();

const { hoverBgColor } = useImageHoverColor(computed(() => props.user.img));

const roleColor = computed(() => {
  switch (props.user.role) {
    case 'admin': return 'error';
    case 'multi': return 'primary';
    case 'banned': return 'grey-darken-3';
    default: return 'grey';
  }
});

const roleDisplay = computed(() => {
  const map: Record<string, string> = {
    'admin': '管理員',
    'multi': '一般用戶',
    'banned': '停權'
  };
  return map[props.user.role] || props.user.role;
});

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-TW');
};
</script>

<style scoped>
.admin-user-card {
  transition: background-color 0.3s ease;
}
.admin-user-card:hover {
  background-color: var(--hover-bg, #FFFFFF) !important;
}
.image-container {
  overflow: hidden;
}
.user-image {
  transition: transform 0.3s ease;
}
.admin-user-card:hover .user-image {
  transform: scale(1.05);
}
</style>
