interface EventVisual {
  mark: string
  accent: string
  secondary: string
  path: string
}

const visuals: Record<string, EventVisual> = {
  'evento-dana': { mark: 'DANA', accent: '#62c7d7', secondary: '#244f62', path: 'M88 150 C130 90 210 92 240 142 C282 134 326 158 334 204 H74 C56 184 64 164 88 150Z' },
  'evento-terremoto': { mark: 'SIS', accent: '#d39162', secondary: '#654230', path: 'M80 206 L126 118 L160 176 L198 86 L232 178 L272 112 L342 206Z' },
  'evento-apagon': { mark: 'OFF', accent: '#e7d26e', secondary: '#665c2d', path: 'M202 48 L132 158 H194 L172 224 L288 106 H220Z' },
  'evento-pandemia': { mark: 'BIO', accent: '#9ed486', secondary: '#496d3f', path: 'M210 82 A72 72 0 1 0 211 82 M210 48 V18 M210 242 V212 M96 130 H66 M354 130 H324 M128 48 L148 70 M292 212 L272 190 M292 48 L272 70 M128 212 L148 190' },
  'evento-incendios': { mark: 'FUE', accent: '#df7650', secondary: '#713529', path: 'M212 222 C150 194 164 142 196 104 C200 142 238 134 226 76 C288 132 300 184 212 222Z' },
  'evento-sequia': { mark: 'SEC', accent: '#d2b061', secondary: '#6d5a31', path: 'M210 50 C258 116 300 154 300 190 C300 222 260 238 210 238 C160 238 120 222 120 190 C120 154 162 116 210 50Z' },
  'evento-ciberataque': { mark: '500', accent: '#86b8e6', secondary: '#324e70', path: 'M94 74 H326 V196 H94Z M122 112 H298 M122 150 H242' },
  'evento-suministros': { mark: 'LOG', accent: '#d7aa58', secondary: '#715430', path: 'M76 144 H270 V196 H76Z M270 162 H330 L352 196 H270Z M116 204 A18 18 0 1 0 117 204 M300 204 A18 18 0 1 0 301 204' },
  'evento-inflacion': { mark: 'IPC', accent: '#d9c66c', secondary: '#686034', path: 'M96 206 H326 M122 176 L184 114 L232 146 L310 70 M272 70 H310 V108' },
  'evento-boe': { mark: 'BOE', accent: '#c4b6df', secondary: '#5b4d72', path: 'M118 54 H286 L322 90 V220 H118Z M286 54 V90 H322 M148 124 H292 M148 154 H292 M148 184 H250' },
}

const cache = new Map<string, string>()

export function eventImage(imageKey: string) {
  const cached = cache.get(imageKey)
  if (cached) return cached

  const visual = visuals[imageKey] ?? visuals['evento-boe']!
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" role="img" aria-label="Evento ${visual.mark}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#18211d"/>
      <stop offset="1" stop-color="#070b09"/>
    </linearGradient>
    <linearGradient id="signal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${visual.accent}"/>
      <stop offset="1" stop-color="${visual.secondary}"/>
    </linearGradient>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="${visual.accent}" flood-opacity=".36"/>
      <feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#000" flood-opacity=".48"/>
    </filter>
  </defs>
  <rect width="420" height="260" fill="url(#bg)"/>
  <path d="M0 188 C88 154 144 220 226 174 C286 140 342 150 420 116 V260 H0Z" fill="#111b17"/>
  <g opacity=".2" stroke="${visual.accent}" stroke-width="1">
    <path d="M28 54 H392"/><path d="M28 106 H392"/><path d="M28 158 H392"/><path d="M28 210 H392"/>
    <path d="M70 24 V238"/><path d="M146 24 V238"/><path d="M222 24 V238"/><path d="M298 24 V238"/>
  </g>
  <g filter="url(#shadow)">
    <path d="${visual.path}" fill="url(#signal)" stroke="#fff0bd" stroke-opacity=".4" stroke-width="4"/>
    <rect x="132" y="108" width="156" height="62" rx="4" fill="#0d1311" stroke="${visual.accent}" stroke-width="2" opacity=".86"/>
    <text x="210" y="147" text-anchor="middle" fill="#fff3c8" font-family="Arial, sans-serif" font-size="26" font-weight="900">${visual.mark}</text>
  </g>
</svg>`.trim()
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  cache.set(imageKey, url)
  return url
}
