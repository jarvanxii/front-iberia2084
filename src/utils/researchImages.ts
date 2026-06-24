interface ResearchVisual {
  mark: string
  accent: string
  secondary: string
  symbol: string
}

const visuals: Record<string, ResearchVisual> = {
  'investigacion-argumentario-24h': { mark: 'ARG', accent: '#d7b75b', secondary: '#655332', symbol: 'M116 82 H304 V178 H116Z M142 112 H278 M142 138 H250' },
  'investigacion-brigada-rotondas': { mark: 'ROT', accent: '#cfa15a', secondary: '#645139', symbol: 'M210 76 A58 58 0 1 0 211 76 M210 106 A28 28 0 1 0 211 106' },
  'investigacion-boe-predictivo': { mark: 'BOE', accent: '#c5b8df', secondary: '#5d5172', symbol: 'M136 60 H270 L306 96 V204 H136Z M270 60 V96 H306 M160 126 H282 M160 154 H282' },
  'investigacion-relato-avanzado': { mark: 'REL', accent: '#80cbd0', secondary: '#315d64', symbol: 'M122 128 C154 82 220 82 250 128 C276 124 306 142 316 176 H104 C94 150 102 134 122 128Z' },
  'investigacion-siesta-logistica': { mark: 'SIE', accent: '#9dca82', secondary: '#53693f', symbol: 'M112 164 H308 M142 164 V116 H270 V164 M160 108 H252' },
  'investigacion-pp-auditoria-pulcra': { mark: 'PP', accent: '#65a7de', secondary: '#284f70', symbol: 'M126 94 H294 M150 94 V182 M210 94 V182 M270 94 V182 M126 186 H294' },
  'investigacion-pisoe-subvencion-circular': { mark: 'PIS', accent: '#df6b67', secondary: '#71302f', symbol: 'M210 72 A64 64 0 1 0 274 136 M274 136 H244 M274 136 V106' },
  'investigacion-gil-grua-prioritaria': { mark: 'GIL', accent: '#e2b64d', secondary: '#72582b', symbol: 'M118 90 H286 M146 90 V194 M146 118 H250 L286 150 M250 118 V92' },
  'investigacion-puff-asamblea-resistencia': { mark: 'PUF', accent: '#b489da', secondary: '#57416e', symbol: 'M124 92 H296 V168 H124Z M154 196 H266 M180 168 V196 M240 168 V196' },
  'investigacion-vox-corneta-movilizacion': { mark: 'VOX', accent: '#88ca52', secondary: '#416629', symbol: 'M126 130 L258 84 V176Z M258 104 L304 88 V172 L258 156Z' },
  'investigacion-junts-peaje-negociador': { mark: 'JUN', accent: '#69c7cc', secondary: '#2b6066', symbol: 'M112 138 H308 M138 108 H282 M164 78 H256 M146 168 H274' },
}

const cache = new Map<string, string>()

export function researchImage(imageKey: string) {
  const cached = cache.get(imageKey)
  if (cached) return cached

  const visual = visuals[imageKey] ?? visuals['investigacion-argumentario-24h']!
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" role="img" aria-label="Investigación ${visual.mark}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b241f"/>
      <stop offset="1" stop-color="#080c0a"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${visual.accent}"/>
      <stop offset="1" stop-color="${visual.secondary}"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="${visual.accent}" flood-opacity=".34"/>
      <feDropShadow dx="0" dy="14" stdDeviation="9" flood-color="#000" flood-opacity=".44"/>
    </filter>
  </defs>
  <rect width="420" height="260" fill="url(#bg)"/>
  <path d="M0 210 C72 180 132 212 210 176 C284 142 348 160 420 122 V260 H0Z" fill="#101915"/>
  <g opacity=".18" stroke="${visual.accent}" stroke-width="1">
    <path d="M36 54 H384"/><path d="M36 106 H384"/><path d="M36 158 H384"/><path d="M36 210 H384"/>
    <path d="M88 26 V236"/><path d="M168 26 V236"/><path d="M248 26 V236"/><path d="M328 26 V236"/>
  </g>
  <g filter="url(#glow)">
    <rect x="84" y="46" width="252" height="168" rx="6" fill="#0d1411" stroke="${visual.accent}" stroke-width="3"/>
    <path d="${visual.symbol}" fill="none" stroke="url(#panel)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="144" y="170" width="132" height="44" rx="4" fill="url(#panel)" stroke="#fff0bd" stroke-opacity=".32"/>
    <text x="210" y="199" text-anchor="middle" fill="#fff5d0" font-family="Arial, sans-serif" font-size="25" font-weight="900">${visual.mark}</text>
  </g>
</svg>`.trim()
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  cache.set(imageKey, url)
  return url
}
