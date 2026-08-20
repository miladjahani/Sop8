export function toClashMeta(nodes, groupName = 'PROXIES', exitProxy = null) {
  const proxies = nodes.map(n => {
    if (n.protocol === 'vless') {
      return {
        name: n.name,
        type: 'vless',
        server: n.address,
        port: parseInt(n.port, 10),
        uuid: n.auth,
        udp: true,
        tls: n.security === 'tls' || n.security === 'reality',
        servername: n.sni || n.host,
        'reality-opts': n.security === 'reality' ? { 'public-key': n.pbk, 'short-id': n.sid } : undefined,
        'client-fingerprint': n.fp || 'chrome',
        network: n.type || 'ws',
        'ws-opts': n.type === 'ws' ? { path: n.path, headers: { Host: n.host } } : undefined,
        'grpc-opts': n.type === 'grpc' ? { 'grpc-service-name': n.path } : undefined
      };
    }
    if (n.protocol === 'trojan') {
      return {
        name: n.name,
        type: 'trojan',
        server: n.address,
        port: parseInt(n.port, 10),
        password: n.auth,
        udp: true,
        sni: n.sni || n.host,
        network: n.type || 'ws',
        'ws-opts': n.type === 'ws' ? { path: n.path, headers: { Host: n.host } } : undefined
      };
    }
    if (n.protocol === 'vmess') {
      return {
        name: n.name,
        type: 'vmess',
        server: n.address,
        port: parseInt(n.port, 10),
        uuid: n.auth,
        alterId: n.aid || 0,
        cipher: 'auto',
        udp: true,
        tls: n.security === 'tls',
        servername: n.sni || n.host,
        network: n.type || 'ws',
        'ws-opts': n.type === 'ws' ? { path: n.path, headers: { Host: n.host } } : undefined
      };
    }
    if (n.protocol === 'hysteria2') {
      return {
        name: n.name,
        type: 'hysteria2',
        server: n.address,
        port: parseInt(n.port, 10),
        password: n.auth,
        sni: n.sni || n.address,
        'skip-cert-verify': true
      };
    }
    return null;
  }).filter(Boolean);

  const proxyNames = proxies.map(p => p.name);

  // Real Clash Meta "exit proxy" chain — the correct direction: the
  // country HTTP/SOCKS proxy is the FINAL hop that all your internet
  // traffic actually exits from, and it reaches the outside world by
  // tunneling its own connection through your VLESS/Trojan nodes
  // (via 'dialer-proxy' pointing at the AUTO url-test group) — this
  // is what lets a foreign/otherwise-unreachable proxy be dialed
  // through your working, censorship-resistant tunnel. Selecting this
  // proxy as your active outbound means literally ALL of your traffic
  // (کل ترافیک اینترنت) exits from that proxy's IP/country, not just
  // the handshake to reach the VPN node.
  let exitProxyEntry = null;
  if (exitProxy) {
    exitProxyEntry = {
      name: exitProxy.name,
      type: exitProxy.type, // 'http' | 'socks5'
      server: exitProxy.server,
      port: exitProxy.port,
      username: exitProxy.username || undefined,
      password: exitProxy.password || undefined,
      'dialer-proxy': 'AUTO'
    };
  }

  const allProxies = exitProxyEntry ? [...proxies, exitProxyEntry] : proxies;

  // The exit proxy (if present) is listed FIRST in the selectable group,
  // which Clash Meta clients select by default on first import — so out
  // of the box, all traffic really does route through the chosen
  // country's IP, exactly as requested. The individual VLESS/Trojan
  // nodes remain selectable too, in case the user wants direct exit
  // (no country override) instead.
  const selectableNames = exitProxyEntry ? [exitProxyEntry.name, ...proxyNames] : proxyNames;

  return `port: 7890
socks-port: 7891
allow-lan: true
mode: rule
log-level: info
ipv6: false
external-controller: 127.0.0.1:9090
proxies:
${JSON.stringify(allProxies, null, 2)}
proxy-groups:
  - name: ${groupName}
    type: select
    proxies:
${selectableNames.map(p => `      - "${p}"`).join('\n')}
      - DIRECT
  - name: AUTO
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${proxyNames.map(p => `      - "${p}"`).join('\n')}
rules:
  - MATCH,${groupName}
`;
}
