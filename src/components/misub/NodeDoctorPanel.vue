<template>
  <div class="doctor-card card">
    <div class="doctor-header">
      <h4>🩺 دکتر نود و بررسی سلامت کانفیگ‌ها (Node Doctor)</h4>
      <p class="desc">تحلیل هوشمند و شناسایی خطاهای سینتکس، پورت‌های نامعتبر، UUIDهای ناقص و پروتکل‌های شکسته</p>
    </div>

    <div v-if="reports.length" class="reports-list">
      <div v-for="r in reports" :key="r.nodeId" :class="['report-item', r.healthy ? 'healthy' : 'unhealthy']">
        <div class="report-top">
          <span :class="['badge', r.protocol]">{{ r.protocol.toUpperCase() }}</span>
          <span class="node-name">{{ r.nodeName }}</span>
          <span :class="['badge', r.healthy ? 'ok' : 'error']">
            {{ r.healthy ? 'سالم' : 'دارای خطا' }}
          </span>
        </div>
        <ul v-if="r.issues.length" class="issue-list">
          <li v-for="(iss, i) in r.issues" :key="i" class="text-red">⚠️ {{ iss }}</li>
        </ul>
      </div>
    </div>
    <div v-else class="text-muted text-center">
      هیچ نودی برای بررسی بارگذاری نشده است.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { diagnoseNodes } from '../../utils/operators/nodeDoctor';

const props = defineProps({
  nodes: Array
});

const reports = computed(() => diagnoseNodes(props.nodes || []));
</script>

<style scoped>
.doctor-card {
  padding: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
}
.doctor-header h4 { color: var(--accent-cyan); font-size: 0.92rem; }
.desc { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.reports-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; max-height: 260px; overflow-y: auto; }
.report-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 12px;
}
.report-item.healthy { border-color: #065f46; }
.report-item.unhealthy { border-color: #991b1b; }
.report-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.node-name { font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.issue-list { font-size: 0.75rem; margin-top: 6px; padding-right: 14px; }
</style>
