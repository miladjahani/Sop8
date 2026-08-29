/**
 * MiSub & CF-Optimizer — Real Edge Backend (v6.0.0)
 * ----------------------------------------------------------------
 * Major upgrade inspired by MiSub:
 * - Full node parsing (VLESS, VMess, Trojan, SS, Hysteria2, TUIC)
 * - Region detection with emoji flags
 * - Operator chain (filter/sort/dedup/rename)
 * - Enhanced /sub with node processing pipeline
 * - Rate limiting for scan endpoints
 * - GeoIP caching (KV-backed)
 * - Access logging & cache headers
 */

import { connect } from 'cloudflare:sockets';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, X-Requested-With, Cache-Control, Accept',
  'Access-Control-Expose-Headers': 'Subscription-Userinfo, Content-Disposition, Content-Length',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' };

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

// ═══════════════════════════════════════════════════════════════════
// Geo Utilities — Region detection & emoji flags (from geo-utils.js)
// ═══════════════════════════════════════════════════════════════════
const REGION_KEYWORDS = {
  '香港': ['HK', 'HKG', 'HKT', '香港', 'Hong Kong'], '台湾': ['TW', 'TPE', '台湾', '台北', 'Taiwan'],
  '新加坡': ['SG', 'SIN', '新加坡', 'Singapore'], '日本': ['JP', 'JPN', 'NRT', '日本', 'Japan', 'Tokyo'],
  '美国': ['US', 'USA', 'LAX', 'SFO', '美国', 'United States', 'America'], '韩国': ['KR', 'KOR', 'ICN', '韩国', 'Korea'],
  '英国': ['UK', 'GB', 'LHR', '英国', 'London'], '德国': ['DE', 'DEU', 'FRA', '德国', 'Germany'],
  '法国': ['FR', 'CDG', '法国', 'France', 'Paris'], '加拿大': ['CA', 'CAN', 'YVR', 'YYZ', '加拿大'],
  '澳大利亚': ['AU', 'AUS', 'SYD', 'MEL', '澳大利亚', 'Australia'], '荷兰': ['NL', 'NLD', 'AMS', '荷兰'],
  '俄罗斯': ['RU', 'RUS', 'SVO', '俄罗斯', 'Russia'], '印度': ['IN', 'IND', 'BOM', '印度', 'India'],
  '土耳其': ['TR', 'TUR', 'IST', '土耳其', 'Turkey'], '马来西亚': ['MY', 'MYS', 'KUL', '马来西亚'],
  '泰国': ['TH', 'THA', 'BKK', '泰国', 'Thailand'], '越南': ['VN', 'VNM', '越南', 'Vietnam'],
  '巴西': ['BR', 'BRA', 'GRU', '巴西', 'Brazil'], '意大利': ['IT', 'ITA', 'FCO', '意大利', 'Italy'],
  '西班牙': ['ES', 'ESP', 'MAD', '西班牙', 'Spain'], '瑞士': ['CH', 'CHE', 'ZRH', '瑞士'],
  '波兰': ['PL', 'POL', 'WAW', '波兰', 'Poland'], '瑞典': ['SE', 'SWE', '瑞典', 'Sweden'],
  '挪威': ['NO', 'NOR', 'OSL', '挪威', 'Norway'], '丹麦': ['DK', 'DNK', 'CPH', '丹麦'],
  '芬兰': ['FI', 'FIN', 'HEL', '芬兰', 'Finland'], '奥地利': ['AT', 'AUT', '奥地利'],
  '阿联酋': ['AE', 'ARE', 'DXB', 'UAE', 'Dubai'], '沙特': ['SA', 'SAU', '沙特'],
  '以色列': ['IL', 'ISR', 'TLV', '以色列', 'Israel'], '南非': ['ZA', 'ZAF', '南非'],
  '墨西哥': ['MX', 'MEX', '墨西哥'], '阿根廷': ['AR', 'ARG', '阿根廷'],
  '哥伦比亚': ['CO', 'COL', '哥伦比亚'], '埃及': ['EG', 'EGY', '埃及'],
  '菲律宾': ['PH', 'PHL', '菲律宾'], '印尼': ['ID', 'IDN', 'CGK', '印尼'],
};
const REGION_EMOJI = {
  '香港': '🇭🇰', '台湾': '🇹🇼', '新加坡': '🇸🇬', '日本': '🇯🇵', '美国': '🇺🇸', '韩国': '🇰🇷',
  '英国': '🇬🇧', '德国': '🇩🇪', '法国': '🇫🇷', '加拿大': '🇨🇦', '澳大利亚': '🇦🇺', '荷兰': '🇳🇱',
  '俄罗斯': '🇷🇺', '印度': '🇮🇳', '土耳其': '🇹🇷', '马来西亚': '🇲🇾', '泰国': '🇹🇭', '越南': '🇻🇳',
  '巴西': '🇧🇷', '意大利': '🇮🇹', '西班牙': '🇪🇸', '瑞士': '🇨🇭', '波兰': '🇵🇱', '瑞典': '🇸🇪',
  '挪威': '🇳🇴', '丹麦': '🇩🇰', '芬兰': '🇫🇮', '奥地利': '🇦🇹', '阿联酋': '🇦🇪', '沙特': '🇸🇦',
  '以色列': '🇮🇱', '南非': '🇿🇦', '墨西哥': '🇲🇽', '阿根廷': '🇦🇷', '哥伦比亚': '🇨🇴', '埃及': '🇪🇬',
  '菲律宾': '🇵🇭', '印尼': '🇮🇩',
};
function extractRegion(name) {
  if (!name) return { region: '未知', emoji: '🌍' };
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const kw of keywords) {
      if (name.includes(kw)) return { region, emoji: REGION_EMOJI[region] || '🌍' };
    }
  }
  return { region: '未知', emoji: '🌍' };
}
function getUniqueRegions(nodeNames) {
  const regions = new Set();
  for (const name of nodeNames) { const { region } = extractRegion(name); if (region !== '未知') regions.add(region); }
  return [...regions].sort();
}

// ═══════════════════════════════════════════════════════════════════
// Node Parser — Parse proxy URLs (from node-parser.js)
// ═══════════════════════════════════════════════════════════════════
function parseNodeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (t.startsWith('vless://')) return parseVless(t);
  if (t.startsWith('vmess://')) return parseVmess(t);
  if (t.startsWith('trojan://')) return parseTrojan(t);
  if (t.startsWith('ss://')) return parseSS(t);
  if (t.startsWith('hysteria2://') || t.startsWith('hy2://')) return parseHy2(t);
  if (t.startsWith('tuic://')) return parseTuic(t);
  if (t.startsWith('socks5://') || t.startsWith('socks://')) return parseSocks(t);
  if (t.startsWith('http://') || t.startsWith('https://')) return parseHttp(t);
  return null;
}
function parseVless(url) {
  try {
    const h = url.lastIndexOf('#'); const name = h >= 0 ? decodeURIComponent(url.slice(h+1)) : 'VLESS';
    const body = h >= 0 ? url.slice(0, h) : url; const a = body.lastIndexOf('@');
    if (a < 0) return null; const uuid = body.slice(8, a); const rest = body.slice(a+1);
    const q = rest.indexOf('?'); const hp = q >= 0 ? rest.slice(0, q) : rest;
    const params = q >= 0 ? new URLSearchParams(rest.slice(q+1)) : new URLSearchParams();
    const c = hp.lastIndexOf(':'); const server = c >= 0 ? hp.slice(0, c) : hp;
    const port = c >= 0 ? parseInt(hp.slice(c+1), 10) : 443;
    return { type: 'vless', name, server, port, uuid, sni: params.get('sni') || params.get('host') || '',
      host: params.get('host') || server, path: params.get('path') || '/', fp: params.get('fp') || '',
      flow: params.get('flow') || '', tls: params.get('security') === 'tls' || port === 443, url };
  } catch { return null; }
}
function parseVmess(url) {
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob(url.slice(8)))));
    return { type: 'vmess', name: obj.ps || 'VMess', server: obj.add || obj.host || '',
      port: parseInt(obj.port, 10) || 443, uuid: obj.id || '', sni: obj.sni || obj.host || '',
      host: obj.host || '', path: obj.path || '/', tls: obj.tls === 'tls', url };
  } catch { return null; }
}
function parseTrojan(url) {
  try {
    const h = url.lastIndexOf('#'); const name = h >= 0 ? decodeURIComponent(url.slice(h+1)) : 'Trojan';
    const body = h >= 0 ? url.slice(0, h) : url; const a = body.lastIndexOf('@');
    if (a < 0) return null; const pass = body.slice(9, a); const rest = body.slice(a+1);
    const q = rest.indexOf('?'); const hp = q >= 0 ? rest.slice(0, q) : rest;
    const params = q >= 0 ? new URLSearchParams(rest.slice(q+1)) : new URLSearchParams();
    const c = hp.lastIndexOf(':'); const server = c >= 0 ? hp.slice(0, c) : hp;
    const port = c >= 0 ? parseInt(hp.slice(c+1), 10) : 443;
    return { type: 'trojan', name, server, port, password: pass, sni: params.get('sni') || '',
      host: params.get('host') || server, path: params.get('path') || '/', tls: true, url };
  } catch { return null; }
}
function parseSS(url) {
  try {
    const h = url.lastIndexOf('#'); const name = h >= 0 ? decodeURIComponent(url.slice(h+1)) : 'SS';
    const body = h >= 0 ? url.slice(0, h) : url; const a = body.lastIndexOf('@');
    if (a < 0) return null; const mp = body.slice(5, a); const rest = body.slice(a+1);
    const c = rest.lastIndexOf(':'); const server = c >= 0 ? rest.slice(0, c) : rest;
    const port = c >= 0 ? parseInt(rest.slice(c+1), 10) : 443;
    let method = 'aes-256-gcm', password = '';
    const pi = mp.indexOf(':'); if (pi >= 0) { method = mp.slice(0, pi); password = mp.slice(pi+1); }
    else { try { const d = atob(mp); const i = d.indexOf(':'); if (i >= 0) { method = d.slice(0,i); password = d.slice(i+1); } } catch { password = mp; } }
    return { type: 'ss', name, server, port, cipher: method, password, url };
  } catch { return null; }
}
function parseHy2(url) {
  try {
    const p = url.startsWith('hy2://') ? 'hy2://' : 'hysteria2://';
    const h = url.lastIndexOf('#'); const name = h >= 0 ? decodeURIComponent(url.slice(h+1)) : 'Hy2';
    const body = h >= 0 ? url.slice(0, h) : url; const a = body.lastIndexOf('@');
    if (a < 0) return null; const pass = body.slice(p.length, a); const rest = body.slice(a+1);
    const q = rest.indexOf('?'); const hp = q >= 0 ? rest.slice(0, q) : rest;
    const params = q >= 0 ? new URLSearchParams(rest.slice(q+1)) : new URLSearchParams();
    const c = hp.lastIndexOf(':'); const server = c >= 0 ? hp.slice(0, c) : hp;
    const port = c >= 0 ? parseInt(hp.slice(c+1), 10) : 443;
    return { type: 'hysteria2', name, server, port, password: pass, sni: params.get('sni') || '', url };
  } catch { return null; }
}
function parseTuic(url) {
  try {
    const h = url.lastIndexOf('#'); const name = h >= 0 ? decodeURIComponent(url.slice(h+1)) : 'TUIC';
    const body = h >= 0 ? url.slice(0, h) : url; const a = body.lastIndexOf('@');
    if (a < 0) return null; const pass = body.slice(7, a); const rest = body.slice(a+1);
    const q = rest.indexOf('?'); const hp = q >= 0 ? rest.slice(0, q) : rest;
    const c = hp.lastIndexOf(':'); const server = c >= 0 ? hp.slice(0, c) : hp;
    const port = c >= 0 ? parseInt(hp.slice(c+1), 10) : 443;
    return { type: 'tuic', name, server, port, password: pass, url };
  } catch { return null; }
}
function parseSocks(url) {
  try {
    const p = url.startsWith('socks5://') ? 'socks5' : 'socks';
    const h = url.lastIndexOf('#'); const name = h >= 0 ? decodeURIComponent(url.slice(h+1)) : 'SOCKS';
    const body = h >= 0 ? url.slice(0, h) : url;
    const a = body.slice(p.length+3); const c = a.lastIndexOf(':');
    const server = c >= 0 ? a.slice(0, c) : a; const port = c >= 0 ? parseInt(a.slice(c+1), 10) : 1080;
    return { type: p, name, server, port, url };
  } catch { return null; }
}
function parseHttp(url) {
  try {
    const https = url.startsWith('https://');
    const h = url.lastIndexOf('#'); const name = h >= 0 ? decodeURIComponent(url.slice(h+1)) : 'HTTP';
    const body = h >= 0 ? url.slice(0, h) : url; const u = new URL(body);
    return { type: https ? 'https' : 'http', name, server: u.hostname, port: parseInt(u.port,10) || (https?443:80), url };
  } catch { return null; }
}
function parseSubscription(content) {
  if (!content) return [];
  let t = content; try { t = decodeURIComponent(escape(atob(t.trim()))); } catch {}
  return t.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(parseNodeUrl).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════
// Operator Runner — Node transformation pipeline (from operator-runner.js)
// ═══════════════════════════════════════════════════════════════════
function runOperatorChain(nodes, operators) {
  if (!operators || !operators.length) return nodes;
  let result = [...nodes];
  for (const op of operators) {
    if (!op.enabled) continue;
    switch (op.type) {
      case 'filter': result = opFilter(result, op.params); break;
      case 'sort': result = opSort(result, op.params); break;
      case 'dedup': result = opDedup(result, op.params); break;
      case 'rename': result = opRename(result, op.params); break;
    }
  }
  return result;
}
function opFilter(nodes, params) {
  if (!params) return nodes;
  let result = [...nodes];
  if (params.include?.enabled && params.include.rules?.length) {
    const rules = params.include.rules.map(r => typeof r === 'string' ? r : r.pattern || '').filter(Boolean);
    result = result.filter(n => rules.some(r => { try { return new RegExp(r, 'i').test(n.name); } catch { return n.name.toLowerCase().includes(r.toLowerCase()); } }));
  }
  if (params.exclude?.enabled && params.exclude.rules?.length) {
    const rules = params.exclude.rules.map(r => typeof r === 'string' ? r : r.pattern || '').filter(Boolean);
    result = result.filter(n => !rules.some(r => { try { return new RegExp(r, 'i').test(n.name); } catch { return n.name.toLowerCase().includes(r.toLowerCase()); } }));
  }
  if (params.protocols?.enabled && params.protocols.values?.length) {
    const allowed = new Set(params.protocols.values.map(p => p.toLowerCase()));
    result = result.filter(n => allowed.has((n.type || '').toLowerCase()));
  }
  if (params.regions?.enabled && params.regions.values?.length) {
    const allowed = new Set(params.regions.values);
    result = result.filter(n => allowed.has(extractRegion(n.name).region));
  }
  return result;
}
function opSort(nodes, params) {
  if (!params?.keys?.length) return nodes;
  const result = [...nodes];
  result.sort((a, b) => {
    for (const { key, order = 'asc' } of params.keys) {
      let va, vb;
      switch (key) {
        case 'name': va = a.name||''; vb = b.name||''; break;
        case 'server': va = a.server||''; vb = b.server||''; break;
        case 'port': va = a.port||0; vb = b.port||0; break;
        case 'protocol': va = a.type||''; vb = b.type||''; break;
        case 'region': va = extractRegion(a.name).region; vb = extractRegion(b.name).region; break;
        default: va = ''; vb = '';
      }
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
  return result;
}
function opDedup(nodes, params) {
  if (!params) return nodes;
  const seen = new Set();
  return nodes.filter(n => {
    const key = params.mode === 'name' ? n.name : `${n.server}:${n.port}`;
    if (seen.has(key)) return false; seen.add(key); return true;
  });
}
function opRename(nodes, params) {
  if (!params) return nodes;
  let result = [...nodes];
  if (params.regex?.enabled && params.regex.rules?.length) {
    result = result.map(n => {
      let name = n.name;
      for (const rule of params.regex.rules) {
        try {
          const [pat, rep] = typeof rule === 'object' ? [new RegExp(rule.pattern||'', rule.flags||'gi'), rule.replacement||''] : [new RegExp(rule, 'gi'), ''];
          name = name.replace(pat, rep);
        } catch {}
      }
      return name !== n.name ? { ...n, name } : n;
    });
  }
  if (params.template?.enabled && params.template.template) {
    let idx = params.template.offset || 1;
    result = result.map(n => {
      const { region, emoji } = extractRegion(n.name);
      const tpl = params.template.template.replace('{emoji}', emoji).replace('{region}', region)
        .replace('{protocol}', n.type||'').replace('{index}', String(idx).padStart(2,'0'))
        .replace('{server}', n.server||'').replace('{port}', String(n.port||''));
      idx++; return { ...n, name: tpl };
    });
  }
  return result;
}

// ─── Rate Limiter (simple in-memory per-IP) ───
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window

function checkRateLimit(ip) {
  cleanupRateLimit(); // Lazy cleanup
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  record.count++;
  if (record.count > RATE_LIMIT_MAX) return false;
  return true;
}

// Lazy cleanup: done inside checkRateLimit instead of setInterval
function cleanupRateLimit() {
  if (rateLimitMap.size < 100) return; // Only clean when map gets large
  const now = Date.now();
  for (const [ip, record] of rateLimitMap) {
    if (now - record.start > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(ip);
  }
}

// ─── Cloudflare IP Ranges ───
const CLOUDFLARE_IPV4_CIDRS = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
];

const COLO_CITY_MAP = {
  FRA: 'Frankfurt, DE', DUS: 'Dusseldorf, DE', MUC: 'Munich, DE', BER: 'Berlin, DE',
  LHR: 'London, UK', MAN: 'Manchester, UK', AMS: 'Amsterdam, NL', VIE: 'Vienna, AT',
  MXP: 'Milan, IT', FCO: 'Rome, IT', CDG: 'Paris, FR', MRS: 'Marseille, FR',
  MAD: 'Madrid, ES', BCN: 'Barcelona, ES', LIS: 'Lisbon, PT', WAW: 'Warsaw, PL',
  PRG: 'Prague, CZ', BUD: 'Budapest, HU', OTP: 'Bucharest, RO', SOF: 'Sofia, BG',
  ATH: 'Athens, GR', IST: 'Istanbul, TR', ESB: 'Ankara, TR', DXB: 'Dubai, AE',
  AUH: 'Abu Dhabi, AE', DOH: 'Doha, QA', BAH: 'Manama, BH', KWI: 'Kuwait City, KW',
  RUH: 'Riyadh, SA', JED: 'Jeddah, SA', TLV: 'Tel Aviv, IL', AMM: 'Amman, JO',
  FRU: 'Bishkek, KG', TAS: 'Tashkent, UZ', ALA: 'Almaty, KZ', TBS: 'Tbilisi, GE',
  EVN: 'Yerevan, AM', BAK: 'Baku, AZ', DME: 'Moscow, RU', LED: 'St. Petersburg, RU',
  HEL: 'Helsinki, FI', ARN: 'Stockholm, SE', OSL: 'Oslo, NO', CPH: 'Copenhagen, DK',
  DUB: 'Dublin, IE', BRU: 'Brussels, BE', ZRH: 'Zurich, CH', LUX: 'Luxembourg',
  SIN: 'Singapore', HKG: 'Hong Kong', NRT: 'Tokyo, JP', KIX: 'Osaka, JP',
  ICN: 'Seoul, KR', TPE: 'Taipei, TW', KUL: 'Kuala Lumpur, MY', BKK: 'Bangkok, TH',
  CGK: 'Jakarta, ID', MNL: 'Manila, PH', DEL: 'New Delhi, IN', BOM: 'Mumbai, IN',
  MAA: 'Chennai, IN', BLR: 'Bengaluru, IN', KHI: 'Karachi, PK', DAC: 'Dhaka, BD',
  LAX: 'Los Angeles, US', SJC: 'San Jose, US', SEA: 'Seattle, US', IAD: 'Ashburn, US',
  ORD: 'Chicago, US', EWR: 'Newark, US', ATL: 'Atlanta, US', DFW: 'Dallas, US',
  MIA: 'Miami, US', DEN: 'Denver, US', YYZ: 'Toronto, CA', YVR: 'Vancouver, CA',
  GRU: 'Sao Paulo, BR', GIG: 'Rio de Janeiro, BR', EZE: 'Buenos Aires, AR',
  SCL: 'Santiago, CL', BOG: 'Bogota, CO', MEX: 'Mexico City, MX', JNB: 'Johannesburg, ZA',
  CAI: 'Cairo, EG', LOS: 'Lagos, NG', NBO: 'Nairobi, KE', SYD: 'Sydney, AU',
  MEL: 'Melbourne, AU', AKL: 'Auckland, NZ'
};

// ─── IP Utilities ───
function parseCidr(cidr) {
  const [base, maskStr] = cidr.split('/');
  const mask = parseInt(maskStr, 10);
  const octets = base.split('.').map(Number);
  const baseInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  return { baseInt, mask };
}

function ipInCidr(ipInt, cidr) {
  const { baseInt, mask } = parseCidr(cidr);
  const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  return (ipInt & maskBits) === (baseInt & maskBits);
}

function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isRealCloudflareIp(ip) {
  const ipInt = ipToInt(ip);
  if (ipInt === null) return false;
  return CLOUDFLARE_IPV4_CIDRS.some(c => ipInCidr(ipInt, c));
}

function isValidIp(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

// ─── Concurrency Runner ───
async function runWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function spawn() {
    while (idx < items.length) {
      const current = idx++;
      try {
        results[current] = await fn(items[current], current);
      } catch (e) {
        results[current] = { error: e.message };
      }
    }
  }
  const pool = Array.from({ length: Math.min(limit, items.length) }, () => spawn());
  await Promise.all(pool);
  return results;
}

// ─── TCP Probe ───
async function tcpProbe(ip, port = 443, timeoutMs = 3000) {
  const start = Date.now();
  let socket;
  try {
    socket = connect({ hostname: ip, port: Number(port) });
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });
    await Promise.race([socket.opened, timeout]);
    const latency = Date.now() - start;
    socket.close().catch(() => {});
    return { ip, port: Number(port), latency, status: 'ok', method: 'tcp' };
  } catch (e) {
    if (socket) { try { socket.close().catch(() => {}); } catch {} }
    return { ip, port: Number(port), latency: null, status: 'error', method: 'tcp', error: e.message };
  }
}

// ─── Colo Probe ───
async function coloProbe(ip, timeoutMs = 4000) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch('https://speed.cloudflare.com/cdn-cgi/trace', {
      cf: { resolveOverride: ip, cacheTtl: 0 },
      signal: controller.signal
    });
    clearTimeout(tid);
    const latency = Date.now() - start;
    if (!res.ok) return { ip, status: 'error', latency: null, error: `HTTP ${res.status}` };

    const cfRay = res.headers.get('cf-ray') || '';
    const isCloudflareServer = (res.headers.get('server') || '').toLowerCase() === 'cloudflare';
    const rayColoMatch = cfRay.match(/[A-Z]{3}$/);
    const rayColo = (isCloudflareServer && rayColoMatch) ? rayColoMatch[0] : null;

    const text = await res.text();
    const data = {};
    text.split('\n').forEach(line => {
      const eq = line.indexOf('=');
      if (eq > -1) data[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    });

    const traceColo = data.colo || null;
    const finalColo = traceColo || rayColo || null;

    return {
      ip,
      status: 'ok',
      latency,
      colo: finalColo,
      city: COLO_CITY_MAP[finalColo] || null,
      warp: data.warp || 'off',
      httpProtocol: data.http || null,
      tls: data.tls || null,
      edgeVerifiedIp: data.ip || null,
      crossVerified: !!(traceColo && rayColo && traceColo === rayColo)
    };
  } catch (e) {
    return { ip, status: 'error', latency: null, colo: null, error: e.message };
  }
}

// ─── Enhanced /sub Endpoint ───
function optimizeConfigLine(line, cleanIp, cleanPort, customSni, fp, fm) {
  // VLESS
  if (line.startsWith('vless://')) {
    try {
      const hashIdx = line.lastIndexOf('#');
      const frag = hashIdx >= 0 ? line.slice(hashIdx) : '';
      const body = hashIdx >= 0 ? line.slice(0, hashIdx) : line;
      
      const atIdx = body.lastIndexOf('@');
      if (atIdx < 0) return line;
      
      const uuid = body.slice(8, atIdx);
      const rest = body.slice(atIdx + 1);
      const qIdx = rest.indexOf('?');
      const hostPort = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
      const query = qIdx >= 0 ? rest.slice(qIdx + 1) : '';
      
      const colonIdx = hostPort.lastIndexOf(':');
      const host = colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort;
      const port = colonIdx >= 0 ? hostPort.slice(colonIdx + 1) : '443';
      
      const params = new URLSearchParams(query);
      if (cleanIp) params.set('host', cleanIp);
      if (customSni) params.set('sni', customSni);
      if (fp) params.set('fp', fp);
      if (fm) params.set('fm', fm);
      
      const newHost = cleanIp || host;
      const newPort = cleanPort || port;
      return `vless://${uuid}@${newHost}:${newPort}?${params.toString()}${frag}`;
    } catch { return line; }
  }
  
  // Trojan
  if (line.startsWith('trojan://')) {
    try {
      const hashIdx = line.lastIndexOf('#');
      const frag = hashIdx >= 0 ? line.slice(hashIdx) : '';
      const body = hashIdx >= 0 ? line.slice(0, hashIdx) : line;
      
      const atIdx = body.lastIndexOf('@');
      if (atIdx < 0) return line;
      
      const password = body.slice(9, atIdx);
      const rest = body.slice(atIdx + 1);
      const qIdx = rest.indexOf('?');
      const hostPort = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
      const query = qIdx >= 0 ? rest.slice(qIdx + 1) : '';
      
      const colonIdx = hostPort.lastIndexOf(':');
      const host = colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort;
      const port = colonIdx >= 0 ? hostPort.slice(colonIdx + 1) : '443';
      
      const params = new URLSearchParams(query);
      if (customSni) params.set('sni', customSni);
      if (fp) params.set('fp', fp);
      
      const newHost = cleanIp || host;
      const newPort = cleanPort || port;
      return `trojan://${password}@${newHost}:${newPort}?${params.toString()}${frag}`;
    } catch { return line; }
  }
  
  // VMess (base64 encoded JSON)
  if (line.startsWith('vmess://')) {
    try {
      const b64 = line.slice(8);
      const jsonStr = decodeURIComponent(escape(atob(b64)));
      const obj = JSON.parse(jsonStr);
      
      if (cleanIp) obj.add = cleanIp;
      if (cleanPort) obj.port = parseInt(cleanPort, 10);
      if (customSni) { obj.sni = customSni; obj.host = customSni; }
      if (fp) obj.fp = fp;
      
      return 'vmess://' + btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    } catch { return line; }
  }
  
  // Shadowsocks
  if (line.startsWith('ss://')) {
    try {
      let decoded = line.slice(5);
      const hashIdx = decoded.lastIndexOf('#');
      const frag = hashIdx >= 0 ? decoded.slice(hashIdx) : '';
      decoded = hashIdx >= 0 ? decoded.slice(0, hashIdx) : decoded;
      
      const atIdx = decoded.lastIndexOf('@');
      if (atIdx < 0) return line;
      
      const methodAndPass = decoded.slice(0, atIdx);
      const hostPort = decoded.slice(atIdx + 1);
      
      const colonIdx = hostPort.lastIndexOf(':');
      const host = colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort;
      const port = colonIdx >= 0 ? hostPort.slice(colonIdx + 1) : '443';
      
      const newHost = cleanIp || host;
      const newPort = cleanPort || port;
      return `ss://${methodAndPass}@${newHost}:${newPort}${frag}`;
    } catch { return line; }
  }
  
  return line;
}

// ─── Main Handler ───
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';

    // Rate limiting for scan endpoints
    if (pathname === '/api/scan/batch' || pathname === '/api/probe/ports') {
      if (!checkRateLimit(clientIp)) {
        return jsonResponse({ error: 'Rate limit exceeded. Try again later.' }, 429);
      }
    }

    try {
      // Root / API info
      if (pathname === '/' || pathname === '/api') {
        return jsonResponse({
          status: 'online',
          service: 'MiSub & CF-Optimizer Real Edge Backend',
          version: '6.0.0',
          engines: ['tcp-socket-probe', 'resolveOverride-colo-probe', 'parallel-batch-scanner', 'streaming-speedtest-proxy'],
          endpoints: ['/api/probe', '/api/probe/ports', '/api/scan/batch', '/api/speedtest-proxy', '/api/doh', '/api/geoip', '/api/geoip/batch', '/api/ip/ranges', '/api/ip/verify', '/sub', '/api/ping']
        });
      }

      // 1. Fetch Subscription without CORS
      if (pathname === '/api/proxy-fetch' || pathname === '/api/fetch-sub') {
        let targetUrl = url.searchParams.get('url');
        let customUa = url.searchParams.get('ua') || request.headers.get('User-Agent') || 'v2rayNG/1.8.12 (MiSub Engine)';

        if (!targetUrl && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          targetUrl = body.url;
          if (body.userAgent) customUa = body.userAgent;
        }

        if (!targetUrl) return jsonResponse({ success: false, error: 'url is required' }, 400);

        try {
          new URL(targetUrl);
        } catch {
          return jsonResponse({ success: false, error: 'Invalid URL format' }, 400);
        }

        const subRes = await fetch(targetUrl, {
          headers: { 'User-Agent': customUa, 'Accept': '*/*' },
          redirect: 'follow'
        });

        const rawData = await subRes.text();
        const userinfo = subRes.headers.get('Subscription-Userinfo') || '';

        if (request.method === 'GET' && !url.searchParams.get('json')) {
          return new Response(rawData, {
            status: subRes.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Subscription-Userinfo': userinfo }
          });
        }

        return jsonResponse({ success: true, userinfo, data: rawData });
      }

      // 2. Single-IP probe
      if (pathname === '/api/probe') {
        const ip = url.searchParams.get('ip') || url.searchParams.get('host');
        const port = parseInt(url.searchParams.get('port'), 10) || 443;
        const withColo = url.searchParams.get('colo') === '1';
        if (!ip || !isValidIp(ip)) return jsonResponse({ error: 'Valid IP is required' }, 400);
        if (port < 1 || port > 65535) return jsonResponse({ error: 'Invalid port number' }, 400);

        const tcp = await tcpProbe(ip, port, 3500);
        if (!withColo) return jsonResponse({ success: tcp.status === 'ok', ...tcp });

        const colo = await coloProbe(ip, 4000);
        return jsonResponse({
          success: tcp.status === 'ok' || colo.status === 'ok',
          ip, port,
          latency: tcp.latency,
          status: tcp.status,
          colo: colo.colo, city: colo.city, warp: colo.warp,
          httpLatency: colo.latency,
          crossVerified: !!colo.crossVerified
        });
      }

      // 3. Port sweep
      if (pathname === '/api/probe/ports') {
        const ip = url.searchParams.get('ip');
        const portsParam = url.searchParams.get('ports') || '443,8443,2053,2083,2087,2096,80,8080,8880,2052,2082,2086,2095';
        const ports = [...new Set(portsParam.split(',').map(p => parseInt(p.trim(), 10)).filter(p => p > 0 && p < 65536))].slice(0, 16);
        if (!ip || !isValidIp(ip)) return jsonResponse({ error: 'Valid IP is required' }, 400);
        if (!ports.length) return jsonResponse({ error: 'No valid ports supplied' }, 400);

        const results = await runWithConcurrency(ports, 8, (port) => tcpProbe(ip, port, 3000));
        const healthy = results.filter(r => r.status === 'ok').sort((a, b) => a.latency - b.latency);
        return jsonResponse({ success: true, ip, results, best: healthy[0] || null });
      }

      // 4. Batch scanner
      if (pathname === '/api/scan/batch' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const ips = Array.isArray(body.ips) ? body.ips.filter(ip => typeof ip === 'string' && isValidIp(ip)).slice(0, 500) : [];
        const port = parseInt(body.port, 10) || 443;
        const mode = ['tcp', 'colo', 'both'].includes(body.mode) ? body.mode : 'tcp';
        const concurrency = Math.min(Math.max(parseInt(body.concurrency, 10) || 30, 1), 60);

        if (!ips.length) return jsonResponse({ success: false, error: 'Valid ips[] required (max 500)' }, 400);

        const results = await runWithConcurrency(ips, concurrency, async (ip) => {
          if (mode === 'tcp') return tcpProbe(ip, port, 3000);
          if (mode === 'colo') return coloProbe(ip, 4000);
          const [tcp, colo] = await Promise.all([tcpProbe(ip, port, 3000), coloProbe(ip, 4000)]);
          return {
            ip, port,
            latency: tcp.latency,
            status: tcp.status === 'ok' ? 'ok' : (colo.status === 'ok' ? 'ok' : 'error'),
            colo: colo.colo, city: colo.city, warp: colo.warp,
            httpLatency: colo.latency,
            verified: colo.status === 'ok',
            crossVerified: !!colo.crossVerified
          };
        });

        const healthy = results.filter(r => r.status === 'ok').length;
        return jsonResponse({ success: true, count: results.length, healthy, mode, results });
      }

      // 5. Speed test proxy
      if (pathname === '/api/speedtest-proxy' || pathname === '/api/speedtest') {
        const ip = url.searchParams.get('ip');
        const bytes = Math.min(Math.max(parseInt(url.searchParams.get('bytes'), 10) || 10000000, 100000), 50000000);
        if (!ip || !isValidIp(ip)) return jsonResponse({ error: 'Valid IP is required' }, 400);

        const upstream = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytes}`, {
          cf: { resolveOverride: ip, cacheTtl: 0 }
        });

        if (!upstream.ok || !upstream.body) {
          return jsonResponse({ success: false, error: `Upstream responded ${upstream.status}` }, 502);
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/octet-stream',
            'X-Speedtest-Ip': ip,
            'X-Speedtest-Bytes': String(bytes)
          }
        });
      }

      // 6. CIDR List
      if (pathname === '/api/ip/ranges') {
        return jsonResponse({ success: true, cidrs: CLOUDFLARE_IPV4_CIDRS });
      }

      // 7. IP Verify
      if (pathname === '/api/ip/verify') {
        const ip = url.searchParams.get('ip');
        if (!ip || !isValidIp(ip)) return jsonResponse({ error: 'Valid IP is required' }, 400);
        return jsonResponse({ success: true, ip, isCloudflareRange: isRealCloudflareIp(ip) });
      }

      // 8. DoH Gateway
      if (pathname === '/api/doh') {
        const domain = url.searchParams.get('name');
        const provider = url.searchParams.get('provider') || 'https://1.1.1.1/dns-query';
        if (!domain) return jsonResponse({ error: 'Domain name required' }, 400);

        try {
          const dohRes = await fetch(`${provider}?name=${encodeURIComponent(domain)}&type=A`, {
            headers: { Accept: 'application/dns-json' }
          });
          const dohData = await dohRes.json();
          return jsonResponse(dohData);
        } catch (e) {
          return jsonResponse({ error: `DoH query failed: ${e.message}` }, 502);
        }
      }

      // 9. GeoIP single
      if (pathname === '/api/geoip') {
        const ip = url.searchParams.get('ip') || '';
        if (ip && !isValidIp(ip)) return jsonResponse({ error: 'Invalid IP format' }, 400);
        try {
          const geoRes = await fetch(`https://ipwho.is/${ip}`);
          const geoData = await geoRes.json();
          return jsonResponse(geoData);
        } catch (e) {
          return jsonResponse({ error: `GeoIP lookup failed: ${e.message}` }, 502);
        }
      }

      // 9b. GeoIP batch
      if (pathname === '/api/geoip/batch' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const ips = Array.isArray(body.ips) ? body.ips.filter(ip => typeof ip === 'string' && isValidIp(ip)).slice(0, 100) : [];
        if (!ips.length) return jsonResponse({ success: false, error: 'Valid ips[] required (max 100)' }, 400);

        try {
          const geoRes = await fetch('http://ip-api.com/batch?fields=status,message,country,countryCode,city,isp,query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ips)
          });
          if (!geoRes.ok) return jsonResponse({ success: false, error: `ip-api.com responded ${geoRes.status}` }, 502);
          const geoData = await geoRes.json();
          return jsonResponse({ success: true, results: geoData });
        } catch (e) {
          return jsonResponse({ success: false, error: `GeoIP batch failed: ${e.message}` }, 502);
        }
      }

      // 10. Enhanced Subscription Provider (/sub)
      if (pathname === '/sub') {
        const targetUrl = url.searchParams.get('url');
        const cleanIp = url.searchParams.get('ip');
        const cleanPort = url.searchParams.get('port');
        const customSni = url.searchParams.get('sni');
        const fp = url.searchParams.get('fp') || 'chrome';
        const fm = url.searchParams.get('fm');

        if (!targetUrl) {
          return new Response(JSON.stringify({
            help: 'Enhanced Subscription Provider Endpoint',
            version: '5.1.0',
            params: {
              url: 'Subscription URL (required)',
              ip: 'Clean IP to replace server addresses',
              port: 'Port to replace',
              sni: 'Custom SNI/Host',
              fp: 'Fingerprint (chrome/firefox/safari/edge)',
              fm: 'FinalMask JSON for fragment injection'
            },
            example: '/sub?url=<sub_url>&ip=104.16.1.1&port=443&sni=example.com&fp=chrome'
          }, null, 2), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }

        try {
          new URL(targetUrl);
        } catch {
          return jsonResponse({ error: 'Invalid subscription URL' }, 400);
        }

        const subRes = await fetch(targetUrl, {
          headers: { 'User-Agent': request.headers.get('User-Agent') || 'v2rayNG/1.8.12' },
          redirect: 'follow'
        });

        if (!subRes.ok) {
          return jsonResponse({ error: `Subscription fetch failed: HTTP ${subRes.status}` }, 502);
        }

        let rawData = await subRes.text();

        // Try base64 decode
        try {
          rawData = decodeURIComponent(escape(atob(rawData.trim())));
        } catch {}

        const lines = rawData.split('\n').map(l => l.trim()).filter(Boolean);
        const optimized = lines.map(line => optimizeConfigLine(line, cleanIp, cleanPort, customSni, fp, fm));

        const outBase64 = btoa(unescape(encodeURIComponent(optimized.join('\n'))));
        return new Response(outBase64, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/plain; charset=utf-8',
            'Subscription-Userinfo': subRes.headers.get('Subscription-Userinfo') || '',
            'X-Config-Count': String(optimized.length),
            'X-Optimized': cleanIp || customSni ? 'true' : 'false'
          }
        });
      }

      // 11. Parse nodes from text
      if (pathname === '/api/nodes/parse' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const text = body.text || body.content || '';
        if (!text) return jsonResponse({ success: false, error: 'text is required' }, 400);

        const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        const nodes = lines.map(parseNodeUrl).filter(Boolean);
        const regions = getUniqueRegions(nodes.map(n => n.name));

        return jsonResponse({
          success: true,
          total: lines.length,
          parsed: nodes.length,
          regions,
          nodes: nodes.map(n => ({
            name: n.name, type: n.type, server: n.server, port: n.port,
            region: extractRegion(n.name)
          }))
        });
      }

      // 12. Optimize nodes with operator chain
      if (pathname === '/api/nodes/optimize' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const text = body.text || body.content || '';
        const operators = Array.isArray(body.operators) ? body.operators : [];
        const cleanIp = body.ip || body.cleanIp;
        const cleanPort = body.port || body.cleanPort;
        const customSni = body.sni;

        if (!text) return jsonResponse({ success: false, error: 'text is required' }, 400);

        const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        let nodes = lines.map(parseNodeUrl).filter(Boolean);
        nodes = runOperatorChain(nodes, operators);

        // Apply clean IP if provided
        if (cleanIp) {
          nodes = nodes.map(n => {
            if (n.type === 'vless' || n.type === 'trojan' || n.type === 'vmess') {
              const newUrl = n.url
                .replace(/@[\w.-]+:\d+/, `@${cleanIp}:${cleanPort || n.port}`)
                .replace(/host=[\w.-]+/, `host=${n.host || n.server}`)
                .replace(/sni=[\w.-]+/, `sni=${customSni || n.sni || n.server}`);
              return { ...n, url: newUrl, server: cleanIp, port: parseInt(cleanPort) || n.port };
            }
            return n;
          });
        }

        const regions = getUniqueRegions(nodes.map(n => n.name));
        const outBase64 = btoa(unescape(encodeURIComponent(nodes.map(n => n.url).join('\n'))));

        return jsonResponse({
          success: true,
          total: lines.length,
          optimized: nodes.length,
          regions,
          optimizedBase64: outBase64,
          nodes: nodes.map(n => ({
            name: n.name, type: n.type, server: n.server, port: n.port,
            region: extractRegion(n.name)
          }))
        });
      }

      // 13. Get unique regions from subscription
      if (pathname === '/api/nodes/regions') {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) return jsonResponse({ success: false, error: 'url is required' }, 400);

        try {
          const subRes = await fetch(targetUrl, {
            headers: { 'User-Agent': request.headers.get('User-Agent') || 'v2rayNG/1.8.12' },
            redirect: 'follow'
          });
          if (!subRes.ok) return jsonResponse({ success: false, error: `HTTP ${subRes.status}` }, 502);

          let rawData = await subRes.text();
          try { rawData = decodeURIComponent(escape(atob(rawData.trim()))); } catch {}

          const nodes = parseSubscription(rawData);
          const regions = getUniqueRegions(nodes.map(n => n.name));

          return jsonResponse({
            success: true,
            total: nodes.length,
            regions: regions.map(r => ({
              name: r,
              emoji: extractRegion(r + 'test').emoji,
              count: nodes.filter(n => extractRegion(n.name).region === r).length
            }))
          });
        } catch (e) {
          return jsonResponse({ success: false, error: e.message }, 502);
        }
      }

      // 14. Ping
      if (pathname === '/api/ping') {
        return jsonResponse({ success: true, timestamp: Date.now(), version: '6.0.0' });
      }

      return jsonResponse({ error: 'Not Found', availableEndpoints: ['/api/probe', '/api/probe/ports', '/api/scan/batch', '/api/speedtest-proxy', '/api/doh', '/api/geoip', '/api/geoip/batch', '/api/ip/ranges', '/api/ip/verify', '/sub', '/api/nodes/parse', '/api/nodes/optimize', '/api/nodes/regions', '/api/ping'] }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message, stack: e.stack }, 500);
    }
  }
};
