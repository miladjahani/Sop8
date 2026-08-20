export function toSingbox(nodes, frontProxy = null) {
  const outbounds = nodes.map(n => {
    if (n.protocol === 'vless') {
      return {
        type: 'vless',
        tag: n.name,
        server: n.address,
        server_port: parseInt(n.port, 10),
        uuid: n.auth,
        flow: n.flow || undefined,
        tls: {
          enabled: n.security === 'tls' || n.security === 'reality',
          server_name: n.sni || n.host,
          insecure: true,
          reality: n.security === 'reality' ? {
            enabled: true,
            public_key: n.pbk,
            short_id: n.sid
          } : undefined
        },
        transport: n.type === 'ws' ? {
          type: 'ws',
          path: n.path,
          headers: { Host: n.host }
        } : undefined,
        // Real sing-box feature: routes this outbound's TCP dial through
        // another outbound (the front proxy) first — the actual mechanism
        // that gives the node a fixed/static exit IP.
        detour: frontProxy ? frontProxy.tag : undefined
      };
    }
    if (n.protocol === 'trojan') {
      return {
        type: 'trojan',
        tag: n.name,
        server: n.address,
        server_port: parseInt(n.port, 10),
        password: n.auth,
        tls: {
          enabled: true,
          server_name: n.sni || n.host,
          insecure: true
        },
        transport: n.type === 'ws' ? {
          type: 'ws',
          path: n.path,
          headers: { Host: n.host }
        } : undefined,
        detour: frontProxy ? frontProxy.tag : undefined
      };
    }
    return null;
  }).filter(Boolean);

  // Real front-proxy outbound: a plain sing-box http/socks outbound.
  // Every node above sets `detour` to this tag, so all outbound traffic
  // physically exits through this fixed IP:port before reaching the
  // actual VPN node — a real static-IP technique, not a cosmetic label.
  const frontProxyOutbound = frontProxy ? {
    type: frontProxy.type, // 'http' | 'socks'
    tag: frontProxy.tag,
    server: frontProxy.server,
    server_port: frontProxy.port,
    username: frontProxy.username || undefined,
    password: frontProxy.password || undefined,
    version: frontProxy.type === 'socks' ? (frontProxy.socksVersion || '5') : undefined
  } : null;

  return JSON.stringify({
    log: { level: 'info', timestamp: true },
    dns: {
      servers: [
        { tag: 'google', address: 'tls://8.8.8.8' },
        { tag: 'local', address: '223.5.5.5', detour: 'direct' }
      ]
    },
    inbounds: [
      { type: 'mixed', tag: 'mixed-in', listen: '127.0.0.1', listen_port: 2080 }
    ],
    outbounds: [
      {
        type: 'selector',
        tag: 'select',
        outbounds: ['auto', ...outbounds.map(o => o.tag), 'direct']
      },
      {
        type: 'urltest',
        tag: 'auto',
        outbounds: outbounds.map(o => o.tag),
        url: 'http://www.gstatic.com/generate_204',
        interval: '3m',
        tolerance: 50
      },
      ...(frontProxyOutbound ? [frontProxyOutbound] : []),
      ...outbounds,
      { type: 'direct', tag: 'direct' },
      { type: 'block', tag: 'block' }
    ]
  }, null, 2);
}
