<template>
  <div>
    <div class="switch" :class="{ 'switch-chinese': isChinese }" @click="toggleLanguage">
      <span class="label left">A</span>
      <span class="label right">文</span>
      <div class="switch-handle"></div>
    </div>
  </div>
</template>

<script setup>
const { locale, setLocale } = useI18n()

const isChinese = computed(() => locale.value === 'zh')

const toggleLanguage = () => {
  const newLocale = isChinese.value ? 'en' : 'zh'
  setLocale(newLocale)
}
</script>

<style scoped>
.switch {
  position: relative;
  width: 80px;
  height: 40px;
  border-radius: 20px;
  background-color: #ccc;
  cursor: pointer;
  transition: background-color 0.3s;
}

.switch:hover {
  background-color: #bbb;
}

.switch-chinese {
  background-color: #4caf50; /* 中文狀態背景色 */
}

.switch-chinese:hover {
  background-color: #45a049;
}

.label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-weight: bold;
  user-select: none;
  pointer-events: none;
  z-index: 2; /* 文字在圓球上層 */
  transition: color 0.3s;
}

.label.left {
  left: 14px;
  color: #888;
}

.label.right {
  right: 11px;
  color: #fff;
}

.switch-chinese .label.left {
  color: #fff;
}

.switch-chinese .label.right {
  color: #888;
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

.switch-chinese .switch-handle {
  left: 42px; /* 滑到右邊 */
}
</style>
