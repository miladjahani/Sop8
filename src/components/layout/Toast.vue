<template>
  <div class="toast-container">
    <div 
      v-for="item in notifications" 
      :key="item.id" 
      :class="['toast-item', item.type]"
    >
      {{ item.message }}
    </div>
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
  bottom: 74px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}
.toast-item {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid var(--accent-cyan);
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.84rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.2s ease-out;
}
.toast-item.success { border-color: var(--accent-green); }
.toast-item.error { border-color: var(--accent-red); }
@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
