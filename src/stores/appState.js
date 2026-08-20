import { reactive, watch } from 'vue';
import { db } from '../utils/db';

const VALID_TABS = ['optimizer', 'scanner', 'misub', 'tools', 'settings'];

function getInitialTab() {
  const saved = db.get('activeTab', 'optimizer');
  if (VALID_TABS.includes(saved)) return saved;
  return 'optimizer';
}

export const appState = reactive({
  activeTab: getInitialTab(),
  
  // Optimizer state
  cleanIp: db.get('cleanIp', '104.16.1.1'),
  cleanPort: db.get('cleanPort', '443'),
  customSni: db.get('customSni', 'speed.cloudflare.com'),
  prefix: db.get('prefix', '[CF-Clean]'),
  inputNodes: db.get('inputNodes', ''),
  fragmentEnabled: db.get('fragmentEnabled', false),
  fragmentConfig: db.get('fragmentConfig', { length: '10-50', interval: '10-20', packets: 'tlshello' }),
  // Real cf-optimizor engine settings (fingerprint / cipher suites / FinalMask fragment JSON)
  fpValue: db.get('fpValue', 'unsafe'),
  csValue: db.get('csValue', ''), // empty = use real default cipher suite list
  fmValue: db.get('fmValue', ''), // empty = use real default FinalMask JSON
  arasMode: false,
  activeNodes: [],
  optimizeErrors: [],
  optimizedPingResults: {},
  isTestingOptimizedPings: false,
  
  // Scanner state (Persistent across tabs and sessions)
  scannerIpsInput: db.get('scannerIpsInput', '104.16.1.1\n104.16.12.1\n172.64.80.1\n104.16.2.1\n172.67.1.1\n162.158.5.1\n198.41.129.1'),
  scannerResults: db.get('scannerResults', []),
  concurrency: db.get('concurrency', 8),
  timeoutMs: db.get('timeoutMs', 2500),
  isScanning: false,
  shouldStopScanning: false,
  scanProgress: { current: 0, total: 0 },
  
  // Subscription state
  subUrl: db.get('subUrl', ''),
  subRawInput: db.get('subRawInput', ''),
  subNodePings: {},
  isTestingSubPings: false,
  
  // Cross-tab transfer buffer
  transferredNodes: '',
  
  // Notifications
  notifications: []
});

// Auto-persist reactive state changes to database
watch(() => appState.activeTab, (val) => db.set('activeTab', val));
watch(() => appState.cleanIp, (val) => db.set('cleanIp', val));
watch(() => appState.cleanPort, (val) => db.set('cleanPort', val));
watch(() => appState.customSni, (val) => db.set('customSni', val));
watch(() => appState.prefix, (val) => db.set('prefix', val));
watch(() => appState.inputNodes, (val) => db.set('inputNodes', val));
watch(() => appState.fragmentEnabled, (val) => db.set('fragmentEnabled', val));
watch(() => appState.fragmentConfig, (val) => db.set('fragmentConfig', val), { deep: true });
watch(() => appState.fpValue, (val) => db.set('fpValue', val));
watch(() => appState.csValue, (val) => db.set('csValue', val));
watch(() => appState.fmValue, (val) => db.set('fmValue', val));
watch(() => appState.scannerIpsInput, (val) => db.set('scannerIpsInput', val));
watch(() => appState.scannerResults, (val) => db.set('scannerResults', val), { deep: true });
watch(() => appState.concurrency, (val) => db.set('concurrency', val));
watch(() => appState.timeoutMs, (val) => db.set('timeoutMs', val));
watch(() => appState.subUrl, (val) => db.set('subUrl', val));
watch(() => appState.subRawInput, (val) => db.set('subRawInput', val));

export function notify(message, type = 'info') {
  const id = Date.now();
  appState.notifications.push({ id, message, type });
  setTimeout(() => {
    appState.notifications = appState.notifications.filter(n => n.id !== id);
  }, 4000);
}
