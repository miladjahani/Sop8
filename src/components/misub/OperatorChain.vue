<template>
  <div class="operator-chain card">
    <div class="card-header">
      <h3>🔧 زنجیره عملگرها</h3>
      <p class="desc">فیلتر، مرتب‌سازی، حذف تکرار و تغییر نام نودها</p>
    </div>

    <!-- Add Operator Buttons -->
    <div class="add-operator-row">
      <button @click="addOperator('filter')" class="btn small secondary">+ فیلتر</button>
      <button @click="addOperator('sort')" class="btn small secondary">+ مرتب‌سازی</button>
      <button @click="addOperator('dedup')" class="btn small secondary">+ حذف تکرار</button>
      <button @click="addOperator('rename')" class="btn small secondary">+ تغییر نام</button>
    </div>

    <!-- Operators List -->
    <div v-if="operators.length" class="operators-list">
      <div v-for="(op, idx) in operators" :key="op.id" class="operator-item">
        <div class="operator-header" @click="toggleExpand(idx)">
          <div class="operator-info">
            <span class="operator-type-badge" :class="op.type">{{ opLabel(op.type) }}</span>
            <span class="operator-status">{{ op.enabled ? '✅' : '⏸️' }}</span>
            <span class="operator-index">#{{ idx + 1 }}</span>
          </div>
          <div class="operator-actions">
            <button @click.stop="toggleEnabled(idx)" class="btn-icon" :title="op.enabled ? 'غیرفعال' : 'فعال'">
              {{ op.enabled ? '⏸️' : '▶️' }}
            </button>
            <button @click.stop="moveOperator(idx, -1)" :disabled="idx === 0" class="btn-icon">⬆️</button>
            <button @click.stop="moveOperator(idx, 1)" :disabled="idx === operators.length - 1" class="btn-icon">⬇️</button>
            <button @click.stop="removeOperator(idx)" class="btn-icon danger">🗑️</button>
          </div>
        </div>

        <!-- Expanded Editor -->
        <div v-if="expandedIdx === idx" class="operator-editor">
          <!-- Filter Editor -->
          <template v-if="op.type === 'filter'">
            <div class="editor-section">
              <label>فیلتر شامل (Regex):</label>
              <textarea v-model="op.params.includeText" rows="2" class="textarea-box font-mono" placeholder="HK|SG|JP&#10; mỗi خط یک regex"></textarea>
            </div>
            <div class="editor-section">
              <label>فیلتر رد شود:</label>
              <textarea v-model="op.params.excludeText" rows="2" class="textarea-box font-mono" placeholder=" expired&#10;(هر خط یک regex)"></textarea>
            </div>
            <div class="editor-section">
              <label>پروتکل‌ها:</label>
              <div class="proto-chips">
                <button v-for="p in ['vless','vmess','trojan','ss','hysteria2']" :key="p"
                  :class="['chip', { active: op.params.protocols.includes(p) }]"
                  @click="toggleProtocol(op.params, p)">{{ p.toUpperCase() }}</button>
              </div>
            </div>
          </template>

          <!-- Sort Editor -->
          <template v-if="op.type === 'sort'">
            <div class="editor-section">
              <label>مرتب بر اساس:</label>
              <select v-model="op.params.sortKey" class="input-box">
                <option value="region">منطقه</option>
                <option value="protocol">پروتکل</option>
                <option value="name">نام</option>
                <option value="server">آدرس</option>
                <option value="port">پورت</option>
              </select>
            </div>
            <div class="editor-section">
              <label>ترتیب:</label>
              <select v-model="op.params.sortOrder" class="input-box">
                <option value="asc">صعودی ↑</option>
                <option value="desc">نزولی ↓</option>
              </select>
            </div>
          </template>

          <!-- Dedup Editor -->
          <template v-if="op.type === 'dedup'">
            <div class="editor-section">
              <label>حالت حذف تکرار:</label>
              <select v-model="op.params.dedupMode" class="input-box">
                <option value="serverPort">آدرس + پورت</option>
                <option value="name">نام</option>
              </select>
            </div>
          </template>

          <!-- Rename Editor -->
          <template v-if="op.type === 'rename'">
            <div class="editor-section">
              <label>قالب تغییر نام:</label>
              <input v-model="op.params.template" class="input-box font-mono" placeholder="{emoji}{region}-{protocol}-{index}" />
              <p class="help-text">متغیرها: {emoji} {region} {protocol} {index} {server} {port}</p>
            </div>
            <div class="editor-section">
              <label>شروع شماره‌گذاری:</label>
              <input v-model.number="op.params.offset" type="number" class="input-box" style="width: 80px" />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Apply Button -->
    <div v-if="operators.length" class="apply-row">
      <button @click="applyOperators" class="btn primary">✅ اعمال عملگرها</button>
      <button @click="clearOperators" class="btn secondary">پاکسازی همه</button>
      <span class="apply-info" v-if="lastResult">{{ lastResult }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const REGION_KEYWORDS = {
  '🇭🇰': ['HK', 'HKG', 'Hong Kong'], '🇹🇼': ['TW', 'TPE', 'Taiwan'], '🇸🇬': ['SG', 'SIN', 'Singapore'],
  '🇯🇵': ['JP', 'JPN', 'NRT', 'Japan', 'Tokyo'], '🇺🇸': ['US', 'USA', 'LAX', 'America'], '🇰🇷': ['KR', 'KOR', 'Seoul'],
  '🇬🇧': ['UK', 'GB', 'London'], '🇩🇪': ['DE', 'Germany'], '🇫🇷': ['FR', 'France'],
  '🇨🇦': ['CA', 'Canada'], '🇦🇺': ['AU', 'Australia'], '🇷🇺': ['RU', 'Russia'],
};
const REGION_MAP = { '🇭🇰': 'HK', '🇹🇼': 'TW', '🇸🇬': 'SG', '🇯🇵': 'JP', '🇺🇸': 'US', '🇰🇷': 'KR', '🇬🇧': 'UK', '🇩🇪': 'DE', '🇫🇷': 'FR', '🇨🇦': 'CA', '🇦🇺': 'AU', '🇷🇺': 'RU' };
function extractRegion(name) {
  if (!name) return { region: 'Unknown', emoji: '🌍' };
  for (const [emoji, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const kw of keywords) {
      if (name.toUpperCase().includes(kw)) return { region: REGION_MAP[emoji] || 'Unknown', emoji };
    }
  }
  return { region: 'Unknown', emoji: '🌍' };
}

const props = defineProps({
  nodes: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:nodes']);

const operators = ref([]);
const expandedIdx = ref(null);
const lastResult = ref('');

let nextId = 1;

const opLabel = (type) => ({
  filter: '🔍 فیلتر',
  sort: '📊 مرتب‌سازی',
  dedup: '🧹 حذف تکرار',
  rename: '✏️ تغییر نام'
}[type] || type);

const addOperator = (type) => {
  const defaults = {
    filter: { includeText: '', excludeText: '', protocols: [], regions: [] },
    sort: { sortKey: 'region', sortOrder: 'asc' },
    dedup: { dedupMode: 'serverPort' },
    rename: { template: '{emoji}{region}-{protocol}-{index}', offset: 1 }
  };
  operators.value.push({
    id: nextId++,
    type,
    enabled: true,
    params: { ...defaults[type] }
  });
  expandedIdx.value = operators.value.length - 1;
};

const toggleExpand = (idx) => {
  expandedIdx.value = expandedIdx.value === idx ? null : idx;
};

const toggleEnabled = (idx) => {
  operators.value[idx].enabled = !operators.value[idx].enabled;
};

const moveOperator = (idx, dir) => {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= operators.value.length) return;
  const temp = operators.value[idx];
  operators.value[idx] = operators.value[newIdx];
  operators.value[newIdx] = temp;
};

const removeOperator = (idx) => {
  operators.value.splice(idx, 1);
  if (expandedIdx.value === idx) expandedIdx.value = null;
};

const toggleProtocol = (params, proto) => {
  const idx = params.protocols.indexOf(proto);
  if (idx >= 0) params.protocols.splice(idx, 1);
  else params.protocols.push(proto);
};

const clearOperators = () => {
  operators.value = [];
  expandedIdx.value = null;
  lastResult.value = '';
};

const applyOperators = () => {
  let result = [...props.nodes];
  let counts = { before: result.length };

  for (const op of operators.value) {
    if (!op.enabled) continue;

    if (op.type === 'filter') {
      const include = op.params.includeText.split('\n').map(r => r.trim()).filter(Boolean);
      const exclude = op.params.excludeText.split('\n').map(r => r.trim()).filter(Boolean);
      const protos = op.params.protocols;

      if (include.length) {
        result = result.filter(n => include.some(r => {
          try { return new RegExp(r, 'i').test(n.name); }
          catch { return n.name.toLowerCase().includes(r.toLowerCase()); }
        }));
      }
      if (exclude.length) {
        result = result.filter(n => !exclude.some(r => {
          try { return new RegExp(r, 'i').test(n.name); }
          catch { return n.name.toLowerCase().includes(r.toLowerCase()); }
        }));
      }
      if (protos.length) {
        result = result.filter(n => protos.includes(n.protocol));
      }
    }

    if (op.type === 'sort') {
      const key = op.params.sortKey;
      const order = op.params.sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        let va, vb;
        if (key === 'region') {
          va = extractRegion(a.name).region;
          vb = extractRegion(b.name).region;
        } else if (key === 'protocol') {
          va = a.protocol; vb = b.protocol;
        } else if (key === 'name') {
          va = a.name; vb = b.name;
        } else if (key === 'server') {
          va = a.address; vb = b.address;
        } else if (key === 'port') {
          va = a.port; vb = b.port;
        }
        return va < vb ? -order : va > vb ? order : 0;
      });
    }

    if (op.type === 'dedup') {
      const seen = new Set();
      result = result.filter(n => {
        const key = op.params.dedupMode === 'name' ? n.name : `${n.address}:${n.port}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (op.type === 'rename') {
      let idx = op.params.offset || 1;
      result = result.map(n => {
        const { region, emoji } = extractRegion(n.name);
        const newName = (op.params.template || '{emoji}{region}-{protocol}-{index}')
          .replace('{emoji}', emoji)
          .replace('{region}', region)
          .replace('{protocol}', n.protocol)
          .replace('{index}', String(idx).padStart(2, '0'))
          .replace('{server}', n.address)
          .replace('{port}', String(n.port));
        idx++;
        return { ...n, name: newName };
      });
    }
  }

  counts.after = result.length;
  lastResult.value = `${counts.before} → ${counts.after} نود`;
  emit('update:nodes', result);
};
</script>

<style scoped>
.operator-chain { display: flex; flex-direction: column; gap: 12px; }
.add-operator-row { display: flex; flex-wrap: wrap; gap: 6px; }
.operators-list { display: flex; flex-direction: column; gap: 8px; }
.operator-item {
  background: rgba(14, 22, 46, 0.50);
  border: 1px solid rgba(56, 189, 248, 0.10);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.operator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.operator-header:hover { background: rgba(56, 189, 248, 0.05); }
.operator-info { display: flex; align-items: center; gap: 8px; }
.operator-type-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.operator-type-badge.filter { background: rgba(56, 189, 248, 0.15); color: var(--accent-cyan); }
.operator-type-badge.sort { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
.operator-type-badge.dedup { background: rgba(245, 158, 11, 0.15); color: var(--accent-yellow); }
.operator-type-badge.rename { background: rgba(139, 92, 246, 0.15); color: var(--accent-purple); }
.operator-status { font-size: 0.7rem; }
.operator-index { font-size: 0.7rem; color: var(--text-muted); }
.operator-actions { display: flex; gap: 4px; }
.btn-icon {
  background: none;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}
.btn-icon:hover { background: rgba(255,255,255,0.05); }
.btn-icon.danger:hover { background: rgba(239, 68, 68, 0.15); }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
.operator-editor {
  padding: 12px 14px;
  border-top: 1px solid rgba(56, 189, 248, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.editor-section { display: flex; flex-direction: column; gap: 5px; }
.editor-section label { font-size: 0.78rem; font-weight: 600; color: #b8c9e2; }
.help-text { font-size: 0.7rem; color: var(--text-muted); }
.proto-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.50);
  color: #b8c9e2;
  border: 1px solid rgba(56, 189, 248, 0.10);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 0.74rem;
  cursor: pointer;
  transition: all 0.2s;
}
.chip.active {
  background: rgba(37, 99, 235, 0.30);
  color: #fff;
  border-color: rgba(56, 189, 248, 0.30);
}
.apply-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.apply-info { font-size: 0.78rem; color: var(--accent-cyan); font-weight: 600; }
</style>
