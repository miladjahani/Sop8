<template>
  <div class="proxy-injector card">
    <label class="toggle-wrap">
      <input type="checkbox" v-model="enabled" />
      <span>📌 تزریق پروکسی برای آی‌پی ثابت (Static IP via Proxy Chain — HTTP/SOCKS4/SOCKS5)</span>
    </label>

    <div v-if="enabled" class="body">
      <p class="desc">
        این پروکسی به‌عنوان <b>خروجی نهایی</b> کل ترافیک اینترنت شما تنظیم می‌شود — یعنی
        دستگاه شما اول از تونل VLESS/Trojan عبور می‌کند (برای دورزدن فیلترینگ)، و سپس
        <b>تمام</b> داده از این پروکسی HTTP/SOCKS خارج می‌شود، پس مقصدها (مثل نتفلیکس) این پروکسی
        را به‌عنوان کشور شما می‌بینند — نه سرور اصلی VPN را.
        این با فیلد واقعی <code>dialer-proxy</code> در Clash Meta و <code>detour</code> در Sing-box
        پیاده‌سازی شده (پروکسی از طریق بهترین نود VLESS/Trojان به اینترنت وصل می‌شود، و به‌صورت
        پیش‌فرض به‌عنوان خروجی فعال انتخاب شده است).
        ⚠️ فقط روی خروجی <b>Clash Meta</b> و <b>Sing-box</b> اعمال می‌شود — لینک‌های خام
        (<code>vless://</code>, <code>trojan://</code>) استانداردی برای زنجیره پروکسی ندارند.
      </p>

      <div class="feed-row">
        <button
          v-for="(feed, key) in feeds"
          :key="key"
          @click="loadFeed(key)"
          :disabled="loadingFeed === key"
          class="btn small secondary"
        >
          <span v-if="loadingFeed === key" class="spinner"></span>
          {{ loadingFeed === key ? 'در حال دریافت...' : `📥 دریافت ${feed.label} از openproxylist` }}
        </button>
      </div>
      <p v-if="feedMsg" class="feed-msg" :class="feedOk ? 'text-green' : 'text-red'">{{ feedMsg }}</p>

      <div v-if="proxyList.length" class="list-actions">
        <button @click="testAllLive" :disabled="testingLive || !hasWorker" class="btn small primary">
          <span v-if="testingLive" class="spinner"></span>
          {{ testingLive ? 'در حال تست زنده بودن...' : '🧪 تست واقعی زنده بودن (TCP)' }}
        </button>
        <button @click="detectCountries" :disabled="detectingGeo || !hasWorker" class="btn small secondary">
          <span v-if="detectingGeo" class="spinner"></span>
          {{ detectingGeo ? 'در حال تشخیص کشور...' : '🌍 تشخیص کشور واقعی (GeoIP)' }}
        </button>
        <span class="count-badge">{{ proxyList.length }} پروکسی دریافت‌شده</span>
      </div>
      <p v-if="!hasWorker" class="hint text-yellow">برای تست زنده بودن و تشخیص کشور، آدرس Worker را در تنظیمات وارد کنید.</p>

      <div v-if="countryOptions.length" class="country-filter-row">
        <label>فیلتر بر اساس کشور:</label>
        <select v-model="countryFilter" class="input-box font-mono">
          <option value="">همه کشورها ({{ proxyList.length }})</option>
          <option v-for="c in countryOptions" :key="c.code" :value="c.code">
            {{ c.flag }} {{ c.name }} ({{ c.count }})
          </option>
        </select>
      </div>

      <div v-if="proxyList.length" class="proxy-table-wrap">
        <table class="proxy-table">
          <thead>
            <tr><th></th><th>کشور</th><th>IP</th><th>Port</th><th>وضعیت</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in displayList" :key="`${p.ip}:${p.port}`" @click="selectProxy(p)" :class="{ active: selected && selected.ip === p.ip && selected.port === p.port }">
              <td><input type="radio" :checked="selected && selected.ip === p.ip && selected.port === p.port" readonly /></td>
              <td>
                <span v-if="p.countryCode">{{ countryCodeToFlag(p.countryCode) }} {{ p.country }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="font-mono">{{ p.ip }}</td>
              <td class="font-mono">{{ p.port }}</td>
              <td>
                <span v-if="p.status === 'ok'" class="text-green">✓ زنده ({{ p.latency }}ms)</span>
                <span v-else-if="p.status === 'error'" class="text-red">✗ پاسخ‌نداد</span>
                <span v-else class="text-muted">تست‌نشده</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="manual-entry">
        <label>یا آدرس پروکسی را دستی وارد کنید:</label>
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

      <div v-if="selected" class="selected-summary">
        ✅ پروکسی انتخاب‌شده: <span class="font-mono">{{ selectedType }}://{{ selected.ip }}:{{ selected.port }}</span>
        <span v-if="selected.countryCode">{{ countryCodeToFlag(selected.countryCode) }} {{ selected.country }}</span>
        <br />این پروکسی به‌عنوان <b>خروجی پیش‌فرض کل ترافیک</b> در Clash Meta/Sing-box تنظیم می‌شود —
        یعنی تمام داده (نه فقط اتصال به سرور VPN) از این IP خارج خواهد شد.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { fetchProxyFeed, probeProxyBatch, lookupProxyCountries, countryCodeToFlag, PROXY_FEEDS } from '../../utils/optimizer/proxySource';
import { getWorkerUrl } from '../../utils/workerApi';

const emit = defineEmits(['update:frontProxy']);

const enabled = ref(false);
const feeds = PROXY_FEEDS;
const loadingFeed = ref(null);
const feedMsg = ref('');
const feedOk = ref(true);
const proxyList = ref([]);
const testingLive = ref(false);
const detectingGeo = ref(false);
const countryFilter = ref('');
const selected = ref(null);
const selectedType = ref('socks5');

const manualType = ref('socks5');
const manualIp = ref('');
const manualPort = ref('');
const manualUser = ref('');
const manualPass = ref('');

const hasWorker = computed(() => !!getWorkerUrl());

const countryOptions = computed(() => {
  const counts = {};
  proxyList.value.forEach(p => {
    if (!p.countryCode) return;
    if (!counts[p.countryCode]) counts[p.countryCode] = { code: p.countryCode, name: p.country, flag: countryCodeToFlag(p.countryCode), count: 0 };
    counts[p.countryCode].count++;
  });
  return Object.values(counts).sort((a, b) => b.count - a.count);
});

const displayList = computed(() => {
  const filtered = countryFilter.value
    ? proxyList.value.filter(p => p.countryCode === countryFilter.value)
    : proxyList.value;
  return filtered.slice(0, 80);
});

async function loadFeed(type) {
  loadingFeed.value = type;
  feedMsg.value = '';
  countryFilter.value = '';
  try {
    const worker = getWorkerUrl();
    const { list, via } = await fetchProxyFeed(type, worker);
    proxyList.value = list.map(p => ({ ...p, status: 'untested', latency: null, country: null, countryCode: null }));
    selectedType.value = type;
    feedOk.value = true;
    const viaLabel = via === 'worker' ? 'Worker' : via === 'direct' ? 'مستقیم از GitHub' : via;
    feedMsg.value = `✅ ${list.length} پروکسی ${feeds[type].label} از roosterkid/openproxylist دریافت شد (${viaLabel})`;
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
    const batch = proxyList.value.slice(0, 200); // real bounded batch to keep the Worker call fast
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

async function detectCountries() {
  if (!proxyList.value.length) return;
  detectingGeo.value = true;
  try {
    const worker = getWorkerUrl();
    // Real GeoIP is fetched for the currently-live-looking or first-N proxies
    // to keep it fast; ip-api.com's batch endpoint handles up to 100 per call.
    const batch = proxyList.value.slice(0, 200);
    const withGeo = await lookupProxyCountries(batch, worker);
    const byKey = {};
    withGeo.forEach(p => { byKey[`${p.ip}:${p.port}`] = p; });
    proxyList.value = proxyList.value.map(p => byKey[`${p.ip}:${p.port}`] || p);
    const found = withGeo.filter(p => p.countryCode).length;
    feedOk.value = true;
    feedMsg.value = `🌍 کشور ${found} پروکسی از ${batch.length} پروکسی تشخیص داده شد.`;
  } catch (e) {
    feedOk.value = false;
    feedMsg.value = `❌ ${e.message}`;
  } finally {
    detectingGeo.value = false;
  }
}

function selectProxy(p) {
  selected.value = { ip: p.ip, port: p.port, country: p.country, countryCode: p.countryCode };
  emitFrontProxy();
}

function applyManual() {
  if (!manualIp.value.trim() || !manualPort.value) return;
  selectedType.value = manualType.value;
  selected.value = { ip: manualIp.value.trim(), port: Number(manualPort.value), country: null, countryCode: null };
  emitFrontProxy();
}

function emitFrontProxy() {
  if (!selected.value) { emit('update:frontProxy', null); return; }
  const clashType = selectedType.value === 'socks5' || selectedType.value === 'socks4' ? 'socks5' : 'http';
  const sbType = selectedType.value === 'http' ? 'http' : 'socks';
  const countryTag = selected.value.countryCode ? `${selected.value.countryCode}-` : '';
  emit('update:frontProxy', {
    // Clash Meta shape
    name: `FrontProxy-${countryTag}${selected.value.ip}`,
    type: clashType,
    // Sing-box shape
    tag: `front-proxy-${countryTag}${selected.value.ip}`,
    sbType,
    socksVersion: selectedType.value === 'socks4' ? '4' : '5',
    server: selected.value.ip,
    port: selected.value.port,
    country: selected.value.country,
    countryCode: selected.value.countryCode,
    username: manualUser.value.trim() || undefined,
    password: manualPass.value.trim() || undefined
  });
}
</script>

<style scoped>
.proxy-injector {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 14px;
  margin-bottom: 12px;
}
.body { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; }
.desc { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.7; }
.desc code { color: var(--accent-lime, #c8f135); }
.feed-row { display: flex; flex-wrap: wrap; gap: 8px; }
.feed-msg { font-size: 0.76rem; }
.list-actions { display: flex; align-items: center; gap: 10px; }
.count-badge { font-size: 0.74rem; color: var(--text-secondary); }
.hint { font-size: 0.74rem; }
.country-filter-row { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; }
.country-filter-row select { flex: 1; }
.proxy-table-wrap { max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; }
.proxy-table { width: 100%; font-size: 0.76rem; border-collapse: collapse; }
.proxy-table th { position: sticky; top: 0; background: var(--bg-card); padding: 6px 8px; text-align: right; }
.proxy-table td { padding: 6px 8px; border-top: 1px solid var(--border-color); }
.proxy-table tr { cursor: pointer; }
.proxy-table tr.active { background: rgba(200, 241, 53, 0.08); }
.manual-entry { display: flex; flex-direction: column; gap: 6px; }
.manual-row { display: flex; gap: 6px; }
.small-select { max-width: 100px; }
.small-input { max-width: 90px; }
.selected-summary {
  font-size: 0.78rem;
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #34d399;
  padding: 8px 10px;
  border-radius: 8px;
}
</style>
