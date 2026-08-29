<template>
  <div class="app-layout">
    <!-- Top Header -->
    <Header />

    <!-- Main Workspace Views -->
    <main class="main-content">
      <div class="container">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Mobile Bottom Nav -->
    <MobileNav />

    <!-- Toast Notifications -->
    <Toast />

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import Header from './components/layout/Header.vue';
import MobileNav from './components/layout/MobileNav.vue';
import Footer from './components/layout/Footer.vue';
import Toast from './components/layout/Toast.vue';
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 64px;
}
.main-content {
  flex: 1;
  padding: 20px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
@media (min-width: 769px) {
  .app-layout {
    padding-bottom: 0;
  }
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
