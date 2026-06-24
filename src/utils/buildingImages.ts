interface BuildingVisual {
  mark: string
  accent: string
  secondary: string
  kind: 'dome' | 'office' | 'press' | 'studio' | 'archive' | 'market' | 'plaza' | 'crisis' | 'antenna' | 'garage' | 'fiesta' | 'mayor' | 'print' | 'school' | 'logistics' | 'radar' | 'tribunal' | 'bank' | 'port' | 'air'
}

const visuals: Record<string, BuildingVisual> = {
  'palacio-plenos': { mark: 'PL', accent: '#d9b557', secondary: '#776339', kind: 'dome' },
  'oficina-infinita': { mark: 'OF', accent: '#84b6a4', secondary: '#3b6258', kind: 'office' },
  'redaccion-subvencionada': { mark: 'RS', accent: '#e2bf64', secondary: '#6b4b34', kind: 'press' },
  'plato-24h': { mark: '24', accent: '#73b6d2', secondary: '#284f66', kind: 'studio' },
  'archivo-boe': { mark: 'BOE', accent: '#c5bfa4', secondary: '#57564e', kind: 'archive' },
  'mercado-favores': { mark: 'FV', accent: '#d38f5d', secondary: '#714630', kind: 'market' },
  'plaza-promesas': { mark: 'PR', accent: '#d7c46b', secondary: '#746a36', kind: 'plaza' },
  'centro-crisis': { mark: 'CR', accent: '#d8785d', secondary: '#673b35', kind: 'crisis' },
  'antena-relato': { mark: 'AR', accent: '#8ccfd0', secondary: '#315c64', kind: 'antenna' },
  'garaje-rotondas': { mark: 'GR', accent: '#c49a52', secondary: '#5f553d', kind: 'garage' },
  'concejalia-festejos': { mark: 'CF', accent: '#cc8ec6', secondary: '#634260', kind: 'fiesta' },
  'alcaldia-perpetua': { mark: 'AP', accent: '#e1c15e', secondary: '#655033', kind: 'mayor' },
  'imprenta-argumentarios': { mark: 'IA', accent: '#d4d0bd', secondary: '#5d5c54', kind: 'print' },
  'escuela-cuadros': { mark: 'EC', accent: '#98c481', secondary: '#4d6840', kind: 'school' },
  'centro-logistica': { mark: 'CL', accent: '#d6a856', secondary: '#684d2f', kind: 'logistics' },
  'observatorio-rumor': { mark: 'OR', accent: '#83bdd8', secondary: '#304f68', kind: 'radar' },
  'tribunal-cuentas-flexible': { mark: 'TC', accent: '#b8bec8', secondary: '#545d68', kind: 'tribunal' },
  'banco-obras-promesas': { mark: 'BP', accent: '#d5bc67', secondary: '#675b36', kind: 'bank' },
  'puerto-comitivas': { mark: 'PC', accent: '#6fbcc8', secondary: '#245a63', kind: 'port' },
  'aerodromo-ruedas-prensa': { mark: 'AE', accent: '#9bb7e0', secondary: '#3e5578', kind: 'air' },
}

const cache = new Map<string, string>()

export function buildingImage(imageKey: string) {
  const cached = cache.get(imageKey)
  if (cached) return cached

  const visual = visuals[imageKey] ?? { mark: 'IB', accent: '#d9b557', secondary: '#776339', kind: 'office' as const }
  const svg = buildSvg(visual)
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  cache.set(imageKey, url)
  return url
}

function buildSvg(visual: BuildingVisual) {
  const symbol = buildingSymbol(visual)
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" role="img" aria-label="Edificio ${visual.mark}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#202923"/>
      <stop offset="1" stop-color="#0a0f0d"/>
    </linearGradient>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${visual.accent}"/>
      <stop offset="1" stop-color="${visual.secondary}"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="${visual.accent}" flood-opacity=".35"/>
      <feDropShadow dx="0" dy="14" stdDeviation="8" flood-color="#000" flood-opacity=".45"/>
    </filter>
  </defs>
  <rect width="420" height="260" fill="url(#sky)"/>
  <path d="M0 190 L420 142 L420 260 L0 260 Z" fill="#101815"/>
  <path d="M0 224 C76 190 132 238 205 206 C284 171 330 194 420 164 L420 260 L0 260 Z" fill="#17221d"/>
  <g opacity=".22" stroke="${visual.accent}" stroke-width="1">
    <path d="M28 48 H392"/><path d="M28 86 H392"/><path d="M28 124 H392"/>
    <path d="M72 22 V230"/><path d="M148 22 V230"/><path d="M224 22 V230"/><path d="M300 22 V230"/>
  </g>
  <g filter="url(#glow)">
    <rect x="116" y="92" width="188" height="88" rx="4" fill="url(#face)" stroke="#f4e7b7" stroke-opacity=".45"/>
    <path d="M96 184 H324 L342 218 H78 Z" fill="#25251c" stroke="${visual.accent}" stroke-opacity=".55"/>
    <path d="M136 82 H284 L304 94 H116 Z" fill="#2c2418" stroke="${visual.accent}" stroke-opacity=".55"/>
    ${windowGrid()}
    ${symbol}
    <rect x="172" y="126" width="76" height="54" fill="#101614" stroke="#f4e7b7" stroke-opacity=".28"/>
    <text x="210" y="157" text-anchor="middle" fill="#fff4cc" font-family="Arial, sans-serif" font-size="25" font-weight="900">${visual.mark}</text>
  </g>
</svg>`.trim()
}

function windowGrid() {
  return [0, 1, 2, 3]
    .map((row) =>
      [0, 1, 2, 3].map((col) => `<rect x="${132 + col * 38}" y="${104 + row * 16}" width="18" height="7" fill="#101614" opacity=".64"/>`).join(''),
    )
    .join('')
}

function buildingSymbol(visual: BuildingVisual) {
  const stroke = `stroke="${visual.accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"`
  switch (visual.kind) {
    case 'dome':
      return `<path d="M150 88 Q210 38 270 88" fill="${visual.accent}" opacity=".42"/><rect x="156" y="74" width="108" height="12" fill="${visual.accent}"/>`
    case 'office':
      return `<path d="M306 86 V178 M326 102 V178 M346 118 V178" ${stroke} opacity=".65"/>`
    case 'press':
      return `<circle cx="314" cy="88" r="22" fill="${visual.accent}" opacity=".52"/><path d="M296 116 L344 116" ${stroke}/>`
    case 'studio':
      return `<rect x="292" y="70" width="64" height="44" rx="3" fill="#111816" stroke="${visual.accent}" stroke-width="6"/><path d="M304 132 H350" ${stroke}/>`
    case 'archive':
      return `<path d="M302 72 H350 V168 H302 Z M302 104 H350 M302 136 H350" ${stroke}/>`
    case 'market':
      return `<path d="M286 96 H362 L350 132 H298 Z M296 144 H352" ${stroke}/>`
    case 'plaza':
      return `<circle cx="326" cy="112" r="34" fill="${visual.accent}" opacity=".36"/><path d="M326 76 V148 M290 112 H362" ${stroke}/>`
    case 'crisis':
      return `<path d="M318 72 L360 146 H276 Z" fill="${visual.accent}" opacity=".38"/><path d="M318 96 V122 M318 142 V143" ${stroke}/>`
    case 'antenna':
      return `<path d="M322 170 V70 M292 98 Q322 74 352 98 M278 76 Q322 38 366 76" ${stroke}/>`
    case 'garage':
      return `<path d="M286 144 H362 V176 H286 Z M300 144 V112 H348 V144" ${stroke}/><circle cx="306" cy="176" r="9" fill="${visual.accent}"/><circle cx="342" cy="176" r="9" fill="${visual.accent}"/>`
    case 'fiesta':
      return `<path d="M292 76 L354 100 L292 124 Z" fill="${visual.accent}" opacity=".5"/><path d="M292 76 V162" ${stroke}/>`
    case 'mayor':
      return `<path d="M326 72 L354 106 H298 Z M304 106 H348 V172 H304 Z" ${stroke}/>`
    case 'print':
      return `<rect x="284" y="82" width="76" height="58" rx="4" fill="none" stroke="${visual.accent}" stroke-width="8"/><path d="M298 158 H346 M300 62 H344" ${stroke}/>`
    case 'school':
      return `<path d="M284 102 L322 76 L360 102 L322 128 Z M322 128 V170" ${stroke}/>`
    case 'logistics':
      return `<path d="M280 138 H360 V168 H280 Z M294 138 V112 H338 V138" ${stroke}/><path d="M292 96 H350" ${stroke}/>`
    case 'radar':
      return `<circle cx="324" cy="110" r="36" fill="none" stroke="${visual.accent}" stroke-width="8" opacity=".7"/><path d="M324 110 L358 88 M324 146 V172" ${stroke}/>`
    case 'tribunal':
      return `<path d="M286 96 H362 M298 96 V164 M324 96 V164 M350 96 V164 M290 166 H358" ${stroke}/>`
    case 'bank':
      return `<path d="M286 100 L324 76 L362 100 Z M296 106 V164 M324 106 V164 M352 106 V164 M286 168 H362" ${stroke}/>`
    case 'port':
      return `<path d="M326 74 V164 M292 108 H360 M302 164 Q326 188 350 164" ${stroke}/>`
    case 'air':
      return `<path d="M282 124 L362 96 L334 130 L360 154 Z" fill="${visual.accent}" opacity=".55"/><path d="M286 178 H362" ${stroke}/>`
    default:
      return ''
  }
}
