<template>
  <div class="black-screen" @click="goBack">
    <div class="scrolling-text" ref="scrollingText">
      <p class="intro-title">感謝您使用本系統</p>
      <p>我們致力於打造一個</p>
      <p>專屬於海大學生的餐飲外送平台</p>
      <p>讓顧客能快速下單，外送員能便捷接單</p>
      <p>系統能維護訂單流程完整，確保穩定無錯誤</p>
      <br /> 
      <br /> 
      <p class="intro-title">— 製作團隊 Production Team —</p> 
      <p>前端技術總監（Front-End Director）</p> 
      <p>前端大大大姐頭 KarryLin 林津瑄</p> 
<br /> 
      <p>前端工程師（Front-End Developer）</p> 
      <p>前端小弟 兼 首席組員溝通師 JosephLiu 劉俊麟</p> 
<br /> 
      <p>後端技術總監（Back-End Director）</p>
      <p>後端老大 aka 傲嬌阿修羅 94SungLa 宋辰星</p> 
<br /> 
      <p>後端工程師（Back-End Developer）</p> 
      <p>後端小弟 兼 文件風格管理員 YuanOwO 黃俊源</p> 
      <p>後端老弟 兼 荷包蛋 Howard 郭浩</p> 
      <br /> <br />
      <p>這個系統的誕生，就像拍攝一部電影</p> 
      <p>一路走來有劇本的修改、有鏡頭的重來、有突發的插曲</p> 
      <p>也有靈感閃現時像燈光打亮的瞬間</p> 
      <p>在過程中，我們爭執過、崩潰過、通宵過</p> 
      <p>也一起跨過了一次又一次的「這一定做不完吧」的山谷</p> 
      <p>但也正是因為有大家的存在，這段旅程才不是一個人的獨白</p> 
      <p>而是一支真正的劇組、一群可信賴的夥伴</p> 
      <p>每一位組員，都在幕後留下了屬於自己的光</p> 
      <p>在片尾的最後，我想留下這句話——</p> 
      <p>謝謝你們，願下一部續集，我們還能一起上映。</p>
    </div>
  </div>
</template>

<script>
definePageMeta({ layout: false });
export default {
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    resetAnimation() {
      const scrollingText = this.$refs.scrollingText;
      scrollingText.style.animation = "none";
      void scrollingText.offsetHeight;
      scrollingText.style.animation = "";
    },
    calculateStartPosition() {
      const scrollingText = this.$refs.scrollingText;
      const containerHeight = this.$el.offsetHeight;
      const contentHeight = scrollingText.scrollHeight;
      return Math.max(containerHeight, contentHeight);
    },
    calculateAnimationDuration() {
      const containerHeight = this.$el.offsetHeight;
      const baseHeight = 800;
      const baseDuration = 45;
      return (containerHeight / baseHeight) * baseDuration;
    }
  },
  mounted() {
    this.resetAnimation();
    const startPosition = this.calculateStartPosition();
    const scrollingText = this.$refs.scrollingText;
    scrollingText.style.setProperty("--start-position", `${startPosition}px`);

    const animationDuration = this.calculateAnimationDuration();
    scrollingText.style.setProperty("--animation-duration", `${animationDuration}s`);
  }
};
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
  animation: scrollUp var(--animation-duration) linear infinite;
  animation-delay: 0s;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
}

.intro-title {
  font-size: 28px;
  margin-bottom: 16px;
  font-weight: bold;
}

.scrolling-text p {
  margin-bottom: 25px;
}

@media (max-width: 768px) {
  .scrolling-text {
    font-size: 18px;
  }
  
  .intro-title {
    font-size: 22px;
    margin-bottom: 12px;
  }

  .scrolling-text p {
    margin-bottom: 16px;
  }
}

@keyframes scrollUp {
  from {
    transform: translateY(var(--start-position));
  }
  to {
    transform: translateY(-100vh);
  }
}
</style>