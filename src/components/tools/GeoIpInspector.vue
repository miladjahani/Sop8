<template>
  <div class="geoip-card card">
    <div class="geoip-header">
      <h4>📍 تحلیل موقعیت و ASN آی‌پی (GeoIP Inspector)</h4>
      <p class="desc">بررسی کشور، شهر، سازمان و شماره سیستم خودمختار (ASN) آی‌پی‌های تست‌شده</p>
    </div>

    <div class="form-group">
      <label>آدرس IP هدف:</label>
      <div class="input-with-btn">
        <input v-model="targetIp" placeholder="104.16.1.1" class="input-box font-mono" />
        <button @click="inspect" :disabled="loading || !targetIp.trim()" class="btn primary small">
          {{ loading ? '...' : 'استعلام' }}
        </button>
      </div>
    </div>

    <div v-if="geoData" class="geo-details font-mono">
      <div><b>کشور:</b> {{ geoData.country || '-' }} ({{ geoData.country_code || '-' }})</div>
      <div><b>شهر / منطقه:</b> {{ geoData.city || '-' }} / {{ geoData.region || '-' }}</div>
      <div><b>سازمان / ISP:</b> {{ geoData.connection?.isp || geoData.org || '-' }}</div>
      <div><b>ASN:</b> {{ geoData.connection?.asn || '-' }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const targetIp = ref('104.16.1.1');
const loading = ref(false);
const geoData = ref(null);

const inspect = async () => {
  if (!targetIp.value.trim()) return;
  loading.value = true;
  try {
    const res = await fetch(`https://ipwho.is/${targetIp.value.trim()}`);
    geoData.value = await res.json();
  } catch (e) {
    alert('خطا در استعلام GeoIP: ' + e.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.geoip-card { padding: 14px; background: var(--bg-input); border: 1px solid var(--border-color); }
.geoip-header h4 { color: var(--accent-cyan); font-size: 0.92rem; }
.desc { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.input-with-btn { display: flex; gap: 8px; }
.geo-details {
  margin-top: 10px;
  background: #1e293b;
  border-radius: 6px;
  padding: 10px;
  font-size: 0.78rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
