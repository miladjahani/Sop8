<template>
  <div class="optimizer-suite">
    <div class="card-header">
      <h3>⚡ بهینه‌ساز جامع کانکشن کلودفلر (CF-Optimizer Master Hub)</h3>
      <p class="desc">مرکز اصلی برنامه: تزریق دسته‌ای آی‌پی و پورت تمیز، پکت‌های فرگمنت ضد DPI، تست پینگ زنده و صدور خروجی چندگانه</p>
    </div>

    <!-- Operator Clean IP Matrix -->
    <CleanIpMatrix 
      :presets="operatorPresets" 
      @select-ip="handleMatrixSelect" 
    />

    <!-- Main Configuration Panel -->
    <div class="card">
      <div class="grid-3">
        <div class="form-group">
          <label>آی‌پی یا دامنه تمیز هدف (Clean IP / Domain):</label>
          <input 
            v-model="cleanIp" 
            placeholder="مثلاً: 104.16.1.1 یا cf.domain.com" 
            class="input-box font-mono" 
          />
        </div>

        <div class="form-group">
          <label>پورت اتصال کلودفلر (Port):</label>
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
            {{ testingPorts ? 'در حال تست واقعی پورت‌ها...' : '🎯 یافتن سریع‌ترین پورت واقعی' }}
          </button>
          <p v-if="portTestMsg" class="port-test-msg" :class="portTestOk ? 'text-green' : 'text-red'">{{ portTestMsg }}</p>
        </div>

        <div class="form-group">
          <label>SNI / Host سفارشی (اختیاری):</label>
          <input 
            v-model="customSni" 
            placeholder="مثلاً: speed.cloudflare.com" 
            class="input-box font-mono" 
          />
        </div>
      </div>

      <!-- Fragment Lab Integration -->
      <div class="fragment-wrapper">
        <label class="toggle-wrap">
          <input type="checkbox" v-model="fragmentEnabled" />
          <span>🧪 فعال‌سازی آزمایشگاه فرگمنت واقعی (FinalMask JSON — سازگار با v2rayNG/PattNG)</span>
        </label>
        <FragmentLab
          v-if="fragmentEnabled"
          v-model:fm="fmValue"
        />
      </div>

      <!-- Real cf-optimizor engine controls -->
      <div class="ara-controls">
        <label class="toggle-wrap aras">
          <input type="checkbox" v-model="arasMode" />
          <span>⚡ حالت Aras (پروفایل سبک واقعی برای اینستاگرام و سرویس‌های حساس به تاخیر)</span>
        </label>

        <button @click="advOpen = !advOpen" class="btn small secondary adv-toggle-btn">
          {{ advOpen ? '▲ بستن تنظیمات پیشرفته (fp / cs)' : '▼ تنظیمات پیشرفته واقعی (Fingerprint / Cipher Suites)' }}
        </button>
        <div v-if="advOpen" class="adv-panel" :class="{ disabled: arasMode }">
          <div class="form-group">
            <label>اثر انگشت TLS (Fingerprint - fp):</label>
            <select v-model="fpValue" :disabled="arasMode" class="input-box font-mono">
              <option value="unsafe">unsafe (پیش‌فرض واقعی)</option>
              <option value="chrome">chrome</option>
              <option value="firefox">firefox</option>
              <option value="safari">safari</option>
              <option value="edge">edge</option>
              <option value="random">random</option>
            </select>
          </div>
          <div class="form-group">
            <label>مجموعه رمزنگاری سفارشی (Cipher Suites - cs):</label>
            <textarea v-model="csValue" :disabled="arasMode" rows="2" class="textarea-box font-mono" placeholder="خالی = مقدار پیش‌فرض واقعی cf-optimizor"></textarea>
          </div>
        </div>
        <p v-if="arasMode" class="aras-hint text-yellow">حالت Aras فعال است: از fp=chrome و مجموعه رمزنگاری سبک استفاده می‌شود؛ فیلدهای بالا غیرفعال هستند.</p>
      </div>

      <!-- Real proxy injector for static-IP chaining -->
      <ProxyInjector @update:front-proxy="frontProxy = $event" />

      <!-- Real subscription URL paste (multi-CORS-proxy fallback fetch) -->
      <div class="form-group">
        <label>یا لینک سابسکریپشن را مستقیم بچسبانید (دریافت واقعی با زنجیره پراکسی):</label>
        <div class="sub-url-row">
          <input v-model="subUrlInput" placeholder="https://example.com/sub/xxxx" class="input-box font-mono" />
          <button @click="handleFetchSub" :disabled="!subUrlInput.trim() || fetchingSub" class="btn small primary">
            <span v-if="fetchingSub" class="spinner"></span>
            {{ fetchingSub ? 'در حال دریافت...' : '📥 دریافت' }}
          </button>
        </div>
        <p v-if="fetchSubMsg" class="port-test-msg" :class="fetchSubOk ? 'text-green' : 'text-red'">{{ fetchSubMsg }}</p>
      </div>

      <!-- Prefix & Tag -->
      <div class="form-group">
        <label>پیشوند نام کانفیگ‌ها (Node Tag Prefix):</label>
        <input v-model="prefix" placeholder="[CF-Clean]" class="input-box" />
      </div>

      <!-- Input Configs Area -->
      <div class="form-group">
        <label>کانفیگ‌های ورودی (VLESS / VMess / Trojan / SS / Hysteria2 / TUIC / Clash / Singbox):</label>
        <textarea 
          v-model="inputNodes" 
          rows="5" 
          class="textarea-box font-mono" 
          placeholder="کانفیگ‌ها یا لینک سابسکریپشن را اینجا وارد کنید یا از تب سابسکریپشن بفرستید..."
        ></textarea>
      </div>

      <div class="btn-action-row">
        <button @click="executeOptimization" :disabled="!inputNodes.trim()" class="btn success">
          ⚡ اعمال بهینه‌سازی و بازتولید کانفیگ‌ها
        </button>
        <button @click="testAllOptimizedPings" :disabled="!optimizedNodes.length || testingPings" class="btn primary">
          <span v-if="testingPings" class="spinner"></span>
          {{ testingPings ? 'در حال تست پینگ...' : '📡 تست پینگ زنده تمام نودها' }}
        </button>
        <button @click="clearAll" class="btn secondary">پاکسازی</button>
      </div>
    </div>

    <!-- Output Section -->
    <div v-if="optimizedNodes.length" class="output-card card">
      <div class="output-top">
        <h4>🎉 نتایج بهینه‌شده ({{ optimizedNodes.length }} نود آماده):</h4>
        <div class="output-btns">
          <button @click="copyRaw" class="btn small primary">کپی متن خام</button>
          <button @click="copyBase64" class="btn small secondary">کپی Base64</button>
          <button @click="copyJson" class="btn small secondary">خروجی JSON (iOS/Windows)</button>
          <button @click="exportClashYaml" class="btn small secondary">Clash Meta (YAML)</button>
          <button @click="exportSingboxJson" class="btn small secondary">Sing-box (JSON)</button>
          <button @click="generateWorkerSubLink" class="btn small success">🔗 تولید لینک ساب Worker</button>
        </div>
      </div>

      <p v-if="lastErrors.length" class="parse-errors text-red">
        ⚠️ {{ lastErrors.length }} خط بهینه‌سازی نشد (پروتکل/فرمت نامعتبر) — بقیه خطوط با موفقیت پردازش شدند.
      </p>

      <textarea 
        :value="currentOutputDisplay" 
        rows="6" 
        readonly 
        class="textarea-box font-mono output-area"
      ></textarea>

      <!-- Preview Cards List with Live Ping & QR -->
      <div class="nodes-list-preview">
        <div 
          v-for="(uri, idx) in optimizedNodes.slice(0, 15)" 
          :key="idx" 
          class="node-card-item card"
        >
          <div class="node-info font-mono">
            <span class="idx">#{{ idx + 1 }}</span>
            <span class="uri-text" :title="uri">{{ uri }}</span>
          </div>
          <div class="node-meta-row">
            <span v-if="pingResults[uri] !== undefined" :class="['ping-badge', getPingClass(pingResults[uri])]">
              {{ pingResults[uri] !== null ? pingResults[uri] + ' ms' : 'Timeout' }}
            </span>
            <button @click="testSinglePing(uri)" class="btn small secondary">تست پینگ</button>
            <button @click="handleOpenQr(uri)" class="btn small secondary">QR Code</button>
            <button @click="handleCopySingle(uri)" class="btn small primary">کپی</button>
          </div>
        </div>
        <p v-if="optimizedNodes.length > 15" class="more-hint text-muted">
          و {{ optimizedNodes.length - 15 }} نود دیگر در کادر متنی بالا موجود است...
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

watch(() => props.initialCleanIp, (val) => {
  if (val) cleanIp.value = val;
});

watch(() => props.initialNodes, (val) => {
  if (val) inputNodes.value = val;
});

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
  alert('کانفیگ‌های بهینه‌شده کپی شدند!');
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
  alert('خروجی JSON (سازگار با v2rayN/iOS) کپی شد!');
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
    const viaLabel = via === 'worker' ? 'Cloudflare Worker شما' : via === 'direct' ? 'اتصال مستقیم' : `پراکسی عمومی (${via})`;
    fetchSubMsg.value = `✅ ${lines.length} کانفیگ دریافت شد (از طریق ${viaLabel})`;
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
    type: frontProxy.value.type, // 'http' | 'socks5'
    server: frontProxy.value.server,
    port: frontProxy.value.port,
    username: frontProxy.value.username,
    password: frontProxy.value.password
  } : null;
  const yaml = toClashMeta(nodes, 'PROXIES', clashFrontProxy);
  customFormattedText.value = yaml;
  await navigator.clipboard.writeText(yaml);
  alert(clashFrontProxy ? 'کانفیگ Clash Meta با خروجی پروکسی کشور دلخواه (کل ترافیک از آن خارج می‌شود) کپی شد!' : 'کانفیگ Clash Meta (YAML) کپی شد!');
};

const exportSingboxJson = async () => {
  activeFormat.value = 'custom';
  const nodes = parseMultipleNodes(optimizedRaw.value);
  const sbFrontProxy = frontProxy.value ? {
    tag: frontProxy.value.tag,
    type: frontProxy.value.sbType, // 'http' | 'socks'
    server: frontProxy.value.server,
    port: frontProxy.value.port,
    username: frontProxy.value.username,
    password: frontProxy.value.password,
    socksVersion: frontProxy.value.socksVersion
  } : null;
  const json = toSingbox(nodes, sbFrontProxy);
  customFormattedText.value = json;
  await navigator.clipboard.writeText(json);
  alert(sbFrontProxy ? 'کانفیگ Sing-box با خروجی پروکسی کشور دلخواه (کل ترافیک از آن خارج می‌شود) کپی شد!' : 'کانفیگ Sing-box (JSON) کپی شد!');
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
    alert('لطفاً ابتدا در تب تنظیمات، آدرس Cloudflare Worker را وارد نمایید.');
    return;
  }
  const subLink = `${worker}/sub?ip=${encodeURIComponent(cleanIp.value)}&port=${cleanPort.value}&sni=${encodeURIComponent(customSni.value)}`;
  navigator.clipboard.writeText(subLink);
  alert('لینک سابسکریپشن مستقیم کپی شد:\n' + subLink);
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
      portTestMsg.value = `✅ سریع‌ترین پورت واقعی: ${data.best.port} (${data.best.latency} ms) — از میان ${data.results.length} پورت تست‌شده`;
    } else {
      portTestOk.value = false;
      portTestMsg.value = '❌ هیچ‌کدام از پورت‌های استاندارد کلودفلر روی این آی‌پی پاسخ ندادند.';
    }
  } catch (e) {
    portTestOk.value = false;
    portTestMsg.value = `❌ خطا: ${e.message}`;
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
  gap: 16px;
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
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}
.toggle-wrap.aras { color: var(--accent-green, #3ddc84); }
.adv-toggle-btn { width: 100%; margin-top: 4px; }
.adv-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
.adv-panel.disabled { opacity: 0.5; pointer-events: none; }
.aras-hint { font-size: 0.76rem; margin-top: 6px; }
.sub-url-row { display: flex; gap: 8px; }
.sub-url-row input { flex: 1; }
.parse-errors { font-size: 0.78rem; margin-top: -4px; }
.fragment-wrapper {
  margin-bottom: 12px;
}
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--accent-cyan);
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 8px;
}
.btn-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.output-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-color: var(--accent-green);
}
.output-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.output-top h4 { color: var(--accent-green); }
.output-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.output-area { border-color: var(--accent-green); }

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
  padding: 10px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
}
.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  font-size: 0.78rem;
}
.idx { color: var(--accent-cyan); font-weight: bold; }
.uri-text {
  color: #94a3b8;
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
  border-top: 1px solid var(--border-color);
  padding-top: 6px;
}
.ping-badge {
  font-size: 0.76rem;
  font-family: monospace;
  direction: ltr;
}
.more-hint {
  font-size: 0.78rem;
  text-align: center;
}
</style>
