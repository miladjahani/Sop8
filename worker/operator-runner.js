/**
 * Operator Runner — Node transformation pipeline
 * Inspired by MiSub's operator-runner.js
 */

import { extractRegion } from './geo-utils.js';

/**
 * Run a chain of operators on nodes
 */
export function runOperatorChain(nodes, operators) {
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

/**
 * Filter operator — filter by name pattern, protocol, or region
 */
function opFilter(nodes, params) {
  if (!params) return nodes;
  const { include, exclude, protocols, regions } = params;
  let result = [...nodes];
  
  if (include?.enabled && include.rules?.length) {
    const rules = normalizeRules(include.rules);
    result = result.filter(n => rules.some(r => matchRule(n.name, r)));
  }
  
  if (exclude?.enabled && exclude.rules?.length) {
    const rules = normalizeRules(exclude.rules);
    result = result.filter(n => !rules.some(r => matchRule(n.name, r)));
  }
  
  if (protocols?.enabled && protocols.values?.length) {
    const allowed = new Set(protocols.values.map(p => p.toLowerCase()));
    result = result.filter(n => allowed.has((n.type || '').toLowerCase()));
  }
  
  if (regions?.enabled && regions.values?.length) {
    const allowed = new Set(regions.values);
    result = result.filter(n => {
      const { region } = extractRegion(n.name);
      return allowed.has(region);
    });
  }
  
  return result;
}

/**
 * Sort operator — sort by name, server, port, protocol, or region
 */
function opSort(nodes, params) {
  if (!params?.keys?.length) return nodes;
  const result = [...nodes];
  
  result.sort((a, b) => {
    for (const { key, order = 'asc' } of params.keys) {
      let va, vb;
      switch (key) {
        case 'name': va = a.name || ''; vb = b.name || ''; break;
        case 'server': va = a.server || ''; vb = b.server || ''; break;
        case 'port': va = a.port || 0; vb = b.port || 0; break;
        case 'protocol': va = a.type || ''; vb = b.type || ''; break;
        case 'region': {
          const ra = extractRegion(a.name);
          const rb = extractRegion(b.name);
          va = ra.region; vb = rb.region;
          break;
        }
        default: va = ''; vb = '';
      }
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
  
  return result;
}

/**
 * Dedup operator — remove duplicate nodes by server+port or name
 */
function opDedup(nodes, params) {
  if (!params) return nodes;
  const { mode = 'serverPort', includeProtocol = false } = params;
  const seen = new Set();
  
  return nodes.filter(n => {
    let key;
    switch (mode) {
      case 'serverPort':
        key = `${n.server}:${n.port}`;
        if (includeProtocol) key = `${n.type}:${key}`;
        break;
      case 'name':
        key = n.name;
        break;
      default:
        key = `${n.server}:${n.port}`;
    }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Rename operator — regex replace or template-based rename
 */
function opRename(nodes, params) {
  if (!params) return nodes;
  const { regex, template } = params;
  let result = [...nodes];
  
  if (regex?.enabled && regex.rules?.length) {
    const rules = normalizeRules(regex.rules);
    result = result.map(n => {
      let newName = n.name;
      for (const rule of rules) {
        try {
          const [pattern, replacement] = parseRegexRule(rule);
          newName = newName.replace(pattern, replacement || '');
        } catch {}
      }
      return newName !== n.name ? { ...n, name: newName } : n;
    });
  }
  
  if (template?.enabled && template.template) {
    let idx = template.offset || 1;
    result = result.map(n => {
      const { region, emoji } = extractRegion(n.name);
      const tpl = template.template
        .replace('{emoji}', emoji)
        .replace('{region}', region)
        .replace('{protocol}', n.type || '')
        .replace('{index}', String(idx).padStart(2, '0'))
        .replace('{server}', n.server || '')
        .replace('{port}', String(n.port || ''));
      idx++;
      return { ...n, name: tpl };
    });
  }
  
  return result;
}

// ─── Helpers ───

function normalizeRules(rules) {
  if (!rules) return [];
  if (typeof rules === 'string') return rules.split('\n').filter(Boolean);
  if (!Array.isArray(rules)) return [];
  return rules.map(r => typeof r === 'string' ? r : r.pattern || r.regex || '').filter(Boolean);
}

function matchRule(text, rule) {
  if (!text || !rule) return false;
  try {
    const regex = new RegExp(rule, 'i');
    return regex.test(text);
  } catch {
    return text.toLowerCase().includes(rule.toLowerCase());
  }
}

function parseRegexRule(rule) {
  if (typeof rule === 'object') {
    return [new RegExp(rule.pattern || '', rule.flags || 'gi'), rule.replacement || ''];
  }
  if (typeof rule === 'string') {
    const parts = rule.split('/');
    if (parts.length >= 3) {
      const pattern = parts.slice(1, -1).join('/');
      const flags = parts[parts.length - 1];
      return [new RegExp(pattern, flags), ''];
    }
    return [new RegExp(rule, 'gi'), ''];
  }
  return [new RegExp('', ''), ''];
}
