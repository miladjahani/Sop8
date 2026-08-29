import { defineStore } from 'pinia';
import { ref } from 'vue';

const TOAST_DURATION = { success: 3500, error: 5000, warning: 4000, info: 3000 };
const MAX_VISIBLE = 5;

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);
  const queue = ref([]);

  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id);
    flush();
  }

  function flush() {
    while (toasts.value.length < MAX_VISIBLE && queue.value.length > 0) {
      const next = queue.value.shift();
      toasts.value.push(next);
      setTimeout(() => removeToast(next.id), next.duration);
    }
  }

  function showToast(message, type = 'info', duration) {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const toast = { id, message, type, duration: duration || TOAST_DURATION[type] || 3000 };
    if (toasts.value.length < MAX_VISIBLE) {
      toasts.value.push(toast);
      setTimeout(() => removeToast(id), toast.duration);
    } else {
      queue.value.push(toast);
    }
  }

  const success = (msg, dur) => showToast(msg, 'success', dur);
  const error = (msg, dur) => showToast(msg, 'error', dur);
  const warning = (msg, dur) => showToast(msg, 'warning', dur);
  const info = (msg, dur) => showToast(msg, 'info', dur);

  return { toasts, removeToast, showToast, success, error, warning, info };
});
