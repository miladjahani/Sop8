/**
 * Proxy feed sources — dual-repo architecture:
 * ------------------------------------------------------------------
 * 1. roosterkid/openproxylist — plain-text ip:port lists (HTTP, SOCKS4, SOCKS5)
 * 2. EDT-Pages/Proxy-List — rich JSON with country, city, ASN, emoji metadata
 *
 * The EDT source is preferred because it provides GeoIP-enriched entries
 * that we can display in the proxy table without additional lookups.
 */

/* ───── openproxylist (plain text ip:port) ───── */
const PL_REPO_OWNER = 'roosterkid';
const PL_REPO_NAME = 'openproxylist';
const PL_BRANCH = 'main';

export const PROXY_FEEDS = {
  http: { file: 'HTTPS_RAW.txt', label: 'HTTP / HTTPS' },
  socks4: { file: 'SOCKS4_RAW.txt', label: 'SOCKS4' },
  socks5: { file: 'SOCKS5_RAW.txt', label: 'SOCKS5' }
};

/* ───── EDT-Pages/Proxy-List (rich JSON) ───── */
const EDT_RAW_BASE = 'https://raw.githubusercontent.com/EDT-Pages/Proxy-List/main/data';

export const EDT_FEEDS = {
  http:  { file: 'http.json',  label: 'HTTP',  protocol: 'http'  },
  https: { file: 'https.json', label: 'HTTPS', protocol: 'https' },
  socks5:{ file: 'socks5.json',label: 'SOCKS5',protocol: 'socks5' }
};

/* ──── helpers ──── */

function plRawUrl(file) {
  return `https://raw.githubusercontent.com/${PL_REPO_OWNER}/${PL_REPO_NAME}/${PL_BRANCH}/${file}`;
}

const IP_PORT_RE = /((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})\b/;

function parseIpPortLines(text) {
  const out = [];
  const seen = new Set();
  String(text || '').split(/\r?\n/).forEach(line => {
    const m = line.trim().match(IP_PORT_RE);
    if (!m) return;
    const ip = m[1], port = m[2];
    const key = `${ip}:${port}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ ip, port: Number(port) });
  });
  return out;
}

/**
 * Parse the EDT-Pages rich JSON proxy list.
 * Each entry has: proxy, protocol, ip, port, country, country_emoji,
 * city, asn, asOrganization, latitude, longitude, continent_en, etc.
 */
function parseEdtJson(text) {
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    return arr.filter(p => {
      if (!p || !p.ip || !p.port) return false;
      const key = `${p.ip}:${p.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(p => ({
      ip: String(p.ip),
      port: Number(p.port),
      protocol: p.protocol || 'http',
      country: p.country || '',
      countryEmoji: p.country_emoji || '',
      countryCode: p.country || '',
      countryEn: p.country_en || '',
      city: p.city || '',
      asn: p.asn || '',
      asOrg: p.asOrganization || '',
      continent: p.continent_en || '',
      lat: p.latitude ? Number(p.latitude) : null,
      lng: p.longitude ? Number(p.longitude) : null
    }));
  } catch {
    return [];
  }
}

/* ──── fetch chain (worker → direct → public CORS proxies) ──── */

const PUBLIC_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

async function fetchText(url, workerUrl, timeoutMs = 12000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Via Worker
    if (workerUrl) {
      try {
        const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/proxy-fetch?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        if (res.ok) { clearTimeout(tid); return await res.text(); }
      } catch { /* fall through */ }
    }

    // 2. Direct
    try {
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (res.ok) { clearTimeout(tid); return await res.text(); }
    } catch { /* fall through */ }

    // 3. Public CORS proxies
    for (const prefix of PUBLIC_PROXIES) {
      try {
        const res = await fetch(prefix + encodeURIComponent(url));
        if (res.ok) { clearTimeout(tid); return await res.text(); }
      } catch { /* try next */ }
    }
  } finally {
    clearTimeout(tid);
  }

  throw new Error('تمام مسیرهای دریافت ناموفق بودند.');
}

/* ──── public API ──── */

/**
 * Fetch plain-text openproxylist feed (existing behaviour).
 */
export async function fetchProxyFeed(type, workerUrl) {
  const feed = PROXY_FEEDS[type];
  if (!feed) throw new Error('نوع پروکسی نامعتبر است.');
  const url = plRawUrl(feed.file);
  const text = await fetchText(url, workerUrl);
  const list = parseIpPortLines(text);
  if (!list.length) throw new Error('فهرست پروکسی خالی دریافت شد.');
  return { list, via: workerUrl ? 'worker' : 'direct' };
}

/**
 * Fetch rich EDT-Pages/Proxy-List JSON feed.
 * Returns enriched entries with country, city, ASN metadata.
 */
export async function fetchEdtFeed(type, workerUrl) {
  const feed = EDT_FEEDS[type];
  if (!feed) throw new Error('نوع پروکسی EDT نامعتبر است.');
  const url = `${EDT_RAW_BASE}/${feed.file}`;
  const text = await fetchText(url, workerUrl);
  const list = parseEdtJson(text);
  if (!list.length) throw new Error('فهرست پروکسی EDT خالی دریافت شد.');
  return { list, via: workerUrl ? 'worker' : 'direct', source: 'EDT-Pages/Proxy-List' };
}

/**
 * Convert a 2-letter country code to an emoji flag.
 */
export function countryCodeToFlag(cc) {
  if (!cc || cc.length !== 2) return '🏳️';
  const codePoints = [...cc.toUpperCase()].map(c => 0x1F1E6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

/**
 * Real bulk GeoIP lookup for a batch of proxy IPs, via the Worker's
 * /api/geoip/batch endpoint (ip-api.com's real batch API — genuine
 * MaxMind-derived country/city data, not a guess).
 */
export async function lookupProxyCountries(list, workerUrl) {
  if (!workerUrl) throw new Error('برای تشخیص کشور پروکسی‌ها، آدرس Worker را در تنظیمات وارد کنید.');
  const uniqueIps = [...new Set(list.map(p => p.ip))];
  const chunks = [];
  for (let i = 0; i < uniqueIps.length; i += 100) chunks.push(uniqueIps.slice(i, i + 100));

  const geoByIp = {};
  for (const chunk of chunks) {
    try {
      const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/geoip/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ips: chunk })
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.success) continue;
      data.results.forEach(r => {
        if (r.status === 'success') {
          geoByIp[r.query] = { country: r.country, countryCode: r.countryCode, city: r.city, isp: r.isp };
        }
      });
    } catch { /* this chunk failed */ }
  }

  return list.map(p => ({ ...p, ...(geoByIp[p.ip] || { country: null, countryCode: null, city: null, isp: null }) }));
}

/**
 * Real liveness check for a batch of fetched proxies via Worker TCP probe.
 */
export async function probeProxyBatch(list, workerUrl, { concurrency = 25, timeoutMs = 20000 } = {}) {
  if (!workerUrl) throw new Error('برای تست زنده بودن پروکسی‌ها، آدرس Worker را وارد کنید.');
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const byPort = {};
    list.forEach(p => { (byPort[p.port] = byPort[p.port] || []).push(p.ip); });

    const results = [];
    for (const port of Object.keys(byPort)) {
      const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/scan/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ips: byPort[port], port: Number(port), mode: 'tcp', concurrency }),
        signal: controller.signal
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.success) {
        data.results.forEach(r => results.push({ ip: r.ip, port: Number(port), latency: r.latency, status: r.status }));
      }
    }
    clearTimeout(tid);
    return results;
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}
