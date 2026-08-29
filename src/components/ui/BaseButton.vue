<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost', 'outline', 'success'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  icon: { type: String, default: null },
  iconOnly: { type: Boolean, default: false },
  type: { type: String, default: 'button' }
});

const emit = defineEmits(['click']);

const variantClasses = computed(() => ({
  primary: 'btn primary',
  secondary: 'btn secondary',
  danger: 'btn danger',
  success: 'btn success',
  ghost: 'bg-transparent hover:bg-white/5 text-[var(--text-secondary)] border border-transparent',
  outline: 'bg-transparent hover:bg-[var(--accent-cyan)]/5 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30'
}[props.variant]));

const sizeClasses = computed(() => {
  if (props.iconOnly) {
    return { sm: 'p-1.5', md: 'p-2', lg: 'p-3' }[props.size];
  }
  return { sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-4 py-2 text-sm gap-2', lg: 'px-6 py-2.5 text-base gap-2' }[props.size];
});

const handleClick = (e) => {
  if (!props.disabled && !props.loading) emit('click', e);
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    @click="handleClick"
    class="relative inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold tap-effect disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/30"
    :class="[variantClasses, sizeClasses]"
  >
    <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <svg v-else-if="icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="icon" />
    </svg>
    <span v-if="!iconOnly"><slot /></span>
  </button>
</template>
