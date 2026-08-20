import { computed, toRefs } from 'vue';
import { appState } from '../stores/appState';
import { testIpMultiRound, scanBatchViaWorker } from '../utils/scanner/scannerEngine';
import { testDownloadSpeed } from '../utils/scanner/speedtest';
import { getWorkerUrl } from '../utils/workerApi';

export function useScanner() {
  const {
    scannerIpsInput: rawIpsInput,
    scannerResults: results,
    concurrency,
    timeoutMs,
    isScanning,
    shouldStopScanning,
    scanProgress
  } = toRefs(appState);

  const onlyHealthy = computed({
    get: () => true,
    set: () => {}
  });

  const healthyCount = computed(() => results.value.filter(r => r && r.status === 'ok').length);
  const failedCount = computed(() => results.value.filter(r => r && r.status === 'error').length);

  const displayResults = computed(() => {
    let list = [...results.value].filter(Boolean);
    return list.sort((a, b) => {
      if (a.latency === null && b.latency === null) return 0;
      if (a.latency === null) return 1;
      if (b.latency === null) return -1;
      return a.latency - b.latency;
    });
  });

  const startScan = async () => {
    const ips = rawIpsInput.value.split('\n').map(i => i.trim()).filter(Boolean);
    if (!ips.length || isScanning.value) return;

    isScanning.value = true;
    shouldStopScanning.value = false;
    results.value = ips.map(ip => ({ ip, latency: null, jitter: 0, status: 'testing' }));
    scanProgress.value = { current: 0, total: ips.length };

    const worker = getWorkerUrl();

    if (worker) {
      // Real edge batch scan: TCP-socket handshake + colo/geo verification,
      // run in parallel at the Cloudflare edge in chunks (keeps the progress
      // bar and live console updating as each chunk completes).
      const CHUNK_SIZE = 40;
      for (let i = 0; i < ips.length; i += CHUNK_SIZE) {
        if (shouldStopScanning.value) break;
        const chunk = ips.slice(i, i + CHUNK_SIZE);
        try {
          const chunkResults = await scanBatchViaWorker(chunk, {
            port: 443,
            mode: 'both',
            concurrency: Math.min(concurrency.value * 3, 40),
            timeoutMs: timeoutMs.value * 6
          });
          chunkResults.forEach((r, j) => { results.value[i + j] = r; });
        } catch (e) {
          // Honest failure: mark this chunk as errored rather than faking data,
          // and fall back to the local client-side probe for these IPs.
          for (let j = 0; j < chunk.length; j++) {
            if (shouldStopScanning.value) break;
            results.value[i + j] = await testIpMultiRound(chunk[j], 2, timeoutMs.value);
          }
        }
        scanProgress.value.current = Math.min(i + CHUNK_SIZE, ips.length);
      }
    } else {
      // No worker configured: real local client-side probing only.
      const threadCount = concurrency.value;
      let idx = 0;

      async function localWorker() {
        while (idx < ips.length) {
          if (shouldStopScanning.value) break;
          const targetIdx = idx++;
          const ip = ips[targetIdx];
          const res = await testIpMultiRound(ip, 2, timeoutMs.value);
          results.value[targetIdx] = res;
          scanProgress.value.current++;
        }
      }

      const pool = Array.from({ length: Math.min(threadCount, ips.length) }, () => localWorker());
      await Promise.all(pool);
    }

    isScanning.value = false;
  };

  const stopScan = () => {
    shouldStopScanning.value = true;
    isScanning.value = false;
  };

  const runSpeed = async (item) => {
    item.speedTesting = true;
    const res = await testDownloadSpeed(item.ip, 5000000, 8000);
    item.speedMbps = res.speedMbps;
    item.speedTesting = false;
  };

  return {
    rawIpsInput,
    concurrency,
    timeoutMs,
    isScanning,
    results,
    scanProgress,
    onlyHealthy,
    healthyCount,
    failedCount,
    displayResults,
    startScan,
    stopScan,
    runSpeed
  };
}
