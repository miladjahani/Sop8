<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button @click="$emit('close')" class="close-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  title: String
});
defineEmits(['close']);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 18, 0.80);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.modal-dialog {
  max-width: 520px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  background: rgba(14, 22, 46, 0.80);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(56, 189, 248, 0.08);
  padding-bottom: 14px;
  margin-bottom: 18px;
}
.modal-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-cyan);
}
.close-btn {
  background: rgba(30, 41, 59, 0.50);
  border: 1px solid rgba(56, 189, 248, 0.10);
  color: #8da4c7;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s var(--ease-smooth);
}
.close-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.30);
  color: #fca5a5;
}

.modal-fade-enter-active { transition: opacity 0.25s var(--ease-smooth); }
.modal-fade-leave-active { transition: opacity 0.2s var(--ease-smooth); }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
