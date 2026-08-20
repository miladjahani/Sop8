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
  padding: 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  margin-bottom: 12px;
}
.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.matrix-header h4 { font-size: 0.9rem; color: var(--accent-cyan); }
.desc { font-size: 0.75rem; color: var(--text-muted); }
.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}
.matrix-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
}
.matrix-item:hover {
  border-color: var(--accent-cyan);
  background: #334155;
}
.operator-title { font-size: 0.8rem; font-weight: bold; color: #f8fafc; }
.ip-preview { font-size: 0.75rem; color: var(--accent-cyan); }
.count-badge { font-size: 0.68rem; color: var(--text-muted); }
</style>
