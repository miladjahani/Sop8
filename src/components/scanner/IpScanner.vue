<template>
  <div class="scanner-module">
    <div class="card-header">
      <h3>🧪 اسکنر پیشرفته آی‌پی کلودفلر</h3>
      <p class="desc">مخزن ۳,۸۰۰+ آی‌پی واقعی کلودفلر — اسکن موازی با هندشیک TCP و تایید Colo</p>
    </div>

    <div v-if="!hasWorker" class="notice-box card">
      ⚠️ برای اسکن دسته‌ای واقعی، آدرس Worker را در تنظیمات وارد کنید.
    </div>
    <div v-else class="notice-box ok card">
      ✅ اسکن دسته‌ای Edge فعال — هندشیک TCP واقعی + تایید Colo
    </div>

    <!-- Pool Selector -->
    <div class="pool-selector card">
      <div class="selector-header">
        <span>مخزن آی‌پی‌ها:</span>
        <span class="pool-count font-mono text-cyan">{{ currentPoolCount.toLocaleString() }} آی‌پی</span>
      </div>
      <div class="chip-row">
        <button @click="loadLargePool" class="chip-btn highlight">🌐 بارگذاری مخزن ۳,۸۰۰+</button>
        <button @click="generateRandomSample(100)" class="chip-btn">🎲 ۱۰۰ آی‌پی</button>
        <button @click="generateRandomSample(500)" class="chip-btn">🎲 ۵۰۰ آی‌پی</button>
        <button @click="generateRandomSample(1500)" class="chip-btn">🎲 ۱,۵۰۰ آی‌پی</button>
        <button @click="loadOperatorPreset('mci')" class="chip-btn">همراه اول</button>
        <button @click="loadOperatorPreset('mtn')" class="chip-btn">ایرانسل</button>
        <button @click="loadOperatorPreset('rightel')" class="chip-btn">رایتل</button>
        <button @click="loadOperatorPreset('tci')" class="chip-btn">مخابرات</button>
      </div>
    </div>

    <!-- Scanner Controls -->
    <div class="scanner-controls-grid">
      <div class="form-group card">
        <label>لیست آی‌پی‌های هدف:</label>
        <textarea 
          v-model="rawIpsInput" 
          rows="5" 
          class="textarea-box font-mono" 
          placeholder="104.16.1.1&#10;172.64.1.1&#10;162.158.1.1"
        ></textarea>
      </div>

      <div class="config-side card">
        <div class="grid-2">
          <div class="form-group">
            <label>تِردهای موازی:</label>
            <select v-model="concurrency" class="input-box">
              <option :value="4">4 (پایدار)</option>
              <option :value="8">8 (پیش‌فرض)</option>
              <option :value="16">16 (سریع)</option>
              <option :value="32">32 (فوق‌سریع)</option>
            </select>
          </div>
          <div class="form-group">
            <label>تایم‌اوت (ms):</label>
            <select v-model="timeoutMs" class="input-box">
              <option :value="1500">1.5s</option>
              <option :value="2500">2.5s</option>
              <option :value="4000">4.0s</option>
            </select>
          </div>
        </div>

        <div class="action-btn-row">
          <button @click="handleStartScan" :disabled="isScanning" class="btn primary">
            <span v-if="isScanning" class="spinner"></span>
            {{ isScanning ? `اسکن (${scanProgress.current}/${scanProgress.total})...` : '🚀 شروع اسکن' }}
          </button>
          <button v-if="isScanning" @click="stopScan" class="btn danger">توقف</button>
          <button v-if="results.length" @click="exportResultsCsv" class="btn secondary">CSV</button>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="isScanning" class="progress-bar-wrap">
      <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- Live Logs -->
    <div v-if="liveLogs.length" class="terminal-log-box card">
      <div class="terminal-header">
        <span class="terminal-title">📟 لاگ زنده اسکنر</span>
        <button @click="liveLogs = []" class="btn small secondary">پاکسازی</button>
      </div>
      <div class="terminal-logs font-mono">
        <div v-for="(log, idx) in liveLogs.slice(-25)" :key="idx" :class="['log-line', log.type]">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- Results Table -->
    <div v-if="results.length" class="results-box card">
      <div class="results-header">
        <div class="stats">
          <span>کل: <b>{{ results.length }}</b></span>
          <span>سالم: <b class="text-green">{{ healthyCount }}</b></span>
          <span>ناموفق: <b class="text-red">{{ failedCount }}</b></span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>آدرس IP</th>
              <th>تاخیر</th>
              <th>Colo</th>
              <th>منبع</th>
              <th>وضعیت</th>
              <th>سرعت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in displayResults" :key="item.ip">
              <td>{{ idx + 1 }}</td>
              <td class="font-mono text-cyan font-bold">{{ item.ip }}</td>
              <td class="font-mono">
                <span v-if="item.latency !== null" :class="getLatencyClass(item.latency)">{{ item.latency }} ms</span>
                <span v-else-if="item.status === 'testing'" class="text-yellow">تست...</span>
                <span v-else class="text-red">Timeout</span>
              </td>
              <td class="font-mono text-muted">
                <span v-if="item.colo" class="text-green">{{ item.colo }}</span>
                <span v-if="item.crossVerified" class="verified-badge">✓✓</span>
                <span v-if="item.city" class="text-muted"> — {{ item.city }}</span>
                <span v-if="!item.colo">-</span>
              </td>
              <td class="font-mono text-muted">
                {{ item.source === 'edge' ? '🌐 Edge' : item.source === 'local' ? '📱 محلی' : '-' }}
              </td>
              <td>
                <span :class="['badge', item.status]">
                  {{ item.status === 'ok' ? 'سالم' : item.status === 'testing' ? 'تست' : 'ناموفق' }}
                </span>
              </td>
              <td>
                <span v-if="item.speedMbps" class="text-green font-bold">{{ item.speedMbps }} MB/s</span>
                <button v-else-if="item.status === 'ok'" @click="runSpeed(item)" :disabled="item.speedTesting" class="btn small secondary">
                  {{ item.speedTesting ? '...' : 'تست سرعت' }}
                </button>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <button @click="$emit('select-clean-ip', item.ip)" class="btn small primary">
                  انتقال به بهینه‌ساز
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useScanner } from '../../composables/useScanner';
import { generateRandomCloudflareIps } from '../../utils/scanner/ipPool';
import { getWorkerUrl } from '../../utils/workerApi';

const emit = defineEmits(['select-clean-ip']);

const {
  rawIpsInput,
  concurrency,
  timeoutMs,
  isScanning,
  results,
  scanProgress,
  healthyCount,
  failedCount,
  displayResults,
  startScan,
  stopScan,
  runSpeed
} = useScanner();

const largePoolIps = ref([]);
const liveLogs = ref([]);
const hasWorker = computed(() => !!getWorkerUrl());
const operatorPresets = ref({
  mci: { name: 'همراه اول', ips: ['104.16.1.1', '104.16.12.1', '172.64.80.1'] },
  mtn: { name: 'ایرانسل', ips: ['104.16.2.1', '104.17.3.1', '172.67.1.1'] },
  rightel: { name: 'رایتل', ips: ['104.16.5.1', '104.17.8.1', '172.64.120.1'] },
  tci: { name: 'مخابرات و شاتل', ips: ['104.16.100.1', '104.17.150.1', '172.67.150.1'] }
});

onMounted(async () => {
  try {
    const res = await fetch('./data/cloudflare-ips.json');
    const data = await res.json();
    largePoolIps.value = data.ips || [];
  } catch {
    largePoolIps.value = generateRandomCloudflareIps(500);
  }
  try {
    const opRes = await fetch('./data/operator-presets.json');
    operatorPresets.value = await opRes.json();
  } catch {}
});

const currentPoolCount = computed(() => rawIpsInput.value.split('\n').filter(i => i.trim().length > 0).length);
const progressPercent = computed(() => {
  if (!scanProgress.value.total) return 0;
  return Math.round((scanProgress.value.current / scanProgress.value.total) * 100);
});

const loadLargePool = () => { rawIpsInput.value = largePoolIps.value.slice(0, 1000).join('\n'); };
const generateRandomSample = (count) => { rawIpsInput.value = generateRandomCloudflareIps(count).join('\n'); };
const loadOperatorPreset = (key) => {
  if (operatorPresets.value[key]?.ips) rawIpsInput.value = operatorPresets.value[key].ips.join('\n');
};

const handleStartScan = async () => {
  liveLogs.value = [];
  const nowStr = () => new Date().toTimeString().split(' ')[0];
  const modeMsg = hasWorker.value ? 'اسکن دسته‌ای Edge (TCP + Colo)...' : `اسکن محلی با ${concurrency.value} ترد`;
  liveLogs.value.push({ time: nowStr(), message: modeMsg, type: 'info' });
  await startScan();
  const ok = results.value.filter(r => r?.status === 'ok');
  liveLogs.value.push({ time: nowStr(), message: `اسکن کامل — ${ok.length} آی‌پی تمیز`, type: 'success' });
};

const exportResultsCsv = () => {
  const rows = [['IP', 'Latency', 'Colo', 'City', 'Source', 'Status', 'Speed']];
  displayResults.value.forEach(r => rows.push([r.ip, r.latency || '', r.colo || '', r.city || '', r.source || '', r.status, r.speedMbps || '']));
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `cf_ips_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getLatencyClass = (lat) => {
  if (lat < 130) return 'text-green font-bold';
  if (lat < 220) return 'text-yellow';
  return 'text-red';
};
</script>

<style scoped>
.scanner-module { display: flex; flex-direction: column; gap: 16px; }
.notice-box {
  font-size: 0.80rem;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: rgba(251, 191, 36, 0.06);
  border: 1px solid rgba(251, 191, 36, 0.20);
  color: #fbbf24;
}
.notice-box.ok {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.20);
  color: #34d399;
}
.verified-badge { color: #3ddc84; font-size: 0.65rem; margin-inline-start: 3px; font-weight: 800; }

.pool-selector { padding: 14px; }
.selector-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  margin-bottom: 10px;
  color: #b8c9e2;
}
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip-btn {
  background: rgba(30, 41, 59, 0.50);
  color: #b8c9e2;
  border: 1px solid rgba(56, 189, 248, 0.10);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(6px);
}
.chip-btn:hover { background: rgba(37, 99, 235, 0.15); color: #fff; border-color: rgba(56, 189, 248, 0.25); }
.chip-btn.highlight { border-color: rgba(56, 189, 248, 0.30); color: var(--accent-cyan); font-weight: 700; }

.scanner-controls-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}
.config-side { display: flex; flex-direction: column; justify-content: space-between; }
.action-btn-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }

.progress-bar-wrap { width: 100%; height: 4px; background: rgba(30, 41, 59, 0.60); border-radius: 2px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #38bdf8); transition: width 0.3s ease; border-radius: 2px; }

.terminal-log-box { padding: 12px; }
.terminal-header { display: flex; justify-content: space-between; align-items: center; }
.terminal-title { font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan); }
.terminal-logs {
  font-size: 0.73rem;
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 6px;
}
.log-line { display: flex; gap: 8px; }
.log-time { color: var(--text-muted); }
.log-line.info .log-msg { color: #8da4c7; }
.log-line.success .log-msg { color: #34d399; font-weight: 700; }
.log-line.error .log-msg { color: #f87171; }

.results-box { display: flex; flex-direction: column; gap: 12px; }
.results-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; }
.stats { display: flex; gap: 14px; }

@media (max-width: 768px) {
  .scanner-controls-grid { grid-template-columns: 1fr; }
}
</style>
