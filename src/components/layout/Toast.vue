<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast-item"
        :class="'toast-' + toast.type"
      >
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else-if="toast.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else-if="toast.type === 'warning'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="toastStore.removeToast(toast.id)">×</button>
        <div class="toast-progress" :style="{ animationDuration: toast.duration + 'ms' }"></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '../../stores/toastStore';
const toastStore = useToastStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  pointer-events: none;
}
@media (min-width: 640px) {
  .toast-container {
    left: auto;
    width: 380px;
  }
}
.toast-item {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  position: relative;
  overflow: hidden;
}
.toast-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.85), rgba(20, 184, 166, 0.75));
  color: #fff;
}
.toast-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.85), rgba(220, 38, 38, 0.75));
  color: #fff;
}
.toast-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.85), rgba(234, 88, 12, 0.75));
  color: #fff;
}
.toast-info {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.85), rgba(37, 99, 235, 0.75));
  color: #fff;
}
.toast-icon { flex-shrink: 0; }
.toast-message {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.5;
}
.toast-close {
  flex-shrink: 0;
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.4);
  animation: toast-shrink linear forwards;
}
@keyframes toast-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}
.toast-leave-active {
  position: absolute;
}
</style>
