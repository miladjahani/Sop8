<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-dialog card">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
    </div>
  </div>
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
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.modal-dialog {
  max-width: 540px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  margin-bottom: 14px;
}
.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.4rem;
  cursor: pointer;
}
</style>
