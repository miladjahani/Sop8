import { ref, computed, watch, toRefs } from 'vue';
import { appState } from '../stores/appState';
import { parseMultipleNodes } from '../utils/protocols';
import { deduplicateNodes } from '../utils/operators/operatorChains';
import { fetchSubscriptionSmart } from '../utils/optimizer/araEngine';
import { getWorkerUrl } from '../utils/workerApi';

export function useSubscriptions() {
  const {
    subUrl,
    subRawInput: rawInput
  } = toRefs(appState);

  const loading = ref(false);
  const searchQuery = ref('');
  const selectedProto = ref('all');
  const parsedNodes = ref(parseMultipleNodes(rawInput.value));

  watch(rawInput, (val) => {
    parsedNodes.value = parseMultipleNodes(val);
  });

  const protoCounts = computed(() => {
    const map = {};
    parsedNodes.value.forEach(n => {
      map[n.protocol] = (map[n.protocol] || 0) + 1;
    });
    return map;
  });

  const filteredNodes = computed(() => {
    let list = parsedNodes.value;
    if (selectedProto.value !== 'all') {
      list = list.filter(n => n.protocol === selectedProto.value);
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter(n => 
        n.name.toLowerCase().includes(q) ||
        n.address.toLowerCase().includes(q) ||
        (n.sni && n.sni.toLowerCase().includes(q)) ||
        String(n.port).includes(q)
      );
    }
    return list;
  });

  const fetchStatus = ref('');

  /**
   * Real robust subscription fetch: your configured Cloudflare Worker
   * proxy is tried first (fastest, no third party), then a direct
   * fetch, then a chain of public CORS proxies — the exact same
   * fallback technique the reference cf-optimizor tool uses, so a
   * subscription that's filtered/blocked on your network still has a
   * real chance to load. Also auto-detects raw/base64/ZEUS(JSON)
   * subscription formats instead of assuming plain base64.
   */
  const fetchRemote = async (workerUrlOverride) => {
    if (!subUrl.value.trim()) return;
    loading.value = true;
    fetchStatus.value = '';
    try {
      const worker = workerUrlOverride || getWorkerUrl();
      const { lines, via } = await fetchSubscriptionSmart(subUrl.value.trim(), worker);
      rawInput.value = lines.join('\n');
      const viaLabel = via === 'worker' ? 'Cloudflare Worker شما'
        : via === 'direct' ? 'اتصال مستقیم'
        : `پراکسی عمومی (${via})`;
      fetchStatus.value = `✅ ${lines.length} کانفیگ دریافت شد — از طریق ${viaLabel}`;
    } catch (err) {
      fetchStatus.value = `❌ ${err.message}`;
      alert('خطا در دریافت سابسکریپشن: ' + err.message);
    } finally {
      loading.value = false;
    }
  };

  const removeDuplicates = () => {
    const deduped = deduplicateNodes(parsedNodes.value);
    parsedNodes.value = deduped;
    rawInput.value = deduped.map(n => n.raw).join('\n');
  };

  return {
    subUrl,
    rawInput,
    loading,
    fetchStatus,
    searchQuery,
    selectedProto,
    parsedNodes,
    protoCounts,
    filteredNodes,
    fetchRemote,
    removeDuplicates
  };
}
