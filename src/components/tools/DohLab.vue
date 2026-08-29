<template>
  <div class="doh-card card">
    <div class="doh-header">
      <h4>🌐 آزمایشگاه DNS-over-HTTPS (DoH)</h4>
      <p class="desc">تفکیک نام دامنه از طریق سرورهای رمزنگاری‌شده</p>
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label>دامنه هدف:</label>
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
      {{ loading ? 'حل دامنه...' : '🔍 Resolve' }}
    </button>

    <div v-if="statusMsg" :class="['status-box', statusType]">{{ statusMsg }}</div>

    <div v-if="resolvedIps.length" class="resolved-results">
      <span class="label">آی‌پی‌های پاسخ:</span>
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
    statusMsg.value = ips.length > 0 ? `✅ ${ips.length} آی‌پی دریافت شد` : '⚠️ پاسخی دریافت نشد';
    statusType.value = ips.length > 0 ? 'ok' : 'err';
  } catch (err) {
    statusMsg.value = `❌ ${err.message}`;
    statusType.value = 'err';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.doh-card { padding: 16px; }
.doh-header h4 { color: var(--accent-cyan); font-size: 0.90rem; }
.desc { font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px; }
.status-box { margin-top: 10px; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.78rem; }
.status-box.ok { background: rgba(16, 185, 129, 0.10); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.20); }
.status-box.err { background: rgba(239, 68, 68, 0.10); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.20); }
.resolved-results { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.ip-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  background: rgba(8, 14, 32, 0.50);
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 0.74rem;
}
</style>
