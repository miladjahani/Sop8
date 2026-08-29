<template>
  <div class="optimizer-suite">
    <div class="hero-header">
      <div class="hero-glow"></div>
      <h3 class="hero-title">⚡ بهینه‌ساز جامع کانکشن کلودفلر</h3>
      <p class="hero-sub">CF-Optimizer Master Hub — تزریق دسته‌ای آی‌پی و پورت تمیز، پکت‌های فرگمنت ضد DPI، تست پینگ زنده و صدور خروجی چندگانه</p>
    </div>

    <!-- Operator Clean IP Matrix -->
    <CleanIpMatrix 
      :presets="operatorPresets" 
      @select-ip="handleMatrixSelect" 
    />

    <!-- Main Configuration Panel -->
    <div class="card config-card">
      <div class="grid-3">
        <div class="form-group">
          <label>🎯 آی‌پی یا دامنه تمیز هدف (Clean IP / Domain):</label>
          <input 
            v-model="cleanIp" 
            placeholder="مثلاً: 104.16.1.1 یا cf.domain.com" 
            class="input-box font-mono" 
          />
        </div>

        <div class="form-group">
          <label>🔌 پورت اتصال کلودفلر (Port):</label>
          <select v-model="cleanPort" class="input-box font-mono">
            <option value="">پیش‌فرض کانفیگ</option>
            <optgroup label="پورت‌های TLS / HTTPS">
              <option value="443">443 (استاندارد)</option>
              <option value="8443">8443</option>
              <option value="2053">2053</option>
              <option value="2083">2083</option>
              <option value="2087">2087</option>
              <option value="2096">2096</option>
            </optgroup>
            <optgroup label="پورت‌های Non-TLS / HTTP">
              <option value="80">80 (استاندارد)</option>
              <option value="8080">8080</option>
              <option value="8880">8880</option>
              <option value="2052">2052</option>
              <option value="2082">2082</option>
              <option value="2086">2086</option>
              <option value="2095">2095</option>
            </optgroup>
          </select>
          <button
            @click="handleFindBestPort"
            :disabled="!cleanIp.trim() || testingPorts"
            class="btn small secondary port-test-btn"
          >
            <span v-if="testingPorts" class="spinner"></span>
            {{ testingPorts ? 'تست واقعی پورت‌ها...' : '🎯 یافتن سریع‌ترین پورت واقعی' }}
          </button>
          <p v-if="portTestMsg" class="port-test-msg" :class="portTestOk ? 'text-green' : 'text-red'">{{ portTestMsg }}</p>
        </div>

        <div class="form-group">
          <label>🏷️ SNI / Host سفارشی (اختیاری):</label>
          <input 
            v-model="customSni" 
            placeholder="مثلاً: speed.cloudflare.com" 
            class="input-box font-mono" 
          />
        </div>
      </div>

      <!-- Fragment Lab -->
      <div class="fragment-wrapper">
        <label class="toggle-wrap">
          <input type="checkbox" v-model="fragmentEnabled" />
          <span>🧪 فعال‌سازی آزمایشگاه فرگمنت واقعی (FinalMask JSON — سازگار با v2rayNG/PattNG)</span>
        </label>
        <FragmentLab v-if="fragmentEnabled" v-model:fm="fmValue" />
      </div>

      <!-- Aras Mode & Advanced -->
      <div class="ara-controls">
        <label class="toggle-wrap aras">
          <input type="checkbox" v-model="arasMode" />
          <span>⚡ حالت Aras (پروفایل سبک برای اینستاگرام و سرویس‌های حساس به تاخیر)</span>
        </label>

        <button @click="advOpen = !advOpen" class="btn small secondary adv-toggle-btn">
          {{ advOpen ? '▲ بستن تنظیمات پیشرفته' : '▼ تنظیمات پیشرفته (Fingerprint / Cipher Suites)' }}
        </button>
        <div v-if="advOpen" class="adv-panel" :class="{ disabled: arasMode }">
          <div class="form-group">
            <label>اثر انگشت TLS (Fingerprint):</label>
            <select v-model="fpValue" :disabled="arasMode" class="input-box font-mono">
              <option value="unsafe">unsafe (پیش‌فرض)</option>
              <option value="chrome">chrome</option>
              <option value="firefox">firefox</option>
              <option value="safari">safari</option>
              <option value="edge">edge</option>
              <option value="random">random</option>
            </select>
          </div>
          <div class="form-group">
            <label>مجموعه رمزنگاری سفارشی (Cipher Suites):</label>
            <textarea v-model="csValue" :disabled="arasMode" rows="2" class="textarea-box font-mono" placeholder="خالی = مقدار پیش‌فرض"></textarea>
          </div>
        </div>
        <p v-if="arasMode" class="aras-hint text-yellow">⚡ حالت Aras فعال: fp=chrome و مجموعه رمزنگاری سبک</p>
      </div>

      <!-- Proxy Injector -->
      <ProxyInjector @update:front-proxy="frontProxy = $event" />

      <!-- Subscription URL -->
      <div class="form-group">
        <label>🔗 لینک سابسکریپشن مستقیم:</label>
        <div class="sub-url-row">
          <input v-model="subUrlInput" placeholder="https://example.com/sub/xxxx" class="input-box font-mono" />
          <button @click="handleFetchSub" :disabled="!subUrlInput.trim() || fetchingSub" class="btn small primary">
            <span v-if="fetchingSub" class="spinner"></span>
            {{ fetchingSub ? 'در حال دریافت...' : '📥 دریافت' }}
          </button>
        </div>
        <p v-if="fetchSubMsg" class="port-test-msg" :class="fetchSubOk ? 'text-green' : 'text-red'">{{ fetchSubMsg }}</p>
      </div>

      <!-- Prefix -->
      <div class="form-group">
        <label>📝 پیشوند نام کانفیگ‌ها:</label>
        <input v-model="prefix" placeholder="[CF-Clean]" class="input-box" />
      </div>

      <!-- Input Textarea -->
      <div class="form-group">
        <label>📋 کانفیگ‌های ورودی (VLESS / VMess / Trojan / SS / Hysteria2 / TUIC / Clash / Singbox):</label>
        <textarea 
          v-model="inputNodes" 
          rows="5" 
          class="textarea-box font-mono" 
          placeholder="کانفیگ‌ها یا لینک سابسکریپشن را اینجا وارد کنید..."
        ></textarea>
      </div>

      <div class="btn-action-row">
        <button @click="executeOptimization" :disabled="!inputNodes.trim()" class="btn success">
          ⚡ اعمال بهینه‌سازی و بازتولید
        </button>
        <button @click="testAllOptimizedPings" :disabled="!optimizedNodes.length || testingPings" class="btn primary">
          <span v-if="testingPings" class="spinner"></span>
          {{ testingPings ? 'تست پینگ...' : '📡 تست پینگ زنده' }}
        </button>
        <button @click="clearAll" class="btn secondary">پاکسازی</button>
      </div>
    </div>

    <!-- Output Section -->
    <div v-if="optimizedNodes.length" class="output-card card">
      <div class="output-top">
        <h4 class="output-title">🎉 نتایج بهینه‌شده ({{ optimizedNodes.length }} نود آماده)</h4>
        <div class="output-btns">
          <button @click="copyRaw" class="btn small primary">کپی متن خام</button>
          <button @click="copyBase64" class="btn small secondary">کپی Base64</button>
          <button @click="copyJson" class="btn small secondary">JSON</button>
          <button @click="exportClashYaml" class="btn small secondary">Clash Meta</button>
          <button @click="exportSingboxJson" class="btn small secondary">Sing-box</button>
          <button @click="generateWorkerSubLink" class="btn small success">🔗 لینک ساب Worker</button>
        </div>
      </div>

      <p v-if="lastErrors.length" class="parse-errors text-red">
        ⚠️ {{ lastErrors.length }} خط بهینه‌سازی نشد
      </p>

      <textarea 
        :value="currentOutputDisplay" 
        rows="6" 
        readonly 
        class="textarea-box font-mono output-area"
      ></textarea>

      <!-- Node Preview Cards -->
      <div class="nodes-list-preview">
        <div 
          v-for="(uri, idx) in optimizedNodes.slice(0, 15)" 
          :key="idx" 
          class="node-card-item"
        >
          <div class="node-info font-mono">
            <span class="idx">#{{ idx + 1 }}</span>
            <span class="uri-text" :title="uri">{{ uri }}</span>
          </div>
          <div class="node-meta-row">
            <span v-if="pingResults[uri] !== undefined" :class="['ping-badge', getPingClass(pingResults[uri])]">
              {{ pingResults[uri] !== null ? pingResults[uri] + ' ms' : 'Timeout' }}
            </span>
            <button @click="testSinglePing(uri)" class="btn small secondary">تست</button>
            <button @click="handleOpenQr(uri)" class="btn small secondary">QR</button>
            <button @click="handleCopySingle(uri)" class="btn small primary">کپی</button>
          </div>
        </div>
        <p v-if="optimizedNodes.length > 15" class="more-hint text-muted">
          و {{ optimizedNodes.length - 15 }} نود دیگر...
        </p>
      </div>
    </div>

    <!-- QR Code Modal -->
    <QrCodeModal 
      :is-open="qrOpen" 
      :title="qrTitle" 
      :content="qrContent" 
      @close="qrOpen = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useOptimizer } from '../../composables/useOptimizer';
import { parseMultipleNodes, parseNode } from '../../utils/protocols';
import { toClashMeta } from '../../utils/converters/clash';
import { toSingbox } from '../../utils/converters/singbox';
import { pingNodeHost } from '../../utils/scanner/scannerEngine';
import { findBestCloudflarePort } from '../../utils/optimizer/optimizerEngine';
import { fetchSubscriptionSmart } from '../../utils/optimizer/araEngine';
import { getWorkerUrl } from '../../utils/workerApi';
import CleanIpMatrix from './CleanIpMatrix.vue';
import FragmentLab from './FragmentLab.vue';
import ProxyInjector from './ProxyInjector.vue';
import QrCodeModal from '../common/QrCodeModal.vue';

const props = defineProps({
  initialCleanIp: String,
  initialNodes: String
});

const {
  cleanIp,
  cleanPort,
  customSni,
  prefix,
  inputNodes,
  optimizedNodes,
  fragmentEnabled,
  fpValue,
  csValue,
  fmValue,
  arasMode,
  optimizedRaw,
  optimizedBase64,
  lastErrors,
  optimizeAll
} = useOptimizer();

const fragmentConfig = ref({ length: '10-50', interval: '10-20', packets: 'tlshello' });
const operatorPresets = ref({});
const activeFormat = ref('raw');
const customFormattedText = ref('');
const pingResults = ref({});
const testingPings = ref(false);
const testingPorts = ref(false);
const portTestMsg = ref('');
const portTestOk = ref(true);
const advOpen = ref(false);
const subUrlInput = ref('');
const fetchingSub = ref(false);
const fetchSubMsg = ref('');
const fetchSubOk = ref(true);
const frontProxy = ref(null);

const qrOpen = ref(false);
const qrTitle = ref('');
const qrContent = ref('');

onMounted(async () => {
  try {
    const res = await fetch('./data/operator-presets.json');
    operatorPresets.value = await res.json();
  } catch {}
});

watch(() => props.initialCleanIp, (val) => { if (val) cleanIp.value = val; });
watch(() => props.initialNodes, (val) => { if (val) inputNodes.value = val; });

const handleMatrixSelect = (ip, key) => {
  cleanIp.value = ip;
  prefix.value = `[${operatorPresets.value[key]?.name.split(' ')[0] || 'CF'}]`;
};

const executeOptimization = () => {
  activeFormat.value = 'raw';
  customFormattedText.value = '';
  optimizeAll();
};

const currentOutputDisplay = computed(() => {
  if (activeFormat.value === 'custom') return customFormattedText.value;
  return optimizedRaw.value;
});

const testSinglePing = async (uri) => {
  const node = parseNode(uri);
  if (!node) return;
  pingResults.value[uri] = null;
  const res = await pingNodeHost(node);
  pingResults.value[uri] = res.latency;
};

const testAllOptimizedPings = async () => {
  testingPings.value = true;
  for (const uri of optimizedNodes.value.slice(0, 20)) {
    await testSinglePing(uri);
  }
  testingPings.value = false;
};

const copyRaw = async () => {
  activeFormat.value = 'raw';
  await navigator.clipboard.writeText(optimizedRaw.value);
  alert('کانفیگ‌ها کپی شدند!');
};

const copyBase64 = async () => {
  activeFormat.value = 'custom';
  customFormattedText.value = optimizedBase64.value;
  await navigator.clipboard.writeText(optimizedBase64.value);
  alert('سابسکریپشن Base64 کپی شد!');
};

const copyJson = async () => {
  activeFormat.value = 'custom';
  const json = JSON.stringify(optimizedNodes.value, null, 2);
  customFormattedText.value = json;
  await navigator.clipboard.writeText(json);
  alert('خروجی JSON کپی شد!');
};

const handleFetchSub = async () => {
  if (!subUrlInput.value.trim()) return;
  fetchingSub.value = true;
  fetchSubMsg.value = '';
  try {
    const worker = getWorkerUrl();
    const { lines, via } = await fetchSubscriptionSmart(subUrlInput.value.trim(), worker);
    inputNodes.value = (inputNodes.value.trim() ? inputNodes.value.trim() + '\n' : '') + lines.join('\n');
    fetchSubOk.value = true;
    const viaLabel = via === 'worker' ? 'Worker شما' : via === 'direct' ? 'مستقیم' : via;
    fetchSubMsg.value = `✅ ${lines.length} کانفیگ دریافت شد (${viaLabel})`;
  } catch (e) {
    fetchSubOk.value = false;
    fetchSubMsg.value = `❌ ${e.message}`;
  } finally {
    fetchingSub.value = false;
  }
};

const exportClashYaml = async () => {
  activeFormat.value = 'custom';
  const nodes = parseMultipleNodes(optimizedRaw.value);
  const clashFrontProxy = frontProxy.value ? {
    name: frontProxy.value.name,
    type: frontProxy.value.type,
    server: frontProxy.value.server,
    port: frontProxy.value.port,
    username: frontProxy.value.username,
    password: frontProxy.value.password
  } : null;
  const yaml = toClashMeta(nodes, 'PROXIES', clashFrontProxy);
  customFormattedText.value = yaml;
  await navigator.clipboard.writeText(yaml);
  alert(clashFrontProxy ? 'Clash Meta با زنجیره پروکسی کپی شد!' : 'Clash Meta (YAML) کپی شد!');
};

const exportSingboxJson = async () => {
  activeFormat.value = 'custom';
  const nodes = parseMultipleNodes(optimizedRaw.value);
  const sbFrontProxy = frontProxy.value ? {
    tag: frontProxy.value.tag,
    type: frontProxy.value.sbType,
    server: frontProxy.value.server,
    port: frontProxy.value.port,
    username: frontProxy.value.username,
    password: frontProxy.value.password,
    socksVersion: frontProxy.value.socksVersion
  } : null;
  const json = toSingbox(nodes, sbFrontProxy);
  customFormattedText.value = json;
  await navigator.clipboard.writeText(json);
  alert(sbFrontProxy ? 'Sing-box با زنجیره پروکسی کپی شد!' : 'Sing-box (JSON) کپی شد!');
};

const handleCopySingle = async (uri) => {
  await navigator.clipboard.writeText(uri);
  alert('کانفیگ کپی شد!');
};

const handleOpenQr = (uri) => {
  qrTitle.value = 'بارکد QR اتصال بهینه‌شده';
  qrContent.value = uri;
  qrOpen.value = true;
};

const generateWorkerSubLink = () => {
  const worker = localStorage.getItem('cf_hub_worker_url') || '';
  if (!worker) {
    alert('ابتدا آدرس Worker را در تب تنظیمات وارد کنید.');
    return;
  }
  const subLink = `${worker}/sub?ip=${encodeURIComponent(cleanIp.value)}&port=${cleanPort.value}&sni=${encodeURIComponent(customSni.value)}`;
  navigator.clipboard.writeText(subLink);
  alert('لینک سابسکریپشن کپی شد:\n' + subLink);
};

const handleFindBestPort = async () => {
  if (!cleanIp.value.trim()) return;
  testingPorts.value = true;
  portTestMsg.value = '';
  try {
    const tls = !cleanPort.value || ['443', '8443', '2053', '2083', '2087', '2096'].includes(String(cleanPort.value));
    const data = await findBestCloudflarePort(cleanIp.value.trim(), { tls });
    if (data.best) {
      cleanPort.value = String(data.best.port);
      portTestOk.value = true;
      portTestMsg.value = `✅ سریع‌ترین پورت: ${data.best.port} (${data.best.latency} ms)`;
    } else {
      portTestOk.value = false;
      portTestMsg.value = '❌ هیچ پورتی پاسخ نداد.';
    }
  } catch (e) {
    portTestOk.value = false;
    portTestMsg.value = `❌ ${e.message}`;
  } finally {
    testingPorts.value = false;
  }
};

const getPingClass = (lat) => {
  if (lat === null) return 'text-red font-bold';
  if (lat < 140) return 'text-green font-bold';
  if (lat < 250) return 'text-yellow';
  return 'text-red';
};

const clearAll = () => {
  inputNodes.value = '';
  optimizedNodes.value = [];
  customFormattedText.value = '';
  pingResults.value = {};
};
</script>

<style scoped>
.optimizer-suite {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-header {
  text-align: center;
  padding: 24px 20px;
  position: relative;
}
.hero-glow {
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  margin: 0 auto 16px;
}
.hero-title {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #38bdf8, #60a5fa, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-size: 0.80rem;
  color: var(--text-secondary);
  margin-top: 6px;
}

.config-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.port-test-btn {
  margin-top: 6px;
  width: 100%;
}
.port-test-msg {
  font-size: 0.76rem;
  margin-top: 4px;
}

.ara-controls {
  background: rgba(8, 14, 32, 0.40);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 12px;
}
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent-cyan);
  cursor: pointer;
  margin-bottom: 8px;
}
.toggle-wrap.aras { color: var(--accent-green); }
.adv-toggle-btn { width: 100%; margin-top: 4px; }
.adv-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
.adv-panel.disabled { opacity: 0.45; pointer-events: none; }
.aras-hint { font-size: 0.76rem; margin-top: 6px; }

.fragment-wrapper { margin-bottom: 12px; }

.sub-url-row { display: flex; gap: 8px; }
.sub-url-row input { flex: 1; }

.btn-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.output-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-color: rgba(16, 185, 129, 0.20) !important;
}
.output-card::before {
  background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.20) 50%, transparent 100%) !important;
}
.output-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.output-title {
  color: var(--accent-green);
  font-size: 1rem;
}
.output-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.output-area {
  border-color: rgba(16, 185, 129, 0.20) !important;
}

.parse-errors { font-size: 0.78rem; }

.nodes-list-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.node-card-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: rgba(8, 14, 32, 0.50);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  transition: border-color 0.2s;
}
.node-card-item:hover {
  border-color: rgba(56, 189, 248, 0.18);
}
.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  font-size: 0.76rem;
}
.idx { color: var(--accent-cyan); font-weight: 700; }
.uri-text {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.node-meta-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  border-top: 1px solid rgba(56, 189, 248, 0.06);
  padding-top: 6px;
}
.ping-badge { font-size: 0.74rem; font-family: monospace; direction: ltr; }
.more-hint { font-size: 0.78rem; text-align: center; }
</style>
