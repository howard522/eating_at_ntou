<template>
  <button class="back-button" @click="goBack" aria-label="回上一頁">
    ← 返回
  </button>

  <main class="container">
    <h1 class="big-text">我也沒辦法</h1>
    <p class="admin-phone">
      管理員電話：{{ phone }}
    </p>
  </main>
</template>

<script setup>
definePageMeta({ layout: false })

const phone = '0987-987-987';

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.location.href = '/'
  }
}
</script>

<style scoped>
.container {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.big-text {
  font-size: clamp(2.5rem, 6vw, 6rem);
  font-weight: 800;
  margin: 0 0 1.5rem 0;
  color: #222;
  letter-spacing: 0.02em;
}

.admin-phone {
  font-size: 1.125rem;
  color: #444;
  margin: 0;
}

.phone-link {
  color: #1a73e8;
  text-decoration: none;
  font-weight: 600;
}

.phone-link:hover,
.phone-link:focus {
  text-decoration: underline;
}

.back-button {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 60;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem .75rem;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
  font-size: 0.95rem;
  color: #222;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.back-button:active { transform: translateY(1px); }
.back-button:focus { outline: 2px solid rgba(26,115,232,0.25); outline-offset: 2px; }

@media (max-width: 600px) {
  .container {
    padding: 1rem;
  }
  .big-text {
    font-size: clamp(2rem, 8vw, 4rem);
  }
}
</style>