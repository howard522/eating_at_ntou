<template>
  <div class="black-screen" @click="goBack">
    <div class="scrolling-text">
      <p>感謝您使用本系統</p>
      <p>這是一個簡單的介紹頁面</p>
      <p>點擊畫面任何地方返回上一頁</p>
      <p>開發者：J</p>
      <p>結束</p>
    </div>
  </div>
</template>

<script>
definePageMeta({layout: false,})
export default {
  methods: {
    goBack() {
      this.$router.go(-1);
    }
  }
}
</script>

<style scoped>
.black-screen {
  background-color: black;
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  overflow: hidden;
}

.scrolling-text {
  color: white;
  font-size: 24px;
  text-align: center;
  animation: scrollUp 10s linear infinite;
  animation-delay: -4s;
}

@keyframes scrollUp {
  from {
    transform: translateY(100vh);
  }
  to {
    transform: translateY(-100vh);
  }
}
</style>