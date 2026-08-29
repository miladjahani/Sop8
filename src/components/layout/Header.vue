<template>
  <header class="app-header">
    <div class="header-container">
      <div class="brand">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#bolt-grad)" stroke="rgba(56,189,248,0.5)" stroke-width="0.5"/>
            <defs><linearGradient id="bolt-grad" x1="3" y1="2" x2="22" y2="22"><stop stop-color="#38bdf8"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs>
          </svg>
        </div>
        <div class="brand-text">
          <h1>MiSub & CF-Optimizer</h1>
          <span class="badge-version">Ultra Edition v3.5</span>
        </div>
      </div>

      <!-- Live Status Pill -->
      <div v-if="appState.isScanning" class="live-status-pill">
        <span class="pulse-dot"></span>
        <span>اسکن: {{ appState.scanProgress.current }}/{{ appState.scanProgress.total }}</span>
      </div>

      <!-- Desktop Nav -->
      <nav class="desktop-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['nav-btn', { active: currentTab === tab.id }]"
          @click="$emit('change-tab', tab.id)"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span class="nav-label">{{ tab.label }}</span>
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
  background: rgba(10, 14, 26, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(56, 189, 248, 0.08);
  position: sticky;
  top: 0;
  z-index: 40;
}
.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.30), rgba(56, 189, 248, 0.20));
  border-radius: var(--radius-md);
  border: 1px solid rgba(56, 189, 248, 0.25);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
}
.brand-text h1 {
  font-size: 1.1rem;
  font-weight: 700;
  background: linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}
.badge-version {
  font-size: 0.65rem;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.10);
  color: rgba(56, 189, 248, 0.70);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(56, 189, 248, 0.12);
  letter-spacing: 0.03em;
}

.live-status-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: var(--accent-cyan);
  font-size: 0.73rem;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  backdrop-filter: blur(10px);
}
.pulse-dot {
  width: 7px;
  height: 7px;
  background: var(--accent-cyan);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent-cyan);
  animation: pulse 1.2s infinite alternate;
}
@keyframes pulse {
  from { opacity: 0.3; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.3); }
}

.desktop-nav {
  display: flex;
  gap: 6px;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(30, 41, 59, 0.40);
  color: #8da4c7;
  border: 1px solid rgba(56, 189, 248, 0.08);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.80rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s var(--ease-smooth);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.nav-btn:hover {
  background: rgba(37, 99, 235, 0.15);
  color: #c8d6e5;
  border-color: rgba(56, 189, 248, 0.18);
}
.nav-btn.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.50), rgba(56, 189, 248, 0.30));
  color: #fff;
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 16px rgba(37, 99, 235, 0.20), inset 0 1px 0 rgba(255,255,255,0.06);
}
.nav-icon { font-size: 1rem; }
.nav-label { font-size: 0.78rem; }

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .header-container { padding: 12px 16px; }
  .brand-text h1 { font-size: 0.95rem; }
}
</style>
