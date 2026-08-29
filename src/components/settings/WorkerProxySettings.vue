<template>
  <div class="settings-suite">
    <div class="card-header">
      <h3>🛠️ دیتابیس و تنظیمات سرورلس</h3>
      <p class="desc">مدیریت حافظه محلی، بکاپ JSON، تنظیمات Cloudflare Worker</p>
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
        <span class="hint">کدهای Worker در کادر زیر قرار دارد.</span>
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

    <!-- Worker Script -->
    <div class="card worker-code-card">
      <div class="code-header">
        <h4>📄 اسکریپت آماده Worker</h4>
        <button @click="copyWorkerCode" class="btn small success">📋 کپی</button>
      </div>
      <textarea :value="workerScriptCode" rows="10" readonly class="textarea-box font-mono code-box"></textarea>
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
      ? { success: true, message: '✅ ارتباط با Worker برقرار!' }
      : { success: false, message: 'پاسخ نامعتبر.' };
  } catch (err) {
    testStatus.value = { success: false, message: `❌ ${err.message}` };
  } finally {
    testing.value = false;
  }
};

const workerScriptCode = ref(`/**
 * Cloudflare Worker Enterprise Backend & Universal CORS Proxy
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, X-Requested-With, Cache-Control, Accept',
  'Access-Control-Expose-Headers': 'Subscription-Userinfo, Content-Disposition, Content-Length',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const url = new URL(request.url);
    const pathname = url.pathname;
    try {
      if (pathname === '/' || pathname === '/api') {
        return new Response(JSON.stringify({ status: 'online', service: 'MiSub & CF Universal Proxy' }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      if (pathname === '/api/proxy-fetch' || pathname === '/api/fetch-sub') {
        let targetUrl = url.searchParams.get('url');
        let customUa = url.searchParams.get('ua') || request.headers.get('User-Agent') || 'v2rayNG/1.8.12';
        if (!targetUrl && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          targetUrl = body.url;
          if (body.userAgent) customUa = body.userAgent;
        }
        if (!targetUrl) {
          return new Response(JSON.stringify({ success: false, error: 'url required' }), {
            status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
        const subRes = await fetch(targetUrl, { headers: { 'User-Agent': customUa } });
        const rawData = await subRes.text();
        const userinfo = subRes.headers.get('Subscription-Userinfo') || '';
        if (request.method === 'GET') {
          return new Response(rawData, {
            status: subRes.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Subscription-Userinfo': userinfo }
          });
        }
        return new Response(JSON.stringify({ success: true, userinfo, data: rawData }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      if (pathname === '/api/ping') {
        return new Response(JSON.stringify({ success: true, timestamp: Date.now() }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: CORS_HEADERS });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
};`);

const copyWorkerCode = async () => {
  await navigator.clipboard.writeText(workerScriptCode.value);
  alert('کد Worker کپی شد!');
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
.worker-code-card { display: flex; flex-direction: column; gap: 10px; }
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.code-header h4 { font-size: 0.88rem; color: var(--text-primary); }
.code-box { font-size: 0.76rem; line-height: 1.5; color: #a5f3fc; }
</style>
