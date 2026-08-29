<template>
  <nav class="mobile-bottom-nav">
    <button 
      v-for="tab in tabs" 
      :key="tab.id"
      :class="['bottom-btn', { active: currentTab === tab.id }]"
      @click="$emit('change-tab', tab.id)"
    >
      <span class="btn-icon">{{ tab.icon }}</span>
      <span class="btn-text">{{ tab.shortLabel || tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  currentTab: String,
  tabs: Array
});
defineEmits(['change-tab']);
</script>

<style scoped>
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(10, 14, 26, 0.85);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-top: 1px solid rgba(56, 189, 248, 0.08);
  z-index: 50;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.bottom-btn {
  flex: 1;
  background: none;
  border: none;
  color: #5a7094;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  transition: all 0.25s var(--ease-smooth);
  position: relative;
}
.bottom-btn:active {
  transform: scale(0.92);
}
.btn-icon {
  font-size: 1.25rem;
  transition: transform 0.25s var(--ease-bounce);
}
.btn-text {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.bottom-btn.active {
  color: var(--accent-cyan);
}
.bottom-btn.active .btn-icon {
  transform: translateY(-2px) scale(1.1);
}
.bottom-btn.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  border-radius: 0 0 3px 3px;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

@media (max-width: 768px) {
  .mobile-bottom-nav { display: flex; }
}
</style>
