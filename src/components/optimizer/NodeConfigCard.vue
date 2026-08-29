<template>
  <div class="node-card">
    <div class="node-top">
      <span class="node-idx font-mono">#{{ index + 1 }}</span>
      <span class="node-uri font-mono" :title="uri">{{ uri }}</span>
    </div>
    <div class="node-actions">
      <button @click="$emit('open-qr', uri)" class="btn small secondary">QR</button>
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
  padding: 10px 14px;
  background: rgba(8, 14, 32, 0.45);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  gap: 10px;
  transition: border-color 0.2s;
}
.node-card:hover {
  border-color: rgba(56, 189, 248, 0.18);
}
.node-top {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.node-idx { color: var(--accent-cyan); font-weight: 700; font-size: 0.8rem; }
.node-uri {
  color: var(--text-secondary);
  font-size: 0.76rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node-actions { display: flex; gap: 6px; }
</style>
