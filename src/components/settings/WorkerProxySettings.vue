<template>
  <div class="settings-suite">
    <div class="card-header">
      <h3>🛠️ دیتابیس و تنظیمات سرورلس</h3>
      <p class="desc">مدیریت حافظه محلی، بکاپ JSON، تنظیمات Cloudflare Worker v5.0.0</p>
    </div>

    <!-- Database Management -->
    <div class="card db-card">
      <div class="db-header">
        <h4>💾 مدیریت پایگاه داده</h4>
        <span class="badge ok">حافظه فعال</span>
      </div>
      <p class="desc">تغییرات به صورت خودکار در حافظه دستگاه ذخیره می‌شوند.</p>
      <div class="db-actions">
        <button @click="downloadBackup" class="btn small success">📥 دانلود بکاپ JSON</button>
        <label class="btn small secondary import-label">
          📤 بازیابی بکاپ
          <input type="file" accept=".json" @change="handleImportBackup" style="display: none;" />
        </label>
        <button @click="resetDatabase" class="btn small danger">🗑️ ریست دیتابیس</button>
      </div>
    </div>

    <!-- Worker URL -->
    <div class="card">
      <div class="form-group">
        <label>آدرس Cloudflare Worker:</label>
        <input 
          v-model="workerUrlInput" 
          placeholder="https://your-worker-name.workers.dev" 
          class="input-box font-mono" 
        />
        <span class="hint">ورکر v5.0.0 با پشتیبانی از TCP Probe, Colo Verify, Batch Scan, Speed Test و /sub</span>
      </div>

      <div class="action-row">
        <button @click="save" class="btn primary">ذخیره آدرس Worker</button>
        <button @click="testConnection" :disabled="testing" class="btn secondary">
          <span v-if="testing" class="spinner"></span>
          {{ testing ? 'تست...' : 'تست اتصال' }}
        </button>
      </div>

      <div v-if="testStatus" :class="['status-box', testStatus.success ? 'ok' : 'err']">
        {{ testStatus.message }}
      </div>
    </div>

    <!-- Worker Features -->
    <div class="card features-card">
      <h4>🚀 امکانات Worker v5.0.0</h4>
      <div class="features-grid">
        <div class="feature-item">
          <span class="feature-icon">🔌</span>
          <span class="feature-name">TCP Socket Probe</span>
          <span class="feature-desc">تست واقعی TCP Handshake با cloudflare:sockets</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🌍</span>
          <span class="feature-name">Colo Verification</span>
          <span class="feature-desc">تایید دیتاسنتر واقعی با cf.resolveOverride</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📡</span>
          <span class="feature-name">Parallel Batch Scanner</span>
          <span class="feature-desc">اسکن موازی ۵۰۰ آی‌پی در هر درخواست</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <span class="feature-name">Streaming Speed Test</span>
          <span class="feature-desc">تست سرعت واقعی از طریق resolveOverride</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔗</span>
          <span class="feature-name">Subscription Provider /sub</span>
          <span class="feature-desc">تولید لینک ساب واقعی با بهینه‌سازی سمت سرور</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🌐</span>
          <span class="feature-name">DoH Gateway</span>
          <span class="feature-desc">DNS over HTTPS از طریق ورکر</span>
        </div>
      </div>
    </div>

    <!-- Worker Script -->
    <div class="card worker-code-card">
      <div class="code-header">
        <h4>📄 اسکریپت Worker v5.0.0</h4>
        <div class="code-actions">
          <button @click="downloadWorkerScript" class="btn small secondary">💾 دانلود فایل</button>
          <button @click="copyWorkerCode" class="btn small success">📋 کپی</button>
        </div>
      </div>
      <textarea :value="workerScriptCode" rows="15" readonly class="textarea-box font-mono code-box"></textarea>
      <div class="code-footer">
        <span class="code-info">ورکر v5.0.0 — ۱۱ endpoint واقعی — نیاز به wrangler.toml با compatibility_date = "2024-09-23"</span>
      </div>
    </div>

    <!-- Deployment Instructions -->
    <div class="card deploy-card">
      <h4>📦 راهنمای استقرار Worker</h4>
      <div class="deploy-steps">
        <div class="deploy-step">
          <span class="step-num">۱</span>
          <div class="step-content">
            <span class="step-title">ایجاد پروژه Worker</span>
            <code class="step-code">wrangler init misub-cf-proxy-worker</code>
          </div>
        </div>
        <div class="deploy-step">
          <span class="step-num">۲</span>
          <div class="step-content">
            <span class="step-title">کپی worker.js و wrangler.toml</span>
            <span class="step-desc">فایل‌ها از پوشه worker/ پروژه کپی شوند</span>
          </div>
        </div>
        <div class="deploy-step">
          <span class="step-num">۳</span>
          <div class="step-content">
            <span class="step-title">دیپلوی با wrangler</span>
            <code class="step-code">wrangler deploy</code>
          </div>
        </div>
        <div class="deploy-step">
          <span class="step-num">۴</span>
          <div class="step-content">
            <span class="step-title">کپی آدرس ورکر و وارد کردن در تنظیمات بالا</span>
            <span class="step-desc">آدرس https://your-worker.workers.dev</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { workerUrl, saveWorkerUrl } from '../../stores/workerConfig';
import { db } from '../../utils/db';

const workerUrlInput = ref('');
const testing = ref(false);
const testStatus = ref(null);

onMounted(() => { workerUrlInput.value = workerUrl.value; });

const save = () => {
  saveWorkerUrl(workerUrlInput.value);
  alert('آدرس ورکر ذخیره شد.');
};

const downloadBackup = () => {
  const jsonStr = db.exportAllBackup();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `misub_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleImportBackup = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const success = db.importAllBackup(e.target?.result);
    if (success) { alert('بازیابی شد.'); window.location.reload(); }
    else alert('خطا در خواندن فایل.');
  };
  reader.readAsText(file);
};

const resetDatabase = () => {
  if (confirm('ریست کامل حافظه؟')) {
    db.clearAll();
    window.location.reload();
  }
};

const testConnection = async () => {
  if (!workerUrlInput.value.trim()) {
    testStatus.value = { success: false, message: 'آدرس Worker را وارد کنید.' };
    return;
  }
  testing.value = true;
  testStatus.value = null;
  try {
    const res = await fetch(`${workerUrlInput.value.trim().replace(/\/$/, '')}/api/ping`);
    const data = await res.json();
    testStatus.value = data.success
      ? { success: true, message: '✅ ارتباط با Worker v5.0.0 برقرار!' }
      : { success: false, message: 'پاسخ نامعتبر.' };
  } catch (err) {
    testStatus.value = { success: false, message: `❌ ${err.message}` };
  } finally {
    testing.value = false;
  }
};

const workerScriptCode = ref(`/**
 * MiSub & CF-Optimizer — Real Edge Backend (v5.0.0)
 * ----------------------------------------------------------------
 * Every endpoint below performs a genuine network operation at the
 * Cloudflare edge — there is no simulated/random data anywhere in
 * this file. Two real techniques power the scanner:
 *
 * 1) Raw TCP handshake probing via the native cloudflare:sockets
 *    API (connect()). This opens a real TCP socket to the target
 *    IP:port and measures the actual handshake time — works for any
 *    reachable host/port, not just HTTP(S).
 *
 * 2) fetch() with cf.resolveOverride — this forces Cloudflare's
 *    edge to open the TLS connection to a specific candidate IP
 *    while still sending the correct SNI/Host (speed.cloudflare.com).
 *    Because the TLS handshake completes against a real Cloudflare
 *    certificate, a successful response cryptographically proves the
 *    candidate IP is a live, genuine Cloudflare edge node — and the
 *    response body (cdn-cgi/trace) reveals its real colo (datacenter)
 *    code, so the "clean IP" list carries real geo/PoP data instead
 *    of guesses.
 *
 * The /api/scan/batch endpoint runs many of these probes in
 * parallel (bounded concurrency) directly at the edge, which is the
 * "PBP" (Parallel Batch Probe) scanning core the app relies on.
 */

import { connect } from 'cloudflare:sockets';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, X-Requested-With, Cache-Control, Accept',
  'Access-Control-Expose-Headers': 'Subscription-Userinfo, Content-Disposition, Content-Length',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' };

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

const CLOUDFLARE_IPV4_CIDRS = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
];

const COLO_CITY_MAP = {
  FRA: 'Frankfurt, DE', DUS: 'Dusseldorf, DE', MUC: 'Munich, DE', BER: 'Berlin, DE',
  LHR: 'London, UK', MAN: 'Manchester, UK', AMS: 'Amsterdam, NL', VIE: 'Vienna, AT',
  MXP: 'Milan, IT', FCO: 'Rome, IT', CDG: 'Paris, FR', MRS: 'Marseille, FR',
  MAD: 'Madrid, ES', BCN: 'Barcelona, ES', LIS: 'Lisbon, PT', WAW: 'Warsaw, PL',
  PRG: 'Prague, CZ', BUD: 'Budapest, HU', OTP: 'Bucharest, RO', SOF: 'Sofia, BG',
  ATH: 'Athens, GR', IST: 'Istanbul, TR', ESB: 'Ankara, TR', DXB: 'Dubai, AE',
  AUH: 'Abu Dhabi, AE', DOH: 'Doha, QA', BAH: 'Manama, BH', KWI: 'Kuwait City, KW',
  RUH: 'Riyadh, SA', JED: 'Jeddah, SA', TLV: 'Tel Aviv, IL', AMM: 'Amman, JO',
  FRU: 'Bishkek, KG', TAS: 'Tashkent, UZ', ALA: 'Almaty, KZ', TBS: 'Tbilisi, GE',
  EVN: 'Yerevan, AM', BAK: 'Baku, AZ', DME: 'Moscow, RU', LED: 'St. Petersburg, RU',
  HEL: 'Helsinki, FI', ARN: 'Stockholm, SE', OSL: 'Oslo, NO', CPH: 'Copenhagen, DK',
  DUB: 'Dublin, IE', BRU: 'Brussels, BE', ZRH: 'Zurich, CH', LUX: 'Luxembourg',
  SIN: 'Singapore', HKG: 'Hong Kong', NRT: 'Tokyo, JP', KIX: 'Osaka, JP',
  ICN: 'Seoul, KR', TPE: 'Taipei, TW', KUL: 'Kuala Lumpur, MY', BKK: 'Bangkok, TH',
  CGK: 'Jakarta, ID', MNL: 'Manila, PH', DEL: 'New Delhi, IN', BOM: 'Mumbai, IN',
  MAA: 'Chennai, IN', BLR: 'Bengaluru, IN', KHI: 'Karachi, PK', DAC: 'Dhaka, BD',
  LAX: 'Los Angeles, US', SJC: 'San Jose, US', SEA: 'Seattle, US', IAD: 'Ashburn, US',
  ORD: 'Chicago, US', EWR: 'Newark, US', ATL: 'Atlanta, US', DFW: 'Dallas, US',
  MIA: 'Miami, US', DEN: 'Denver, US', YYZ: 'Toronto, CA', YVR: 'Vancouver, CA',
  GRU: 'Sao Paulo, BR', GIG: 'Rio de Janeiro, BR', EZE: 'Buenos Aires, AR',
  SCL: 'Santiago, CL', BOG: 'Bogota, CO', MEX: 'Mexico City, MX', JNB: 'Johannesburg, ZA',
  CAI: 'Cairo, EG', LOS: 'Lagos, NG', NBO: 'Nairobi, KE', SYD: 'Sydney, AU',
  MEL: 'Melbourne, AU', AKL: 'Auckland, NZ'
};

function parseCidr(cidr) {
  const [base, maskStr] = cidr.split('/');
  const mask = parseInt(maskStr, 10);
  const octets = base.split('.').map(Number);
  const baseInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  return { baseInt, mask };
}

function ipInCidr(ipInt, cidr) {
  const { baseInt, mask } = parseCidr(cidr);
  const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  return (ipInt & maskBits) === (baseInt & maskBits);
}

function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isRealCloudflareIp(ip) {
  const ipInt = ipToInt(ip);
  if (ipInt === null) return false;
  return CLOUDFLARE_IPV4_CIDRS.some(c => ipInCidr(ipInt, c));
}

async function runWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function spawn() {
    while (idx < items.length) {
      const current = idx++;
      try {
        results[current] = await fn(items[current], current);
      } catch (e) {
        results[current] = { error: e.message };
      }
    }
  }
  const pool = Array.from({ length: Math.min(limit, items.length) }, () => spawn());
  await Promise.all(pool);
  return results;
}

async function tcpProbe(ip, port = 443, timeoutMs = 3000) {
  const start = Date.now();
  let socket;
  try {
    socket = connect({ hostname: ip, port: Number(port) });
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });
    await Promise.race([socket.opened, timeout]);
    const latency = Date.now() - start;
    socket.close().catch(() => {});
    return { ip, port: Number(port), latency, status: 'ok', method: 'tcp' };
  } catch (e) {
    if (socket) { try { socket.close().catch(() => {}); } catch {} }
    return { ip, port: Number(port), latency: null, status: 'error', method: 'tcp', error: e.message };
  }
}

async function coloProbe(ip, timeoutMs = 4000) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch('https://speed.cloudflare.com/cdn-cgi/trace', {
      cf: { resolveOverride: ip, cacheTtl: 0 },
      signal: controller.signal
    });
    clearTimeout(tid);
    const latency = Date.now() - start;
    if (!res.ok) return { ip, status: 'error', latency: null, error: 'HTTP ' + res.status };

    const cfRay = res.headers.get('cf-ray') || '';
    const isCloudflareServer = (res.headers.get('server') || '').toLowerCase() === 'cloudflare';
    const rayColoMatch = cfRay.match(/[A-Z]{3}$/);
    const rayColo = (isCloudflareServer && rayColoMatch) ? rayColoMatch[0] : null;

    const text = await res.text();
    const data = {};
    text.split('\\n').forEach(line => {
      const eq = line.indexOf('=');
      if (eq > -1) data[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    });

    const traceColo = data.colo || null;
    const finalColo = traceColo || rayColo || null;

    return {
      ip,
      status: 'ok',
      latency,
      colo: finalColo,
      city: COLO_CITY_MAP[finalColo] || null,
      warp: data.warp || 'off',
      httpProtocol: data.http || null,
      tls: data.tls || null,
      edgeVerifiedIp: data.ip || null,
      crossVerified: !!(traceColo && rayColo && traceColo === rayColo)
    };
  } catch (e) {
    return { ip, status: 'error', latency: null, colo: null, error: e.message };
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (pathname === '/' || pathname === '/api') {
        return jsonResponse({
          status: 'online',
          service: 'MiSub & CF-Optimizer Real Edge Backend',
          version: '5.0.0',
          engines: ['tcp-socket-probe', 'resolveOverride-colo-probe', 'parallel-batch-scanner', 'streaming-speedtest-proxy']
        });
      }

      // 1. Fetch Subscription without CORS
      if (pathname === '/api/proxy-fetch' || pathname === '/api/fetch-sub') {
        let targetUrl = url.searchParams.get('url');
        let customUa = url.searchParams.get('ua') || request.headers.get('User-Agent') || 'v2rayNG/1.8.12 (MiSub Engine)';
        if (!targetUrl && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          targetUrl = body.url;
          if (body.userAgent) customUa = body.userAgent;
        }
        if (!targetUrl) return jsonResponse({ success: false, error: 'url is required' }, 400);
        const subRes = await fetch(targetUrl, { headers: { 'User-Agent': customUa, 'Accept': '*/*' } });
        const rawData = await subRes.text();
        const userinfo = subRes.headers.get('Subscription-Userinfo') || '';
        if (request.method === 'GET' && !url.searchParams.get('json')) {
          return new Response(rawData, {
            status: subRes.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Subscription-Userinfo': userinfo }
          });
        }
        return jsonResponse({ success: true, userinfo, data: rawData });
      }

      // 2. Real single-IP probe: TCP handshake or full colo verification
      if (pathname === '/api/probe') {
        const ip = url.searchParams.get('ip') || url.searchParams.get('host');
        const port = url.searchParams.get('port') || '443';
        const withColo = url.searchParams.get('colo') === '1';
        if (!ip) return jsonResponse({ error: 'ip is required' }, 400);
        const tcp = await tcpProbe(ip, port, 3500);
        if (!withColo) return jsonResponse({ success: tcp.status === 'ok', ...tcp });
        const colo = await coloProbe(ip, 4000);
        return jsonResponse({
          success: tcp.status === 'ok' || colo.status === 'ok',
          ip, port: Number(port), latency: tcp.latency, status: tcp.status,
          colo: colo.colo, city: colo.city, warp: colo.warp,
          httpLatency: colo.latency, crossVerified: !!colo.crossVerified
        });
      }

      // 3. Real TCP port sweep
      if (pathname === '/api/probe/ports') {
        const ip = url.searchParams.get('ip');
        const portsParam = url.searchParams.get('ports') || '443,8443,2053,2083,2087,2096,80,8080,8880,2052,2082,2086,2095';
        const ports = [...new Set(portsParam.split(',').map(p => parseInt(p.trim(), 10)).filter(p => p > 0 && p < 65536))].slice(0, 16);
        if (!ip) return jsonResponse({ error: 'ip is required' }, 400);
        if (!ports.length) return jsonResponse({ error: 'no valid ports supplied' }, 400);
        const results = await runWithConcurrency(ports, 8, (port) => tcpProbe(ip, port, 3000));
        const healthy = results.filter(r => r.status === 'ok').sort((a, b) => a.latency - b.latency);
        return jsonResponse({ success: true, ip, results, best: healthy[0] || null });
      }

      // 4. Real parallel batch scanner (PBP)
      if (pathname === '/api/scan/batch' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const ips = Array.isArray(body.ips) ? body.ips.filter(ip => typeof ip === 'string').slice(0, 500) : [];
        const port = parseInt(body.port, 10) || 443;
        const mode = ['tcp', 'colo', 'both'].includes(body.mode) ? body.mode : 'tcp';
        const concurrency = Math.min(Math.max(parseInt(body.concurrency, 10) || 30, 1), 60);
        if (!ips.length) return jsonResponse({ success: false, error: 'ips[] is required' }, 400);
        const results = await runWithConcurrency(ips, concurrency, async (ip) => {
          if (mode === 'tcp') return tcpProbe(ip, port, 3000);
          if (mode === 'colo') return coloProbe(ip, 4000);
          const [tcp, colo] = await Promise.all([tcpProbe(ip, port, 3000), coloProbe(ip, 4000)]);
          return {
            ip, port: Number(port), latency: tcp.latency,
            status: tcp.status === 'ok' ? 'ok' : (colo.status === 'ok' ? 'ok' : 'error'),
            colo: colo.colo, city: colo.city, warp: colo.warp,
            httpLatency: colo.latency, verified: colo.status === 'ok',
            crossVerified: !!colo.crossVerified
          };
        });
        const healthy = results.filter(r => r.status === 'ok').length;
        return jsonResponse({ success: true, count: results.length, healthy, mode, results });
      }

      // 5. Real streaming speed-test proxy
      if (pathname === '/api/speedtest-proxy' || pathname === '/api/speedtest') {
        const ip = url.searchParams.get('ip');
        const bytes = Math.min(Math.max(parseInt(url.searchParams.get('bytes'), 10) || 10000000, 100000), 50000000);
        if (!ip) return jsonResponse({ error: 'ip is required' }, 400);
        const upstream = await fetch('https://speed.cloudflare.com/__down?bytes=' + bytes, {
          cf: { resolveOverride: ip, cacheTtl: 0 }
        });
        if (!upstream.ok || !upstream.body) return jsonResponse({ success: false, error: 'upstream responded ' + upstream.status }, 502);
        return new Response(upstream.body, {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/octet-stream', 'X-Speedtest-Ip': ip, 'X-Speedtest-Bytes': String(bytes) }
        });
      }

      // 6. Cloudflare CIDR List
      if (pathname === '/api/ip/ranges') return jsonResponse({ success: true, cidrs: CLOUDFLARE_IPV4_CIDRS });

      // 7. Verify Cloudflare IP
      if (pathname === '/api/ip/verify') {
        const ip = url.searchParams.get('ip');
        if (!ip) return jsonResponse({ error: 'ip is required' }, 400);
        return jsonResponse({ success: true, ip, isCloudflareRange: isRealCloudflareIp(ip) });
      }

      // 8. DoH Gateway
      if (pathname === '/api/doh') {
        const domain = url.searchParams.get('name');
        const provider = url.searchParams.get('provider') || 'https://1.1.1.1/dns-query';
        if (!domain) return jsonResponse({ error: 'name required' }, 400);
        const dohRes = await fetch(provider + '?name=' + encodeURIComponent(domain) + '&type=A', { headers: { Accept: 'application/dns-json' } });
        return jsonResponse(await dohRes.json());
      }

      // 9. GeoIP Lookup
      if (pathname === '/api/geoip') {
        const ip = url.searchParams.get('ip') || '';
        const geoRes = await fetch('https://ipwho.is/' + ip);
        return jsonResponse(await geoRes.json());
      }

      // 9b. Bulk GeoIP lookup
      if (pathname === '/api/geoip/batch' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const ips = Array.isArray(body.ips) ? body.ips.filter(ip => typeof ip === 'string').slice(0, 100) : [];
        if (!ips.length) return jsonResponse({ success: false, error: 'ips[] is required' }, 400);
        const geoRes = await fetch('http://ip-api.com/batch?fields=status,message,country,countryCode,city,isp,query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ips)
        });
        if (!geoRes.ok) return jsonResponse({ success: false, error: 'ip-api.com responded ' + geoRes.status }, 502);
        return jsonResponse({ success: true, results: await geoRes.json() });
      }

      // 10. Direct Client Subscription Provider Endpoint (/sub)
      if (pathname === '/sub') {
        const targetUrl = url.searchParams.get('url');
        const cleanIp = url.searchParams.get('ip');
        const cleanPort = url.searchParams.get('port');
        const customSni = url.searchParams.get('sni');
        if (!targetUrl) {
          return new Response('Guide: /sub?url=<sub_url>&ip=<clean_ip>&port=<port>&sni=<domain>', {
            status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
        const subRes = await fetch(targetUrl, { headers: { 'User-Agent': request.headers.get('User-Agent') || 'v2rayNG/1.8.12' } });
        let rawData = await subRes.text();
        try { rawData = decodeURIComponent(escape(atob(rawData.trim()))); } catch {}
        const lines = rawData.split('\\n').map(l => l.trim()).filter(Boolean);
        const optimized = lines.map(line => {
          if (line.startsWith('vless://') || line.startsWith('trojan://')) {
            const parts = line.split('@');
            if (parts.length > 1) {
              const auth = parts[0];
              const [hostPort, queryStr = ''] = parts[1].split('?');
              const [host, port] = hostPort.split(':');
              const newHost = cleanIp || host;
              const newPort = cleanPort || port;
              const params = new URLSearchParams(queryStr);
              if (customSni) { params.set('sni', customSni); params.set('host', customSni); }
              return auth + '@' + newHost + ':' + newPort + '?' + params.toString();
            }
          }
          return line;
        });
        const outBase64 = btoa(unescape(encodeURIComponent(optimized.join('\\n'))));
        return new Response(outBase64, {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Subscription-Userinfo': subRes.headers.get('Subscription-Userinfo') || '' }
        });
      }

      // 11. Basic connectivity ping
      if (pathname === '/api/ping') return jsonResponse({ success: true, timestamp: Date.now() });

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }
};`);

const copyWorkerCode = async () => {
  await navigator.clipboard.writeText(workerScriptCode.value);
  alert('کد Worker v5.0.0 کپی شد!');
};

const downloadWorkerScript = () => {
  const blob = new Blob([workerScriptCode.value], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'worker.js';
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.settings-suite { display: flex; flex-direction: column; gap: 16px; }
.db-card { border-color: rgba(56, 189, 248, 0.20) !important; }
.db-header { display: flex; justify-content: space-between; align-items: center; }
.db-header h4 { color: var(--accent-cyan); font-size: 0.92rem; }
.db-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.import-label { cursor: pointer; }
.hint { font-size: 0.74rem; color: var(--text-muted); margin-top: 4px; display: block; }
.action-row { display: flex; gap: 10px; margin-top: 12px; }
.status-box {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
}
.status-box.ok {
  background: rgba(16, 185, 129, 0.10);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.status-box.err {
  background: rgba(239, 68, 68, 0.10);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

/* Features Card */
.features-card {
  padding: 18px;
}
.features-card h4 {
  color: var(--accent-cyan);
  font-size: 0.95rem;
  margin-bottom: 14px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
.feature-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: rgba(8, 14, 32, 0.40);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-sm);
}
.feature-icon { font-size: 1.1rem; }
.feature-name { font-size: 0.80rem; font-weight: 700; color: var(--text-primary); }
.feature-desc { font-size: 0.70rem; color: var(--text-secondary); }

/* Worker Code Card */
.worker-code-card { display: flex; flex-direction: column; gap: 10px; }
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.code-header h4 { font-size: 0.88rem; color: var(--text-primary); }
.code-actions { display: flex; gap: 6px; }
.code-box { font-size: 0.72rem; line-height: 1.5; color: #a5f3fc; }
.code-footer {
  font-size: 0.72rem;
  color: var(--text-muted);
  padding: 6px 0;
  border-top: 1px solid rgba(56, 189, 248, 0.06);
}

/* Deploy Card */
.deploy-card {
  padding: 18px;
}
.deploy-card h4 {
  color: var(--accent-cyan);
  font-size: 0.92rem;
  margin-bottom: 14px;
}
.deploy-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.deploy-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px;
  background: rgba(8, 14, 32, 0.35);
  border: 1px solid rgba(56, 189, 248, 0.06);
  border-radius: var(--radius-sm);
}
.step-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.25);
  border: 1px solid rgba(56, 189, 248, 0.30);
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-cyan);
  flex-shrink: 0;
}
.step-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.step-title {
  font-size: 0.80rem;
  font-weight: 600;
  color: var(--text-primary);
}
.step-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
}
.step-code {
  font-size: 0.74rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--accent-cyan);
  background: rgba(56, 189, 248, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
  direction: ltr;
  display: inline-block;
  margin-top: 2px;
}
</style>
