import { ref } from 'vue';

export const workerUrl = ref(localStorage.getItem('cf_hub_worker_url') || '');

export function saveWorkerUrl(url) {
  workerUrl.value = (url || '').trim().replace(/\/$/, '');
  localStorage.setItem('cf_hub_worker_url', workerUrl.value);
}
