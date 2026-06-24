import { describe, expect, it } from 'vitest'

import { sortByPartyOrder } from '@/utils/partyOrder'

describe('party order', () => {
  it('uses the canonical political order', () => {
    const unordered = [
      { code: 'junts' },
      { code: 'gil' },
      { code: 'pp' },
      { code: 'puff' },
      { code: 'vox' },
      { code: 'pisoe' },
    ]

    expect(sortByPartyOrder(unordered).map((party) => party.code)).toEqual(['pp', 'pisoe', 'vox', 'puff', 'gil', 'junts'])
  })
})
