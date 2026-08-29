/**
 * Node Parser — Parse proxy protocol URLs
 * Inspired by MiSub's node-parser.js
 */

/**
 * Parse a proxy URL into structured data
 * Supports: ss://, vmess://, vless://, trojan://, hysteria2://, hy2://, tuic://, socks5://, http://
 */
export function parseNodeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  
  if (trimmed.startsWith('vless://')) return parseVless(trimmed);
  if (trimmed.startsWith('vmess://')) return parseVmess(trimmed);
  if (trimmed.startsWith('trojan://')) return parseTrojan(trimmed);
  if (trimmed.startsWith('ss://')) return parseShadowsocks(trimmed);
  if (trimmed.startsWith('hysteria2://') || trimmed.startsWith('hy2://')) return parseHysteria2(trimmed);
  if (trimmed.startsWith('tuic://')) return parseTuic(trimmed);
  if (trimmed.startsWith('socks5://') || trimmed.startsWith('socks://')) return parseSocks(trimmed);
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return parseHttp(trimmed);
  
  return null;
}

function parseVless(url) {
  try {
    const hashIdx = url.lastIndexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(url.slice(hashIdx + 1)) : 'VLESS';
    const body = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    
    const atIdx = body.lastIndexOf('@');
    if (atIdx < 0) return null;
    
    const uuid = body.slice(8, atIdx);
    const rest = body.slice(atIdx + 1);
    const qIdx = rest.indexOf('?');
    const hostPort = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
    const query = qIdx >= 0 ? new URLSearchParams(rest.slice(qIdx + 1)) : new URLSearchParams();
    
    const colonIdx = hostPort.lastIndexOf(':');
    const server = colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort;
    const port = colonIdx >= 0 ? parseInt(hostPort.slice(colonIdx + 1), 10) : 443;
    
    return {
      type: 'vless', name, server, port, uuid,
      sni: query.get('sni') || query.get('host') || '',
      host: query.get('host') || server,
      path: query.get('path') || '/',
      fp: query.get('fp') || '',
      flow: query.get('flow') || '',
      tls: query.get('security') === 'tls' || port === 443,
      network: query.get('type') || 'tcp',
      url
    };
  } catch { return null; }
}

function parseVmess(url) {
  try {
    const b64 = url.slice(8);
    const jsonStr = decodeURIComponent(escape(atob(b64)));
    const obj = JSON.parse(jsonStr);
    
    return {
      type: 'vmess',
      name: obj.ps || obj.id || 'VMess',
      server: obj.add || obj.host || '',
      port: parseInt(obj.port, 10) || 443,
      uuid: obj.id || '',
      alterId: parseInt(obj.aid, 10) || 0,
      cipher: obj.scy || 'auto',
      sni: obj.sni || obj.host || '',
      host: obj.host || '',
      path: obj.path || '/',
      tls: obj.tls === 'tls',
      network: obj.net || 'tcp',
      url
    };
  } catch { return null; }
}

function parseTrojan(url) {
  try {
    const hashIdx = url.lastIndexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(url.slice(hashIdx + 1)) : 'Trojan';
    const body = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    
    const atIdx = body.lastIndexOf('@');
    if (atIdx < 0) return null;
    
    const password = body.slice(9, atIdx);
    const rest = body.slice(atIdx + 1);
    const qIdx = rest.indexOf('?');
    const hostPort = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
    const query = qIdx >= 0 ? new URLSearchParams(rest.slice(qIdx + 1)) : new URLSearchParams();
    
    const colonIdx = hostPort.lastIndexOf(':');
    const server = colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort;
    const port = colonIdx >= 0 ? parseInt(hostPort.slice(colonIdx + 1), 10) : 443;
    
    return {
      type: 'trojan', name, server, port, password,
      sni: query.get('sni') || '',
      host: query.get('host') || server,
      path: query.get('path') || '/',
      fp: query.get('fp') || '',
      tls: true,
      network: query.get('type') || 'tcp',
      url
    };
  } catch { return null; }
}

function parseShadowsocks(url) {
  try {
    const hashIdx = url.lastIndexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(url.slice(hashIdx + 1)) : 'SS';
    const body = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    
    const atIdx = body.lastIndexOf('@');
    if (atIdx < 0) return null;
    
    const methodAndPass = body.slice(5, atIdx);
    const rest = body.slice(atIdx + 1);
    
    const colonIdx = rest.lastIndexOf(':');
    const server = colonIdx >= 0 ? rest.slice(0, colonIdx) : rest;
    const port = colonIdx >= 0 ? parseInt(rest.slice(colonIdx + 1), 10) : 443;
    
    let method = 'aes-256-gcm', password = '';
    const passIdx = methodAndPass.indexOf(':');
    if (passIdx >= 0) {
      method = methodAndPass.slice(0, passIdx);
      password = methodAndPass.slice(passIdx + 1);
    } else {
      try {
        const decoded = atob(methodAndPass);
        const pIdx = decoded.indexOf(':');
        if (pIdx >= 0) { method = decoded.slice(0, pIdx); password = decoded.slice(pIdx + 1); }
      } catch { password = methodAndPass; }
    }
    
    return { type: 'ss', name, server, port, cipher: method, password, url };
  } catch { return null; }
}

function parseHysteria2(url) {
  try {
    const proto = url.startsWith('hy2://') ? 'hy2://' : 'hysteria2://';
    const hashIdx = url.lastIndexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(url.slice(hashIdx + 1)) : 'Hysteria2';
    const body = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    
    const atIdx = body.lastIndexOf('@');
    if (atIdx < 0) return null;
    
    const password = body.slice(proto.length, atIdx);
    const rest = body.slice(atIdx + 1);
    const qIdx = rest.indexOf('?');
    const hostPort = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
    const query = qIdx >= 0 ? new URLSearchParams(rest.slice(qIdx + 1)) : new URLSearchParams();
    
    const colonIdx = hostPort.lastIndexOf(':');
    const server = colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort;
    const port = colonIdx >= 0 ? parseInt(hostPort.slice(colonIdx + 1), 10) : 443;
    
    return {
      type: 'hysteria2', name, server, port, password,
      sni: query.get('sni') || '',
      insecure: query.get('insecure') === '1',
      url
    };
  } catch { return null; }
}

function parseTuic(url) {
  try {
    const hashIdx = url.lastIndexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(url.slice(hashIdx + 1)) : 'TUIC';
    const body = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    
    const atIdx = body.lastIndexOf('@');
    if (atIdx < 0) return null;
    
    const password = body.slice(7, atIdx);
    const rest = body.slice(atIdx + 1);
    const qIdx = rest.indexOf('?');
    const hostPort = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
    const query = qIdx >= 0 ? new URLSearchParams(rest.slice(qIdx + 1)) : new URLSearchParams();
    
    const colonIdx = hostPort.lastIndexOf(':');
    const server = colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort;
    const port = colonIdx >= 0 ? parseInt(hostPort.slice(colonIdx + 1), 10) : 443;
    
    return {
      type: 'tuic', name, server, port, password,
      sni: query.get('sni') || '',
      congestionControl: query.get('congestion_control') || 'bbr',
      url
    };
  } catch { return null; }
}

function parseSocks(url) {
  try {
    const proto = url.startsWith('socks5://') ? 'socks5' : 'socks';
    const hashIdx = url.lastIndexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(url.slice(hashIdx + 1)) : 'SOCKS';
    const body = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    
    const afterProto = body.slice(proto.length + 3);
    const colonIdx = afterProto.lastIndexOf(':');
    const server = colonIdx >= 0 ? afterProto.slice(0, colonIdx) : afterProto;
    const port = colonIdx >= 0 ? parseInt(afterProto.slice(colonIdx + 1), 10) : 1080;
    
    return { type: proto, name, server, port, url };
  } catch { return null; }
}

function parseHttp(url) {
  try {
    const isHttps = url.startsWith('https://');
    const hashIdx = url.lastIndexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(url.slice(hashIdx + 1)) : 'HTTP';
    const body = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
    
    const parsed = new URL(body);
    return {
      type: isHttps ? 'https' : 'http',
      name,
      server: parsed.hostname,
      port: parseInt(parsed.port, 10) || (isHttps ? 443 : 80),
      url
    };
  } catch { return null; }
}

/**
 * Parse a subscription URL and return list of parsed nodes
 */
export function parseSubscription(content) {
  if (!content) return [];
  
  let text = content;
  try { text = decodeURIComponent(escape(atob(content.trim()))); } catch {}
  
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(parseNodeUrl)
    .filter(Boolean);
}
