<template>
  <div class="misub-hub-suite">
    <div class="card-header">
      <h3>📋 مرکز مدیریت سابسکریپشن MiSub</h3>
      <p class="desc">پشتیبانی از تمام فرمت‌های لینک ساب، رمزگشایی انواع پروتکل‌ها، فیلتر و تست پینگ زنده</p>
    </div>

    <!-- Fetch / Paste -->
    <div class="card">
      <div class="form-group">
        <label>آدرس سابسکریپشن ریموت:</label>
        <div class="input-with-btn">
          <input v-model="subUrl" placeholder="https://example.com/sub/token..." class="input-box font-mono" />
          <button @click="handleFetch" :disabled="loading" class="btn primary">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'دریافت...' : '📥 دریافت' }}
          </button>
        </div>
        <p v-if="fetchStatus" class="fetch-status" :class="fetchStatus.startsWith('❌') ? 'text-red' : 'text-green'">{{ fetchStatus }}</p>
      </div>

      <div class="form-group">
        <label>یا وارد کردن مستقیم کانفیگ‌ها:</label>
        <textarea 
          v-model="rawInput" 
          rows="4" 
          class="textarea-box font-mono" 
          placeholder="vless://...&#10;vmess://...&#10;trojan://...&#10;ss://..."
        ></textarea>
      </div>
    </div>

    <!-- Toolbar -->
    <div v-if="parsedNodes.length" class="card toolbar-box">
      <div class="search-filter-row">
        <input v-model="searchQuery" placeholder="جستجو در نام، آدرس، پورت..." class="input-box search-input" />
        <div class="tools-btn-group">
          <button @click="testAllPings" :disabled="testingPings" class="btn small primary">
            <span v-if="testingPings" class="spinner"></span>
            {{ testingPings ? 'تست...' : '📡 تست پینگ' }}
          </button>
          <button @click="removeDuplicates" class="btn small secondary">حذف تکراری</button>
          <button @click="showDoctor = !showDoctor" class="btn small secondary">
            {{ showDoctor ? 'بستن' : '🩺 دکتر نود' }}
          </button>
          <button @click="showConverter = !showConverter" class="btn small secondary">
            {{ showConverter ? 'بستن' : '🔗 مبدل کلاینت' }}
          </button>
          <button @click="sendAllToOptimizer" class="btn small success">⚡ انتقال به بهینه‌ساز</button>
        </div>
      </div>

      <div class="protocol-chips">
        <button :class="['chip', { active: selectedProto === 'all' }]" @click="selectedProto = 'all'">
          همه ({{ parsedNodes.length }})
        </button>
        <button 
          v-for="(count, proto) in protoCounts" :key="proto"
          :class="['chip', { active: selectedProto === proto }]"
          @click="selectedProto = proto"
        >
          <span :class="['badge', proto]">{{ proto.toUpperCase() }}</span>
          <span>({{ count }})</span>
        </button>
      </div>
    </div>

    <!-- Live Logs -->
    <div v-if="nodeLogs.length" class="terminal-log-box card">
      <div class="terminal-header">
        <span class="terminal-title">📟 لاگ زنده تست پینگ</span>
        <button @click="nodeLogs = []" class="btn small secondary">پاکسازی</button>
      </div>
      <div class="terminal-logs font-mono">
        <div v-for="(log, idx) in nodeLogs.slice(-25)" :key="idx" :class="['log-line', log.type]">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- Operator Chain -->
    <OperatorChain v-if="parsedNodes.length" :nodes="filteredNodes" @update:nodes="onNodesUpdate" />

    <!-- Sub-panels -->
    <NodeDoctorPanel v-if="showDoctor && parsedNodes.length" :nodes="filteredNodes" />
    <ClientConverterWorkspace v-if="showConverter && parsedNodes.length" :nodes="filteredNodes" />

    <!-- Nodes Grid -->
    <div v-if="filteredNodes.length" class="nodes-grid">
      <div v-for="node in filteredNodes" :key="node.id" class="node-item">
        <div class="node-header">
          <span :class="['badge', node.protocol]">{{ node.protocol.toUpperCase() }}</span>
          <span class="node-title" :title="node.name">{{ node.name }}</span>
          <span v-if="nodePings[node.id] !== undefined" :class="['ping-pill', getPingClass(nodePings[node.id])]">
            {{ nodePings[node.id] !== null ? nodePings[node.id] + ' ms' : 'Timeout' }}
          </span>
        </div>

        <div class="node-meta font-mono">
          <div><span class="meta-label">آدرس:</span> {{ node.address }}:{{ node.port }}</div>
          <div v-if="node.sni"><span class="meta-label">SNI:</span> {{ node.sni }}</div>
          <div><span class="meta-label">شبکه:</span> {{ node.type }} | {{ node.security }}</div>
        </div>

        <div class="node-actions">
          <button @click="testSingleNodePing(node)" class="btn-text">تست پینگ</button>
          <button @click="copyText(node.raw)" class="btn-text">کپی لینک</button>
          <button @click="$emit('select-node-to-optimize', node.raw)" class="btn-text highlight">بهینه‌سازی</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSubscriptions } from '../../composables/useSubscriptions';
import { pingNodeHost } from '../../utils/scanner/scannerEngine';
import NodeDoctorPanel from './NodeDoctorPanel.vue';
import ClientConverterWorkspace from './ClientConverterWorkspace.vue';
import OperatorChain from './OperatorChain.vue';

const emit = defineEmits(['send-to-optimizer', 'select-node-to-optimize']);

const {
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
} = useSubscriptions();

const showDoctor = ref(false);
const showConverter = ref(false);

const onNodesUpdate = (newNodes) => {
  // Emit optimized nodes back
  emit('send-to-optimizer', newNodes.map(n => n.raw).join('\n'));
};
const nodePings = ref({});
const testingPings = ref(false);
const nodeLogs = ref([]);

const nowStr = () => new Date().toTimeString().split(' ')[0];

const handleFetch = async () => {
  const worker = localStorage.getItem('cf_hub_worker_url') || '';
  nodeLogs.value.push({ time: nowStr(), message: 'در حال دریافت...', type: 'info' });
  await fetchRemote(worker);
  nodeLogs.value.push({ time: nowStr(), message: `دریافت شد — ${parsedNodes.value.length} نود`, type: 'success' });
};

const testSingleNodePing = async (node) => {
  nodePings.value[node.id] = null;
  const res = await pingNodeHost(node);
  nodePings.value[node.id] = res.latency;
  nodeLogs.value.push({
    time: nowStr(),
    message: res.status === 'ok' ? `✅ ${node.name}: ${res.latency}ms` : `❌ ${node.name}: Timeout`,
    type: res.status === 'ok' ? 'success' : 'error'
  });
};

const testAllPings = async () => {
  testingPings.value = true;
  for (const node of filteredNodes.value.slice(0, 30)) await testSingleNodePing(node);
  testingPings.value = false;
};

const getPingClass = (lat) => {
  if (lat === null) return 'text-red font-bold';
  if (lat < 140) return 'text-green font-bold';
  if (lat < 250) return 'text-yellow';
  return 'text-red';
};

const copyText = async (text) => { await navigator.clipboard.writeText(text); alert('کپی شد!'); };

const sendAllToOptimizer = () => {
  emit('send-to-optimizer', filteredNodes.value.map(n => n.raw).join('\n'));
};
</script>

<style scoped>
.misub-hub-suite { display: flex; flex-direction: column; gap: 16px; }
.input-with-btn { display: flex; gap: 8px; }
.fetch-status { font-size: 0.76rem; margin-top: 6px; }
.toolbar-box { display: flex; flex-direction: column; gap: 12px; }
.search-filter-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.search-input { max-width: 260px; }
.tools-btn-group { display: flex; flex-wrap: wrap; gap: 6px; }

.protocol-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.50);
  color: #b8c9e2;
  border: 1px solid rgba(56, 189, 248, 0.10);
  border-radius: var(--radius-sm);
  padding: 5px 10px;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.2s;
}
.chip.active {
  background: rgba(37, 99, 235, 0.30);
  color: #fff;
  border-color: rgba(56, 189, 248, 0.30);
}

.terminal-log-box { padding: 12px; }
.terminal-header { display: flex; justify-content: space-between; align-items: center; }
.terminal-title { font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan); }
.terminal-logs { font-size: 0.73rem; max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
.log-line { display: flex; gap: 8px; }
.log-time { color: var(--text-muted); }
.log-line.info .log-msg { color: #8da4c7; }
.log-line.success .log-msg { color: #34d399; font-weight: 700; }
.log-line.error .log-msg { color: #f87171; }

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.node-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 14px;
  background: rgba(14, 22, 46, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.10);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.node-item:hover {
  border-color: rgba(56, 189, 248, 0.25);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.06);
}
.node-header { display: flex; align-items: center; gap: 8px; }
.node-title {
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.ping-pill { font-size: 0.72rem; font-family: monospace; direction: ltr; }
.node-meta { font-size: 0.76rem; color: #8da4c7; display: flex; flex-direction: column; gap: 2px; }
.meta-label { color: #5a7094; }
.node-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  border-top: 1px solid rgba(56, 189, 248, 0.06);
  padding-top: 8px;
}
.btn-text {
  background: none;
  border: none;
  color: #8da4c7;
  font-size: 0.76rem;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-text:hover { color: var(--text-primary); }
.btn-text.highlight { color: var(--accent-cyan); font-weight: 700; }
</style>
