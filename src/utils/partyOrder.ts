export const partyOrder = ['pp', 'pisoe', 'vox', 'puff', 'gil', 'junts'] as const

const partyOrderMap = new Map<string, number>(partyOrder.map((code, index) => [code, index]))

export function partyOrderIndex(code?: string | null) {
  if (!code) return Number.MAX_SAFE_INTEGER
  return partyOrderMap.get(code) ?? Number.MAX_SAFE_INTEGER
}

export function comparePartyCodes(a?: string | null, b?: string | null) {
  return partyOrderIndex(a) - partyOrderIndex(b) || (a ?? '').localeCompare(b ?? '', 'es')
}

export function sortByPartyOrder<T extends { code: string }>(items: T[]) {
  return [...items].sort((a, b) => comparePartyCodes(a.code, b.code))
}
