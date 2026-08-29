<template>
  <div class="doctor-card card">
    <div class="doctor-header">
      <h4>🩺 دکتر نود و بررسی سلامت کانفیگ‌ها</h4>
      <p class="desc">تحلیل خطاهای سینتکس، پورت‌های نامعتبر، UUID ناقص و پروتکل‌های شکسته</p>
    </div>

    <div v-if="reports.length" class="reports-list">
      <div v-for="r in reports" :key="r.nodeId" :class="['report-item', r.healthy ? 'healthy' : 'unhealthy']">
        <div class="report-top">
          <span :class="['badge', r.protocol]">{{ r.protocol.toUpperCase() }}</span>
          <span class="node-name">{{ r.nodeName }}</span>
          <span :class="['badge', r.healthy ? 'ok' : 'error']">{{ r.healthy ? 'سالم' : 'خطا' }}</span>
        </div>
        <ul v-if="r.issues.length" class="issue-list">
          <li v-for="(iss, i) in r.issues" :key="i" class="text-red">⚠️ {{ iss }}</li>
        </ul>
      </div>
    </div>
    <div v-else class="text-muted text-center">نودی برای بررسی بارگذاری نشده.</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { diagnoseNodes } from '../../utils/operators/nodeDoctor';

const props = defineProps({ nodes: Array });
const reports = computed(() => diagnoseNodes(props.nodes || []));
</script>

<style scoped>
.doctor-card { padding: 16px; }
.doctor-header h4 { color: var(--accent-cyan); font-size: 0.90rem; }
.desc { font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px; }
.reports-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; max-height: 260px; overflow-y: auto; }
.report-item {
  background: rgba(8, 14, 32, 0.45);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  transition: border-color 0.2s;
}
.report-item.healthy { border-color: rgba(16, 185, 129, 0.20); }
.report-item.unhealthy { border-color: rgba(239, 68, 68, 0.20); }
.report-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.node-name { font-size: 0.78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.issue-list { font-size: 0.73rem; margin-top: 6px; padding-right: 14px; }
</style>
