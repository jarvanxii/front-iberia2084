import { describe, expect, it } from 'vitest'

import { chronologyPeriods } from '@/data/iberiaChronology'
import { assignTimelineLanes, timelinePosition, timelineRange, timelineWidth } from '@/utils/chronology'

describe('chronology timeline', () => {
  it('uses the full Iberia 2084 chronology range', () => {
    expect(timelineRange(chronologyPeriods)).toEqual({ startYear: -218, endYear: 2084 })
  })

  it('maps periods proportionally inside the total range', () => {
    const range = timelineRange(chronologyPeriods)
    const roman = chronologyPeriods.find((period) => period.id === 'hispania-romana')
    const game = chronologyPeriods.find((period) => period.id === 'iberia-2084')

    expect(roman).toBeDefined()
    expect(game).toBeDefined()
    expect(timelinePosition(2026, range)).toBeCloseTo(97.48045, 4)
    expect(timelineWidth(roman!.startYear, roman!.endYear, range)).toBeCloseTo(30.1477, 4)
    expect(timelineWidth(game!.startYear, game!.endYear, range)).toBeCloseTo(0.2606, 4)
  })

  it('places overlapping periods into separate lanes', () => {
    const lanes = assignTimelineLanes(chronologyPeriods)
    const roman = lanes.find((item) => item.period.id === 'hispania-romana')
    const visigoth = lanes.find((item) => item.period.id === 'reino-visigodo')
    const alAndalus = lanes.find((item) => item.period.id === 'alandalus-reinos-cristianos')
    const catholicKings = lanes.find((item) => item.period.id === 'reyes-catolicos')

    expect(roman?.lane).not.toBe(visigoth?.lane)
    expect(alAndalus?.lane).not.toBe(catholicKings?.lane)
  })
})
