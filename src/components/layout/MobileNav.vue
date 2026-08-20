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
  height: 60px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--border-color);
  z-index: 50;
}
.bottom-btn {
  flex: 1;
  background: none;
  border: none;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-icon { font-size: 1.15rem; }
.btn-text { font-size: 0.68rem; font-weight: 500; }
.bottom-btn.active {
  color: var(--accent-cyan);
  font-weight: 700;
}
@media (max-width: 768px) {
  .mobile-bottom-nav { display: flex; }
}
</style>
