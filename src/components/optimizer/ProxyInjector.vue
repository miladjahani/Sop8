<template>
  <div class="proxy-injector card">
    <label class="toggle-wrap">
      <input type="checkbox" v-model="enabled" />
      <span class="toggle-label">📌 تزریق پروکسی برای آی‌پی ثابت (Static IP via Proxy Chain — HTTP/SOCKS4/SOCKS5)</span>
    </label>

    <div v-if="enabled" class="body">
      <p class="desc">
        این قابلیت یک پروکسی HTTP/SOCKS واقعی را جلوی نودها قرار می‌دهد تا خروجی همیشه از یک آی‌پی ثابت عبور کند
        (با فیلد واقعی <code>dialer-proxy</code> در Clash Meta و <code>detour</code> در Sing-box).
        ⚠️ فقط روی خروجی <b>Clash Meta</b> و <b>Sing-box</b> اعمال می‌شود.
      </p>

      <!-- EDT-Pages Rich Feeds -->
      <div class="feed-section">
        <div class="feed-section-header">
          <span class="feed-section-title">🌐 EDT-Pages/Proxy-List (داده غنی با اطلاعات کشور و شهر)</span>
        </div>
        <div class="feed-row">
          <button
            v-for="(feed, key) in edtFeeds"
            :key="'edt-' + key"
            @click="loadEdtFeed(key)"
            :disabled="loadingFeed === 'edt-' + key"
            class="btn small secondary feed-btn"
          >
            <span v-if="loadingFeed === 'edt-' + key" class="spinner"></span>
            {{ loadingFeed === 'edt-' + key ? 'در حال دریافت...' : `📥 دریافت ${feed.label} از EDT` }}
          </button>
        </div>
      </div>

      <!-- openproxylist Feeds -->
      <div class="feed-section">
        <div class="feed-section-header">
          <span class="feed-section-title">📋 openproxylist (متن ساده IP:Port)</span>
        </div>
        <div class="feed-row">
          <button
            v-for="(feed, key) in plFeeds"
            :key="'pl-' + key"
            @click="loadPlFeed(key)"
            :disabled="loadingFeed === 'pl-' + key"
            class="btn small secondary feed-btn"
          >
            <span v-if="loadingFeed === 'pl-' + key" class="spinner"></span>
            {{ loadingFeed === 'pl-' + key ? 'در حال دریافت...' : `📥 دریافت ${feed.label}` }}
          </button>
        </div>
      </div>

      <p v-if="feedMsg" class="feed-msg" :class="feedOk ? 'text-green' : 'text-red'">{{ feedMsg }}</p>

      <!-- Proxy list with rich metadata -->
      <div v-if="proxyList.length" class="list-actions">
        <button @click="testAllLive" :disabled="testingLive || !hasWorker" class="btn small primary">
          <span v-if="testingLive" class="spinner"></span>
          {{ testingLive ? 'در حال تست...' : '🧪 تست زنده بودن (TCP)' }}
        </button>
        <button @click="clearList" class="btn small secondary">🗑️ پاکسازی لیست</button>
        <span class="count-badge">{{ proxyList.length }} پروکسی</span>
      </div>
      <p v-if="!hasWorker" class="hint text-yellow">برای تست زنده بودن، آدرس Worker را در تنظیمات وارد کنید.</p>

      <!-- Country Filter -->
      <div v-if="hasRichData && proxyList.length" class="filter-row">
        <select v-model="countryFilter" class="input-box font-mono small-select">
          <option value="">همه کشورها</option>
          <option v-for="c in availableCountries" :key="c.code" :value="c.code">
            {{ c.emoji }} {{ c.name }} ({{ c.count }})
          </option>
        </select>
        <select v-model="sortBy" class="input-box font-mono small-select">
          <option value="default">ترتیب پیش‌فرض</option>
          <option value="latency">کمترین تاخیر</option>
          <option value="country">کشور</option>
        </select>
      </div>

      <!-- Proxy Table -->
      <div v-if="proxyList.length" class="proxy-table-wrap">
        <table class="proxy-table">
          <thead>
            <tr>
              <th></th>
              <th>IP</th>
              <th>Port</th>
              <th v-if="hasRichData">📍 کشور</th>
              <th v-if="hasRichData">🏙️ شهر</th>
              <th v-if="hasRichData">🏢 سازمان</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="p in displayList" 
              :key="`${p.ip}:${p.port}`" 
              @click="selectProxy(p)" 
              :class="{ active: selected && selected.ip === p.ip && selected.port === p.port }"
            >
              <td><input type="radio" :checked="selected && selected.ip === p.ip && selected.port === p.port" readonly /></td>
              <td class="font-mono ip-cell">{{ p.ip }}</td>
              <td class="font-mono port-cell">{{ p.port }}</td>
              <td v-if="hasRichData" class="country-cell">
                <span v-if="p.countryEmoji" class="country-flag">{{ p.countryEmoji }}</span>
                <span class="country-code">{{ p.countryCode || '-' }}</span>
              </td>
              <td v-if="hasRichData" class="city-cell text-muted">{{ p.city || '-' }}</td>
              <td v-if="hasRichData" class="org-cell text-muted">{{ p.asOrg ? truncate(p.asOrg, 30) : '-' }}</td>
              <td>
                <span v-if="p.status === 'ok'" class="status-ok">✓ {{ p.latency }}ms</span>
                <span v-else-if="p.status === 'error'" class="status-err">✗ پاسخ‌نداد</span>
                <span v-else class="status-untested">تست‌نشده</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Manual Entry -->
      <div class="manual-entry">
        <label class="manual-label">یا آدرس پروکسی را دستی وارد کنید:</label>
        <div class="manual-row">
          <select v-model="manualType" class="input-box font-mono small-select">
            <option value="http">HTTP</option>
            <option value="socks5">SOCKS5</option>
            <option value="socks4">SOCKS4</option>
          </select>
          <input v-model="manualIp" placeholder="IP" class="input-box font-mono" />
          <input v-model="manualPort" placeholder="Port" class="input-box font-mono small-input" />
          <button @click="applyManual" class="btn small primary">اعمال</button>
        </div>
        <div class="manual-row">
          <input v-model="manualUser" placeholder="یوزرنیم (اختیاری)" class="input-box font-mono" />
          <input v-model="manualPass" placeholder="پسورد (اختیاری)" class="input-box font-mono" type="password" />
        </div>
      </div>

      <!-- Selected Summary -->
      <div v-if="selected" class="selected-summary">
        ✅ پروکسی انتخاب‌شده: <span class="font-mono">{{ selectedType }}://{{ selected.ip }}:{{ selected.port }}</span>
        <span v-if="selected.countryEmoji" class="selected-country"> {{ selected.countryEmoji }} {{ selected.countryEn }}</span>
        — از این پس در خروجی Clash Meta و Sing-box به‌عنوان دیالر ثابت اعمال می‌شود.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { fetchProxyFeed, fetchEdtFeed, probeProxyBatch, PROXY_FEEDS, EDT_FEEDS } from '../../utils/optimizer/proxySource';
import { getWorkerUrl } from '../../utils/workerApi';

const emit = defineEmits(['update:frontProxy']);

const enabled = ref(false);
const plFeeds = PROXY_FEEDS;
const edtFeeds = EDT_FEEDS;
const loadingFeed = ref(null);
const feedMsg = ref('');
const feedOk = ref(true);
const proxyList = ref([]);
const testingLive = ref(false);
const selected = ref(null);
const selectedType = ref('socks5');
const countryFilter = ref('');
const sortBy = ref('default');

const manualType = ref('socks5');
const manualIp = ref('');
const manualPort = ref('');
const manualUser = ref('');
const manualPass = ref('');

const hasWorker = computed(() => !!getWorkerUrl());

const hasRichData = computed(() => proxyList.value.some(p => p.countryCode || p.asOrg));

const availableCountries = computed(() => {
  const map = {};
  proxyList.value.forEach(p => {
    if (p.countryCode) {
      if (!map[p.countryCode]) {
        map[p.countryCode] = { code: p.countryCode, emoji: p.countryEmoji || '', name: p.countryEn || p.countryCode, count: 0 };
      }
      map[p.countryCode].count++;
    }
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
});

const filteredList = computed(() => {
  let list = proxyList.value;
  if (countryFilter.value) {
    list = list.filter(p => p.countryCode === countryFilter.value);
  }
  if (sortBy.value === 'latency') {
    list = [...list].sort((a, b) => {
      if (a.status === 'ok' && b.status !== 'ok') return -1;
      if (b.status === 'ok' && a.status !== 'ok') return 1;
      return (a.latency || 9999) - (b.latency || 9999);
    });
  } else if (sortBy.value === 'country') {
    list = [...list].sort((a, b) => (a.countryCode || 'zz').localeCompare(b.countryCode || 'zz'));
  }
  return list;
});

const displayList = computed(() => filteredList.value.slice(0, 80));

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

async function loadEdtFeed(type) {
  loadingFeed.value = 'edt-' + type;
  feedMsg.value = '';
  try {
    const worker = getWorkerUrl();
    const { list, source } = await fetchEdtFeed(type, worker);
    proxyList.value = list.map(p => ({ ...p, status: 'untested', latency: null }));
    selectedType.value = type === 'https' ? 'http' : type;
    feedOk.value = true;
    feedMsg.value = `✅ ${list.length} پروکسی ${EDT_FEEDS[type].label} از ${source} دریافت شد — با اطلاعات کشور، شهر و ASN`;
  } catch (e) {
    feedOk.value = false;
    feedMsg.value = `❌ ${e.message}`;
  } finally {
    loadingFeed.value = null;
  }
}

async function loadPlFeed(type) {
  loadingFeed.value = 'pl-' + type;
  feedMsg.value = '';
  try {
    const worker = getWorkerUrl();
    const { list } = await fetchProxyFeed(type, worker);
    proxyList.value = list.map(p => ({ ...p, status: 'untested', latency: null }));
    selectedType.value = type;
    feedOk.value = true;
    feedMsg.value = `✅ ${list.length} پروکسی ${PROXY_FEEDS[type].label} از openproxylist دریافت شد`;
  } catch (e) {
    feedOk.value = false;
    feedMsg.value = `❌ ${e.message}`;
  } finally {
    loadingFeed.value = null;
  }
}

async function testAllLive() {
  if (!proxyList.value.length) return;
  testingLive.value = true;
  try {
    const worker = getWorkerUrl();
    const batch = proxyList.value.slice(0, 200);
    const results = await probeProxyBatch(batch, worker, { concurrency: 25 });
    const byKey = {};
    results.forEach(r => { byKey[`${r.ip}:${r.port}`] = r; });
    proxyList.value = proxyList.value.map(p => {
      const r = byKey[`${p.ip}:${p.port}`];
      return r ? { ...p, status: r.status, latency: r.latency } : p;
    }).sort((a, b) => {
      if (a.status === 'ok' && b.status !== 'ok') return -1;
      if (b.status === 'ok' && a.status !== 'ok') return 1;
      if (a.status === 'ok' && b.status === 'ok') return (a.latency || 9999) - (b.latency || 9999);
      return 0;
    });
  } catch (e) {
    feedOk.value = false;
    feedMsg.value = `❌ ${e.message}`;
  } finally {
    testingLive.value = false;
  }
}

function selectProxy(p) {
  selected.value = { ip: p.ip, port: p.port, countryEmoji: p.countryEmoji, countryEn: p.countryEn };
  emitFrontProxy();
}

function applyManual() {
  if (!manualIp.value.trim() || !manualPort.value) return;
  selectedType.value = manualType.value;
  selected.value = { ip: manualIp.value.trim(), port: Number(manualPort.value) };
  emitFrontProxy();
}

function clearList() {
  proxyList.value = [];
  selected.value = null;
  countryFilter.value = '';
  feedMsg.value = '';
}

function emitFrontProxy() {
  if (!selected.value) { emit('update:frontProxy', null); return; }
  const clashType = selectedType.value === 'socks5' || selectedType.value === 'socks4' ? 'socks5' : 'http';
  const sbType = selectedType.value === 'http' ? 'http' : 'socks';
  emit('update:frontProxy', {
    name: `FrontProxy-${selected.value.ip}`,
    type: clashType,
    tag: `front-proxy-${selected.value.ip}`,
    sbType,
    socksVersion: selectedType.value === 'socks4' ? '4' : '5',
    server: selected.value.ip,
    port: selected.value.port,
    username: manualUser.value.trim() || undefined,
    password: manualPass.value.trim() || undefined
  });
}
</script>

<style scoped>
.proxy-injector {
  padding: 18px;
}
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.toggle-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-cyan);
}
.body {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.8;
}
.desc code { color: var(--accent-lime); }
.desc b { color: var(--text-primary); }

.feed-section {
  background: rgba(8, 14, 32, 0.40);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  padding: 12px;
}
.feed-section-header {
  margin-bottom: 8px;
}
.feed-section-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}
.feed-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.feed-btn {
  flex-wrap: nowrap;
}
.feed-msg { font-size: 0.76rem; }
.list-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.count-badge {
  font-size: 0.74rem;
  color: var(--text-secondary);
  background: rgba(56, 189, 248, 0.08);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(56, 189, 248, 0.10);
}
.hint { font-size: 0.74rem; }

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.small-select {
  max-width: 180px;
}

.proxy-table-wrap {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}
.proxy-table {
  width: 100%;
  font-size: 0.76rem;
  border-collapse: collapse;
}
.proxy-table th {
  position: sticky;
  top: 0;
  background: rgba(14, 22, 46, 0.90);
  backdrop-filter: blur(12px);
  padding: 8px 10px;
  text-align: right;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.72rem;
  z-index: 2;
}
.proxy-table td {
  padding: 8px 10px;
  border-top: 1px solid rgba(56, 189, 248, 0.05);
}
.proxy-table tr {
  cursor: pointer;
  transition: background 0.2s;
}
.proxy-table tr:hover {
  background: rgba(56, 189, 248, 0.04);
}
.proxy-table tr.active {
  background: rgba(37, 99, 235, 0.12);
}
.ip-cell { color: var(--accent-cyan); font-weight: 600; }
.port-cell { color: var(--text-primary); }
.country-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.country-flag { font-size: 1rem; }
.country-code { font-size: 0.74rem; font-weight: 600; color: var(--text-primary); }
.city-cell { font-size: 0.74rem; }
.org-cell { font-size: 0.72rem; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-ok { color: var(--accent-green); font-weight: 700; font-size: 0.74rem; }
.status-err { color: var(--accent-red); font-size: 0.74rem; }
.status-untested { color: var(--text-muted); font-size: 0.74rem; }

.manual-entry {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(8, 14, 32, 0.35);
  border: 1px solid rgba(56, 189, 248, 0.06);
  border-radius: var(--radius-md);
}
.manual-label { font-size: 0.80rem; color: var(--text-secondary); font-weight: 600; }
.manual-row { display: flex; gap: 6px; }
.small-select { max-width: 100px; }
.small-input { max-width: 90px; }

.selected-summary {
  font-size: 0.78rem;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.20);
  color: #34d399;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  line-height: 1.7;
}
.selected-country { font-weight: 600; margin: 0 4px; }
</style>
