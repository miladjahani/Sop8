<template>
  <div class="converter-card card">
    <div class="converter-header">
      <h4>🔗 مبدل فرمت سابسکریپشن به کلاینت‌ها (Client SubConverter)</h4>
      <p class="desc">تبدیل مستقیم نودها به فرمت کلاینت‌های محبوب</p>
    </div>

    <div class="format-buttons">
      <button @click="convert('clash')" class="btn small secondary">Clash Meta (YAML)</button>
      <button @click="convert('singbox')" class="btn small secondary">Sing-box (JSON)</button>
      <button @click="convert('quantumultx')" class="btn small secondary">Quantumult X</button>
      <button @click="convert('surge')" class="btn small secondary">Surge</button>
      <button @click="convert('loon')" class="btn small secondary">Loon</button>
      <button @click="convert('base64')" class="btn small secondary">V2Ray (Base64)</button>
    </div>

    <div v-if="convertedText" class="converted-output">
      <div class="converted-top">
        <span class="badge ok">{{ currentFormat.toUpperCase() }}</span>
        <button @click="copyConverted" class="btn small primary">کپی در کلیپ‌بورد</button>
      </div>
      <textarea :value="convertedText" rows="6" readonly class="textarea-box font-mono"></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { convertNodesToClient } from '../../utils/converters';

const props = defineProps({
  nodes: Array
});

const convertedText = ref('');
const currentFormat = ref('clash');

const convert = (format) => {
  currentFormat.value = format;
  convertedText.value = convertNodesToClient(props.nodes, format);
};

const copyConverted = async () => {
  await navigator.clipboard.writeText(convertedText.value);
  alert('کانفیگ کلاینت کپی شد!');
};
</script>

<style scoped>
.converter-card {
  padding: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
}
.converter-header h4 { color: var(--accent-cyan); font-size: 0.92rem; }
.desc { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.format-buttons { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
.converted-output { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.converted-top { display: flex; justify-content: space-between; align-items: center; }
</style>
