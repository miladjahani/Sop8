<template>
  <div class="app-layout">
    <!-- Top Header -->
    <Header 
      :current-tab="appState.activeTab" 
      :tabs="tabs" 
      @change-tab="switchTab" 
    />

    <!-- Main Workspace Views (Preserved with v-show) -->
    <main class="main-content">
      <div class="container">
        <!-- 1. Dedicated Core View: CF-Optimizer -->
        <OptimizerView 
          v-show="appState.activeTab === 'optimizer'"
          @navigate="switchTab"
        />

        <!-- 2. Dedicated View: Multi-thousand Clean IP Scanner -->
        <ScannerView 
          v-show="appState.activeTab === 'scanner'"
          @navigate="switchTab"
        />

        <!-- 3. Dedicated View: MiSub Subscription Hub -->
        <SubscriptionsView 
          v-show="appState.activeTab === 'misub'"
          @navigate="switchTab"
        />

        <!-- 4. Dedicated View: Network Tools (DoH & GeoIP) -->
        <ToolsView 
          v-show="appState.activeTab === 'tools'"
          @navigate="switchTab"
        />

        <!-- 5. Dedicated View: Cloudflare Worker Settings & Database -->
        <SettingsView 
          v-show="appState.activeTab === 'settings'"
          @navigate="switchTab"
        />
      </div>
    </main>

    <!-- Mobile Ergonomic Bottom Navigation -->
    <MobileNav 
      :current-tab="appState.activeTab" 
      :tabs="tabs" 
      @change-tab="switchTab" 
    />

    <!-- Toast Notifications -->
    <Toast :notifications="appState.notifications" />

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import { appState } from './stores/appState';

import Header from './components/layout/Header.vue';
import MobileNav from './components/layout/MobileNav.vue';
import Footer from './components/layout/Footer.vue';
import Toast from './components/layout/Toast.vue';

import OptimizerView from './views/OptimizerView.vue';
import ScannerView from './views/ScannerView.vue';
import SubscriptionsView from './views/SubscriptionsView.vue';
import ToolsView from './views/ToolsView.vue';
import SettingsView from './views/SettingsView.vue';

const tabs = [
  { id: 'optimizer', label: '⚡ بهینه‌ساز کانکشن (CF-Optimizer)', shortLabel: 'بهینه‌ساز', icon: '⚡' },
  { id: 'scanner', label: '🧪 اسکنر ۳,۸۰۰+ آی‌پی', shortLabel: 'اسکنر', icon: '🧪' },
  { id: 'misub', label: '📋 سابسکریپشن MiSub', shortLabel: 'سابسکریپشن', icon: '📋' },
  { id: 'tools', label: '🌐 ابزار DoH و GeoIP', shortLabel: 'ابزارها', icon: '🌐' },
  { id: 'settings', label: '🛠️ دیتابیس و تنظیمات ورکر', shortLabel: 'تنظیمات', icon: '🛠️' }
];

const switchTab = (tabId) => {
  appState.activeTab = tabId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-main);
  padding-bottom: 64px;
}
.main-content {
  flex: 1;
  padding: 16px;
}
.container {
  max-width: 1140px;
  margin: 0 auto;
}
@media (min-width: 769px) {
  .app-layout {
    padding-bottom: 0;
  }
}
</style>
