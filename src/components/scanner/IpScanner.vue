<template>
  <div class="scanner-module">
    <div class="card-header">
      <h3>🧪 اسکنر پیشرفته آی‌پی کلودفلر (Clean IP Scanner Pro)</h3>
      <p class="desc">مخزن بیش از ۳,۸۰۰ آی‌پی واقعی کلودفلر؛ اسکنر موازی PBP (Parallel Batch Probe) با هندشیک واقعی TCP و تایید Colo/دیتاسنتر از طریق ورکر، به‌همراه پروب محلی از مرورگر شما</p>
    </div>

    <div v-if="!hasWorker" class="notice-box card">
      ⚠️ برای فعال‌سازی اسکن دسته‌ای واقعی در Edge (هندشیک TCP واقعی + تشخیص Colo) آدرس Cloudflare Worker خود را در تب «تنظیمات» وارد کنید. بدون آن، اسکن فقط با پروب محلی مرورگر (کندتر و بدون اطلاعات Colo) انجام می‌شود.
    </div>
    <div v-else class="notice-box ok card">
      ✅ اسکن دسته‌ای Edge فعال است — هندشیک TCP واقعی + تایید Colo/دیتاسنتر برای هر آی‌پی از طریق ورکر شما انجام می‌شود.
    </div>

    <!-- Pool and Preset Selector -->
    <div class="pool-selector card">
      <div class="selector-header">
        <span>مخزن و رنج‌های انتخابی:</span>
        <span class="pool-count font-mono text-cyan">{{ currentPoolCount.toLocaleString() }} آی‌پی آماده</span>
      </div>
      <div class="chip-row">
        <button @click="loadLargePool" class="chip-btn highlight">
          🌐 بارگذاری مخزن ۳,۸۰۰+ آی‌پی
        </button>
        <button @click="generateRandomSample(100)" class="chip-btn">
          🎲 تولید ۱۰۰ آی‌پی تصادفی
        </button>
        <button @click="generateRandomSample(500)" class="chip-btn">
          🎲 تولید ۵۰۰ آی‌پی تصادفی
        </button>
        <button @click="generateRandomSample(1500)" class="chip-btn">
          🎲 تولید ۱,۵۰۰ آی‌پی تصادفی
        </button>
        <button @click="loadOperatorPreset('mci')" class="chip-btn">همراه اول (MCI)</button>
        <button @click="loadOperatorPreset('mtn')" class="chip-btn">ایرانسل (MTN)</button>
        <button @click="loadOperatorPreset('rightel')" class="chip-btn">رایتل (Rightel)</button>
        <button @click="loadOperatorPreset('tci')" class="chip-btn">مخابرات و شاتل</button>
      </div>
    </div>

    <!-- Scan Input & Config -->
    <div class="scanner-controls-grid">
      <div class="form-group card">
        <label>لیست آی‌پی‌های هدف برای اسکن:</label>
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
            <label>تعداد تِردهای موازی:</label>
            <select v-model="concurrency" class="input-box">
              <option :value="4">4 تِرد (پایدار)</option>
              <option :value="8">8 تِرد (پیش‌فرض)</option>
              <option :value="16">16 تِرد (سریع)</option>
              <option :value="32">32 تِرد (فوق‌سریع)</option>
            </select>
          </div>
          <div class="form-group">
            <label>تایم‌اوت پینگ (میلی‌ثانیه):</label>
            <select v-model="timeoutMs" class="input-box">
              <option :value="1500">1.5 ثانیه</option>
              <option :value="2500">2.5 ثانیه</option>
              <option :value="4000">4.0 ثانیه</option>
            </select>
          </div>
        </div>

        <div class="action-btn-row">
          <button @click="handleStartScan" :disabled="isScanning" class="btn primary">
            <span v-if="isScanning" class="spinner"></span>
            {{ isScanning ? `در حال اسکن (${scanProgress.current}/${scanProgress.total})...` : '🚀 شروع اسکن موازی' }}
          </button>
          <button v-if="isScanning" @click="stopScan" class="btn danger">توقف</button>
          <button v-if="results.length" @click="exportResultsCsv" class="btn secondary">دانلود خروجی CSV</button>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="isScanning" class="progress-bar-wrap">
      <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- Live Scan Console Logger -->
    <div v-if="liveLogs.length" class="terminal-log-box card">
      <div class="terminal-header">
        <span class="terminal-title">📟 کنسول زنده اسکنر (Live Scan Logs)</span>
        <button @click="liveLogs = []" class="btn small secondary">پاکسازی لاگ</button>
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
              <th>میانگین تاخیر</th>
              <th>Colo / دیتاسنتر</th>
              <th>منبع</th>
              <th>وضعیت</th>
              <th>تست سرعت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in displayResults" :key="item.ip">
              <td>{{ idx + 1 }}</td>
              <td class="font-mono text-cyan font-bold">{{ item.ip }}</td>
              <td class="font-mono">
                <span v-if="item.latency !== null" :class="getLatencyClass(item.latency)">
                  {{ item.latency }} ms
                </span>
                <span v-else-if="item.status === 'testing'" class="text-yellow">تست...</span>
                <span v-else class="text-red">Timeout</span>
              </td>
              <td class="font-mono text-muted">
                <span v-if="item.colo" class="text-green">{{ item.colo }}</span>
                <span v-if="item.crossVerified" title="تایید متقاطع با هدر CF-RAY" class="verified-badge">✓✓</span>
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
  mci: { name: 'همراه اول (MCI)', ips: ['104.16.1.1', '104.16.12.1', '172.64.80.1'] },
  mtn: { name: 'ایرانسل (MTN Irancell)', ips: ['104.16.2.1', '104.17.3.1', '172.67.1.1'] },
  rightel: { name: 'رایتل (Rightel)', ips: ['104.16.5.1', '104.17.8.1', '172.64.120.1'] },
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

const currentPoolCount = computed(() => {
  return rawIpsInput.value.split('\n').filter(i => i.trim().length > 0).length;
});

const progressPercent = computed(() => {
  if (!scanProgress.value.total) return 0;
  return Math.round((scanProgress.value.current / scanProgress.value.total) * 100);
});

const loadLargePool = () => {
  rawIpsInput.value = largePoolIps.value.slice(0, 1000).join('\n');
};

const generateRandomSample = (count) => {
  rawIpsInput.value = generateRandomCloudflareIps(count).join('\n');
};

const loadOperatorPreset = (key) => {
  if (operatorPresets.value[key] && operatorPresets.value[key].ips) {
    rawIpsInput.value = operatorPresets.value[key].ips.join('\n');
  }
};

const handleStartScan = async () => {
  liveLogs.value = [];
  const nowStr = () => new Date().toTimeString().split(' ')[0];
  const modeMsg = hasWorker.value
    ? `شروع اسکن دسته‌ای واقعی در Edge (هندشیک TCP + تایید Colo)...`
    : `شروع اسکن محلی از مرورگر با ${concurrency.value} تِرد موازی (بدون ورکر، بدون Colo)...`;
  liveLogs.value.push({ time: nowStr(), message: modeMsg, type: 'info' });

  await startScan();

  const ok = results.value.filter(r => r && r.status === 'ok');
  const withColo = results.value.filter(r => r && r.colo).length;
  liveLogs.value.push({
    time: nowStr(),
    message: `اسکن کامل شد. ${ok.length} آی‌پی تمیز تایید شدند${withColo ? ` (${withColo} با تایید Colo واقعی)` : ''}.`,
    type: 'success'
  });
};

const exportResultsCsv = () => {
  const rows = [['IP', 'Latency (ms)', 'Colo', 'City', 'Source', 'Status', 'Speed (MB/s)']];
  displayResults.value.forEach(r => {
    rows.push([r.ip, r.latency || '', r.colo || '', r.city || '', r.source || '', r.status, r.speedMbps || '']);
  });
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `cloudflare_clean_ips_${Date.now()}.csv`);
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
.scanner-module {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.notice-box {
  font-size: 0.8rem;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: #fbbf24;
}
.notice-box.ok {
  background: rgba(52, 211, 153, 0.08);
  border-color: rgba(52, 211, 153, 0.35);
  color: #34d399;
}
.verified-badge {
  color: #3ddc84;
  font-size: 0.65rem;
  margin-inline-start: 3px;
  font-weight: 800;
}
.pool-selector {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px;
}
.selector-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 10px;
  color: #cbd5e1;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip-btn {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}
.chip-btn:hover { background: #334155; color: #fff; }
.chip-btn.highlight { border-color: var(--accent-cyan); color: var(--accent-cyan); font-weight: bold; }

.scanner-controls-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}
@media (max-width: 768px) {
  .scanner-controls-grid { grid-template-columns: 1fr; }
}

.config-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.action-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.progress-bar-wrap {
  width: 100%;
  height: 6px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0284c7, #38bdf8);
  transition: width 0.3s ease;
}

.terminal-log-box {
  background: #020617;
  border: 1px solid #334155;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.terminal-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent-cyan);
}
.terminal-logs {
  font-size: 0.75rem;
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.log-line { display: flex; gap: 8px; }
.log-time { color: var(--text-muted); }
.log-line.info .log-msg { color: #94a3b8; }
.log-line.success .log-msg { color: #34d399; font-weight: 700; }
.log-line.error .log-msg { color: #f87171; }

.results-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.85rem;
}
.stats { display: flex; gap: 14px; }
</style>
