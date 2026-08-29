<template>
  <div class="app-layout">
    <!-- Top Header -->
    <Header 
      :current-tab="appState.activeTab" 
      :tabs="tabs" 
      @change-tab="switchTab" 
    />

    <!-- Main Workspace Views -->
    <main class="main-content">
      <div class="container">
        <OptimizerView 
          v-show="appState.activeTab === 'optimizer'"
          @navigate="switchTab"
        />
        <ScannerView 
          v-show="appState.activeTab === 'scanner'"
          @navigate="switchTab"
        />
        <SubscriptionsView 
          v-show="appState.activeTab === 'misub'"
          @navigate="switchTab"
        />
        <ToolsView 
          v-show="appState.activeTab === 'tools'"
          @navigate="switchTab"
        />
        <SettingsView 
          v-show="appState.activeTab === 'settings'"
          @navigate="switchTab"
        />
      </div>
    </main>

    <!-- Mobile Bottom Nav -->
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
  { id: 'optimizer', label: '⚡ بهینه‌ساز', shortLabel: 'بهینه‌ساز', icon: '⚡' },
  { id: 'scanner', label: '🧪 اسکنر IP', shortLabel: 'اسکنر', icon: '🧪' },
  { id: 'misub', label: '📋 سابسکریپشن', shortLabel: 'ساب', icon: '📋' },
  { id: 'tools', label: '🌐 ابزارها', shortLabel: 'ابزارها', icon: '🌐' },
  { id: 'settings', label: '🛠️ تنظیمات', shortLabel: 'تنظیمات', icon: '🛠️' }
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
</style>
