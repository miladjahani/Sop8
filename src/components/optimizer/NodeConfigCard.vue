<template>
  <div class="node-card card">
    <div class="node-top">
      <span class="node-idx font-mono">#{{ index + 1 }}</span>
      <span class="node-uri font-mono" :title="uri">{{ uri }}</span>
    </div>
    <div class="node-actions">
      <button @click="$emit('open-qr', uri)" class="btn small secondary">QR Code</button>
      <button @click="$emit('copy', uri)" class="btn small primary">کپی</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  index: Number,
  uri: String
});
defineEmits(['open-qr', 'copy']);
</script>

<style scoped>
.node-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  gap: 10px;
}
.node-top {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.node-idx { color: var(--accent-cyan); font-weight: bold; font-size: 0.8rem; }
.node-uri {
  color: #94a3b8;
  font-size: 0.76rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node-actions { display: flex; gap: 6px; }
</style>
