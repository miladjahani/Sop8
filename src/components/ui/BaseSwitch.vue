<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md'].includes(v) }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOn = computed(() => props.modelValue);
const trackSize = computed(() => props.size === 'sm' ? 'w-9 h-5' : 'w-11 h-6');
const thumbSize = computed(() => props.size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5');

const toggle = () => {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
  emit('change', !props.modelValue);
};
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="isOn"
    :disabled="disabled"
    @click="toggle"
    class="relative inline-flex shrink-0 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/30 disabled:opacity-40"
    :class="[
      trackSize,
      isOn
        ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] shadow-[0_0_12px_rgba(56,189,248,0.3)]'
        : 'bg-white/10 border border-white/10'
    ]"
  >
    <span
      class="pointer-events-none inline-block rounded-full shadow-lg transform ring-0 transition-all duration-300"
      :class="[
        thumbSize,
        isOn
          ? 'translate-x-[calc(100%-2px)] bg-white'
          : 'translate-x-[2px] bg-white/60'
      ]"
      :style="{ marginTop: 'auto', marginBottom: 'auto', height: thumbSize.includes('3.5') ? '14px' : '18px', marginLeft: isOn ? 'auto' : '2px', marginRight: isOn ? '2px' : 'auto' }"
    />
  </button>
</template>
