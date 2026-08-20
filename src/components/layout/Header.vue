<template>
  <header class="app-header">
    <div class="header-container">
      <div class="brand">
        <div class="logo-icon">⚡</div>
        <div class="brand-text">
          <h1>MiSub & CF-Optimizer</h1>
          <span class="badge-version">Ultra Edition v3.5</span>
        </div>
      </div>

      <!-- Live Background Task Progress Indicator -->
      <div v-if="appState.isScanning" class="live-status-pill">
        <span class="pulse-dot"></span>
        <span>اسکن در حال اجرا: {{ appState.scanProgress.current }}/{{ appState.scanProgress.total }}</span>
      </div>

      <!-- Desktop Nav -->
      <nav class="desktop-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['nav-btn', { active: currentTab === tab.id }]"
          @click="$emit('change-tab', tab.id)"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { appState } from '../../stores/appState';

defineProps({
  currentTab: String,
  tabs: Array
});
defineEmits(['change-tab']);
</script>

<style scoped>
.app-header {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 40;
}
.header-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  font-size: 1.5rem;
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  padding: 6px 10px;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
}
.brand-text h1 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--accent-cyan);
  letter-spacing: -0.02em;
}
.badge-version {
  font-size: 0.7rem;
  background: #1e293b;
  color: #94a3b8;
  padding: 2px 6px;
  border-radius: 4px;
}

.live-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(2, 132, 199, 0.2);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}
.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-cyan);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent-cyan);
  animation: pulse 1s infinite alternate;
}
@keyframes pulse {
  from { opacity: 0.4; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}

.desktop-nav {
  display: flex;
  gap: 6px;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.nav-btn:hover {
  background: #334155;
  color: #fff;
}
.nav-btn.active {
  background: var(--accent-blue);
  color: #fff;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(2, 132, 199, 0.4);
}
@media (max-width: 768px) {
  .desktop-nav { display: none; }
}
</style>
