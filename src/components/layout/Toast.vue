<template>
  <div class="toast-container">
    <transition-group name="toast-anim">
      <div 
        v-for="item in notifications" 
        :key="item.id"
        :class="['toast-item', item.type]"
      >
        <span class="toast-icon">{{ item.type === 'success' ? '✓' : item.type === 'error' ? '✕' : 'ℹ' }}</span>
        <span class="toast-msg">{{ item.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
defineProps({
  notifications: Array
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 80px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  pointer-events: none;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(14, 22, 46, 0.80);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(56, 189, 248, 0.20);
  color: #e2e8f0;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.toast-item.success {
  border-color: rgba(16, 185, 129, 0.30);
  background: rgba(6, 78, 59, 0.50);
}
.toast-item.error {
  border-color: rgba(239, 68, 68, 0.30);
  background: rgba(127, 29, 29, 0.50);
}
.toast-icon {
  font-size: 0.85rem;
  font-weight: 700;
}
.toast-item.success .toast-icon { color: #34d399; }
.toast-item.error .toast-icon { color: #fca5a5; }

.toast-anim-enter-active { animation: slideIn 0.3s var(--ease-bounce); }
.toast-anim-leave-active { animation: slideOut 0.25s var(--ease-smooth); }

@keyframes slideIn {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(20px); opacity: 0; }
}
</style>
