<template>
  <div class="geoip-card card">
    <div class="geoip-header">
      <h4>📍 تحلیل موقعیت و ASN آی‌پی (GeoIP Inspector)</h4>
      <p class="desc">بررسی کشور، شهر، سازمان و ASN آی‌پی‌های تست‌شده</p>
    </div>

    <div class="form-group">
      <label>آدرس IP هدف:</label>
      <div class="input-with-btn">
        <input v-model="targetIp" placeholder="104.16.1.1" class="input-box font-mono" />
        <button @click="inspect" :disabled="loading || !targetIp.trim()" class="btn primary small">
          {{ loading ? '...' : '🔍 استعلام' }}
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
.geoip-card { padding: 16px; }
.geoip-header h4 { color: var(--accent-cyan); font-size: 0.90rem; }
.desc { font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px; }
.input-with-btn { display: flex; gap: 8px; }
.geo-details {
  margin-top: 12px;
  background: rgba(8, 14, 32, 0.50);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  padding: 12px;
  font-size: 0.78rem;
  color: #b8c9e2;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.geo-details b { color: var(--text-primary); }
</style>
