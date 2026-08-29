<template>
  <div class="matrix-card card" v-if="presets && Object.keys(presets).length">
    <div class="matrix-header">
      <h4>🌐 ماتریس آی‌پی‌های تمیز اپراتورها</h4>
      <span class="desc">انتخاب سریع آی‌پی متناسب با اینترنت فعلی شما</span>
    </div>

    <div class="matrix-grid">
      <div 
        v-for="(data, key) in presets" 
        :key="key" 
        class="matrix-item"
        @click="data?.ips?.length && $emit('select-ip', data.ips[0], key)"
      >
        <span class="operator-title">{{ data?.name || key }}</span>
        <span class="ip-preview font-mono">{{ data?.ips?.[0] || '---' }}</span>
        <span class="count-badge">{{ (data?.ips?.length || 0) }} آی‌پی ذخیره</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  presets: {
    type: Object,
    default: () => ({})
  }
});
defineEmits(['select-ip']);
</script>

<style scoped>
.matrix-card {
  padding: 16px;
}
.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 6px;
}
.matrix-header h4 { font-size: 0.9rem; color: var(--accent-cyan); }
.desc { font-size: 0.74rem; color: var(--text-muted); }
.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}
.matrix-item {
  background: rgba(8, 14, 32, 0.50);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: all 0.25s var(--ease-smooth);
}
.matrix-item:hover {
  border-color: rgba(56, 189, 248, 0.30);
  background: rgba(37, 99, 235, 0.10);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.08);
  transform: translateY(-1px);
}
.operator-title { font-size: 0.78rem; font-weight: 700; color: var(--text-primary); }
.ip-preview { font-size: 0.74rem; color: var(--accent-cyan); }
.count-badge { font-size: 0.66rem; color: var(--text-muted); }
</style>
