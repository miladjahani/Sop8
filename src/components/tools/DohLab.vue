<template>
  <div class="doh-card card">
    <div class="doh-header">
      <h4>🌐 آزمایشگاه DNS-over-HTTPS (DoH Lab)</h4>
      <p class="desc">تست تفکیک نام دامنه از طریق سرورهای رمزنگاری‌شده DoH کلودفلر و گوگل</p>
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label>نام دامنه هدف:</label>
        <input v-model="domain" placeholder="speed.cloudflare.com" class="input-box font-mono" />
      </div>
      <div class="form-group">
        <label>ارائه‌دهنده DoH:</label>
        <select v-model="provider" class="input-box font-mono">
          <option value="https://cloudflare-dns.com/dns-query">Cloudflare (1.1.1.1)</option>
          <option value="https://dns.google/resolve">Google (8.8.8.8)</option>
          <option value="https://dns.quad9.net/dns-query">Quad9 (9.9.9.9)</option>
        </select>
      </div>
    </div>

    <button @click="resolve" :disabled="loading || !domain.trim()" class="btn primary small">
      <span v-if="loading" class="spinner"></span>
      {{ loading ? 'در حال حل دامنه...' : '🔍 حل نام دامنه (Resolve)' }}
    </button>

    <div v-if="statusMsg" :class="['status-box', statusType]">
      {{ statusMsg }}
    </div>

    <div v-if="resolvedIps.length" class="resolved-results">
      <span class="label">آی‌پی‌های پاسخ داده شده:</span>
      <div class="ip-chips">
        <span v-for="ip in resolvedIps" :key="ip" class="chip font-mono text-cyan">{{ ip }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { resolveDoH } from '../../utils/scanner/doh';

const domain = ref('speed.cloudflare.com');
const provider = ref('https://cloudflare-dns.com/dns-query');
const loading = ref(false);
const resolvedIps = ref([]);
const statusMsg = ref('');
const statusType = ref('ok');

const resolve = async () => {
  if (!domain.value.trim()) return;
  loading.value = true;
  statusMsg.value = '';
  resolvedIps.value = [];

  try {
    const ips = await resolveDoH(domain.value.trim(), provider.value);
    resolvedIps.value = ips;
    if (ips.length > 0) {
      statusMsg.value = `✅ تعداد ${ips.length} آی‌پی با موفقیت دریافت شد.`;
      statusType.value = 'ok';
    } else {
      statusMsg.value = '⚠️ پاسخی از سرور DoH دریافت نشد.';
      statusType.value = 'err';
    }
  } catch (err) {
    statusMsg.value = `❌ خطا: ${err.message}`;
    statusType.value = 'err';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.doh-card { padding: 14px; background: var(--bg-input); border: 1px solid var(--border-color); }
.doh-header h4 { color: var(--accent-cyan); font-size: 0.92rem; }
.desc { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.status-box { margin-top: 10px; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; }
.status-box.ok { background: #064e3b; color: #34d399; }
.status-box.err { background: #7f1d1d; color: #fca5a5; }
.resolved-results { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.ip-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; font-size: 0.76rem; }
</style>
