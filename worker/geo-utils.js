/**
 * Geo Utilities — Region detection & emoji flags
 * Inspired by MiSub's geo-utils.js
 */

const REGION_KEYWORDS = {
  '香港': ['HK', 'HKG', 'HKT', '香港', 'Hong Kong', 'HongKong'],
  '台湾': ['TW', 'TPE', '台湾', '台北', 'Taiwan', 'Taipei'],
  '新加坡': ['SG', 'SIN', '新加坡', 'Singapore'],
  '日本': ['JP', 'JPN', 'NRT', 'HND', 'KIX', 'FUK', '东京', '大阪', '日本', 'Japan', 'Tokyo', 'Osaka'],
  '美国': ['US', 'USA', 'LAX', 'SFO', 'SEA', 'JFK', 'NYC', '美国', 'United States', 'America', 'Los Angeles', 'New York'],
  '韩国': ['KR', 'KOR', 'ICN', '韩国', '首尔', 'Korea', 'Seoul'],
  '英国': ['UK', 'GB', 'LHR', '英国', 'Britain', 'London', '伦敦'],
  '德国': ['DE', 'DEU', 'FRA', '德国', 'Germany', 'Frankfurt', 'Berlin'],
  '法国': ['FR', 'CDG', '法国', 'France', 'Paris', '巴黎'],
  '加拿大': ['CA', 'CAN', 'YVR', 'YYZ', '加拿大', 'Canada', 'Toronto', 'Vancouver'],
  '澳大利亚': ['AU', 'AUS', 'SYD', 'MEL', '澳大利亚', 'Australia', 'Sydney', 'Melbourne'],
  '荷兰': ['NL', 'NLD', 'AMS', '荷兰', 'Netherlands', 'Amsterdam'],
  '俄罗斯': ['RU', 'RUS', 'SVO', 'DME', '俄罗斯', 'Russia', 'Moscow'],
  '印度': ['IN', 'IND', 'BOM', 'DEL', '印度', 'India', 'Mumbai', 'Delhi'],
  '土耳其': ['TR', 'TUR', 'IST', '土耳其', 'Turkey', 'Istanbul'],
  '马来西亚': ['MY', 'MYS', 'KUL', '马来西亚', 'Malaysia', 'Kuala Lumpur'],
  '泰国': ['TH', 'THA', 'BKK', '泰国', 'Thailand', 'Bangkok'],
  '越南': ['VN', 'VNM', 'SGN', '越南', 'Vietnam', 'Ho Chi Minh'],
  '巴西': ['BR', 'BRA', 'GRU', '巴西', 'Brazil', 'São Paulo'],
  '意大利': ['IT', 'ITA', 'FCO', '意大利', 'Italy', 'Rome', 'Milan'],
  '西班牙': ['ES', 'ESP', 'MAD', '西班牙', 'Spain', 'Madrid'],
  '瑞士': ['CH', 'CHE', 'ZRH', '瑞士', 'Switzerland', 'Zurich'],
  '波兰': ['PL', 'POL', 'WAW', '波兰', 'Poland', 'Warsaw'],
  '瑞典': ['SE', 'SWE', 'ARN', '瑞典', 'Sweden', 'Stockholm'],
  '挪威': ['NO', 'NOR', 'OSL', '挪威', 'Norway', 'Oslo'],
  '丹麦': ['DK', 'DNK', 'CPH', '丹麦', 'Denmark', 'Copenhagen'],
  '芬兰': ['FI', 'FIN', 'HEL', '芬兰', 'Finland', 'Helsinki'],
  '奥地利': ['AT', 'AUT', 'VIE', '奥地利', 'Austria', 'Vienna'],
  '阿联酋': ['AE', 'ARE', 'DXB', 'UAE', 'Dubai', '迪拜'],
  '沙特': ['SA', 'SAU', 'RUH', '沙特', 'Saudi Arabia', 'Riyadh'],
  '以色列': ['IL', 'ISR', 'TLV', '以色列', 'Israel', 'Tel Aviv'],
  '南非': ['ZA', 'ZAF', 'JNB', '南非', 'South Africa', 'Johannesburg'],
  '墨西哥': ['MX', 'MEX', '墨西哥', 'Mexico', 'Mexico City'],
  '阿根廷': ['AR', 'ARG', 'EZE', '阿根廷', 'Argentina', 'Buenos Aires'],
  '哥伦比亚': ['CO', 'COL', 'BOG', '哥伦比亚', 'Colombia', 'Bogota'],
  '埃及': ['EG', 'EGY', 'CAI', '埃及', 'Egypt', 'Cairo'],
  '菲律宾': ['PH', 'PHL', 'MNL', '菲律宾', 'Philippines', 'Manila'],
  '印尼': ['ID', 'IDN', 'CGK', '印尼', '印度尼西亚', 'Indonesia', 'Jakarta'],
  '孟加拉': ['BD', 'BGD', 'DAC', '孟加拉', 'Bangladesh', 'Dhaka'],
  '巴基斯坦': ['PK', 'PAK', 'ISB', '巴基斯坦', 'Pakistan', 'Islamabad'],
};

const REGION_EMOJI = {
  '香港': '🇭🇰', '台湾': '🇹🇼', '新加坡': '🇸🇬', '日本': '🇯🇵',
  '美国': '🇺🇸', '韩国': '🇰🇷', '英国': '🇬🇧', '德国': '🇩🇪',
  '法国': '🇫🇷', '加拿大': '🇨🇦', '澳大利亚': '🇦🇺', '荷兰': '🇳🇱',
  '俄罗斯': '🇷🇺', '印度': '🇮🇳', '土耳其': '🇹🇷', '马来西亚': '🇲🇾',
  '泰国': '🇹🇭', '越南': '🇻🇳', '巴西': '🇧🇷', '意大利': '🇮🇹',
  '西班牙': '🇪🇸', '瑞士': '🇨🇭', '波兰': '🇵🇱', '瑞典': '🇸🇪',
  '挪威': '🇳🇴', '丹麦': '🇩🇰', '芬兰': '🇫🇮', '奥地利': '🇦🇹',
  '阿联酋': '🇦🇪', '沙特': '🇸🇦', '以色列': '🇮🇱', '南非': '🇿🇦',
  '墨西哥': '🇲🇽', '阿根廷': '🇦🇷', '哥伦比亚': '🇨🇴', '埃及': '🇪🇬',
  '菲律宾': '🇵🇭', '印尼': '🇮🇩', '孟加拉': '🇧🇩', '巴基斯坦': '🇵🇰',
};

const COUNTRY_CODE_TO_EMOJI = {
  HK: '🇭🇰', TW: '🇹🇼', SG: '🇸🇬', JP: '🇯🇵', US: '🇺🇸', KR: '🇰🇷',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', CA: '🇨🇦', AU: '🇦🇺', NL: '🇳🇱',
  RU: '🇷🇺', IN: '🇮🇳', TR: '🇹🇷', MY: '🇲🇾', TH: '🇹🇭', VN: '🇻🇳',
  BR: '🇧🇷', IT: '🇮🇹', ES: '🇪🇸', CH: '🇨🇭', PL: '🇵🇱', SE: '🇸🇪',
  NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', AT: '🇦🇹', AE: '🇦🇪', SA: '🇸🇦',
  IL: '🇮🇱', ZA: '🇿🇦', MX: '🇲🇽', AR: '🇦🇷', CO: '🇨🇴', EG: '🇪🇬',
  PH: '🇵🇭', ID: '🇮🇩', BD: '🇧🇩', PK: '🇵🇰', UA: '🇺🇦', CZ: '🇨🇿',
  RO: '🇷🇴', HU: '🇭🇺', PT: '🇵🇹', GR: '🇬🇷', IE: '🇮🇪', NZ: '🇳🇿',
  CL: '🇨🇱', PE: '🇵🇪',
};

/**
 * Extract region from a node name
 */
export function extractRegion(name) {
  if (!name) return { region: '未知', emoji: '🌍' };
  
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const kw of keywords) {
      if (name.includes(kw)) {
        return { region, emoji: REGION_EMOJI[region] || '🌍' };
      }
    }
  }
  
  return { region: '未知', emoji: '🌍' };
}

/**
 * Country code to emoji flag
 */
export function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return COUNTRY_CODE_TO_EMOJI[code.toUpperCase()] || '🌍';
}

/**
 * Get all unique regions from a list of node names
 */
export function getUniqueRegions(nodeNames) {
  const regions = new Set();
  for (const name of nodeNames) {
    const { region } = extractRegion(name);
    if (region !== '未知') regions.add(region);
  }
  return [...regions].sort();
}
