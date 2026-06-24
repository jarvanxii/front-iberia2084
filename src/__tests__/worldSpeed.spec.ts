import { describe, expect, it } from 'vitest'

import { worldSpeedRatio } from '@/utils/worldSpeed'

describe('worldSpeedRatio', () => {
  it('formats normal worlds as x1', () => {
    expect(worldSpeedRatio(10)).toBe('x1')
  })

  it('formats faster worlds as speed multipliers', () => {
    expect(worldSpeedRatio(5)).toBe('x2')
    expect(worldSpeedRatio(6)).toBe('x1,7')
  })

  it('formats slower worlds as fractional multipliers', () => {
    expect(worldSpeedRatio(20)).toBe('x0,5')
  })
})
