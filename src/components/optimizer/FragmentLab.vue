<template>
  <div class="fragment-lab">
    <div class="lab-header">
      <h4>🧪 آزمایشگاه FinalMask واقعی</h4>
      <p class="desc">JSON واقعی FinalMask برای کلاینت‌های v2rayNG/PattNG — <code>fm</code></p>
    </div>

    <div class="preset-row">
      <button
        v-for="preset in presets"
        :key="preset.key"
        @click="applyPreset(preset.key)"
        class="btn small"
        :class="activePreset === preset.key ? 'primary' : 'secondary'"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="form-group">
      <label>JSON خام FinalMask:</label>
      <textarea
        :value="fm"
        @input="handleInput($event.target.value)"
        rows="4"
        class="textarea-box font-mono fm-editor"
        spellcheck="false"
      ></textarea>
      <p class="validity" :class="isValid ? 'text-green' : 'text-red'">
        {{ isValid ? '✓ JSON معتبر' : '✗ JSON نامعتبر' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FM_STR, ARAS_FM } from '../../utils/optimizer/araEngine';

const props = defineProps({
  fm: { type: String, default: '' }
});
const emit = defineEmits(['update:fm']);

const presets = [
  { key: 'default', label: 'پیش‌فرض (دو مرحله‌ای)', value: FM_STR },
  { key: 'aras', label: 'Aras (سبک)', value: ARAS_FM },
  {
    key: 'aggressive',
    label: 'تهاجمی',
    value: '{"tcp":[{"type":"fragment","settings":{"packets":"tlshello","lengths":["1-1"],"delays":["0"],"maxSplit":"0"}},{"type":"fragment","settings":{"packets":"1-3","lengths":["1-1"],"delays":["1"],"maxSplit":"500"}}]}'
  }
];

const activePreset = ref('default');

const isValid = computed(() => {
  const v = (props.fm || '').trim();
  if (!v) return true;
  try { JSON.parse(v); return true; } catch { return false; }
});

function applyPreset(key) {
  const preset = presets.find(p => p.key === key);
  if (!preset) return;
  activePreset.value = key;
  emit('update:fm', preset.value);
}

function handleInput(val) {
  activePreset.value = 'custom';
  emit('update:fm', val);
}
</script>

<style scoped>
.fragment-lab {
  background: rgba(8, 14, 32, 0.45);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-top: 8px;
}
.lab-header { margin-bottom: 10px; }
.lab-header h4 { color: var(--accent-cyan); font-size: 0.90rem; }
.desc { font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px; }
.desc code { color: var(--accent-lime); }
.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.fm-editor { font-size: 0.72rem; direction: ltr; text-align: left; }
.validity { font-size: 0.74rem; margin-top: 4px; }
</style>
