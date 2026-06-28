import type { ChronologyPeriod } from '@/data/iberiaChronology'

export interface TimelineRange {
  startYear: number
  endYear: number
}

export interface PeriodLane {
  period: ChronologyPeriod
  lane: number
}

export function timelineRange(periods: ChronologyPeriod[]): TimelineRange {
  return {
    startYear: Math.min(...periods.map((period) => period.startYear)),
    endYear: Math.max(...periods.map((period) => period.endYear)),
  }
}

export function timelinePosition(year: number, range: TimelineRange) {
  const span = range.endYear - range.startYear
  if (span <= 0) return 0
  return ((year - range.startYear) / span) * 100
}

export function timelineWidth(startYear: number, endYear: number, range: TimelineRange) {
  const span = range.endYear - range.startYear
  if (span <= 0) return 0
  return ((endYear - startYear) / span) * 100
}

export function formatTimelineYear(year: number) {
  if (year < 0) return `${Math.abs(year)} a.C.`
  return `${year}`
}

export function formatTimelineRange(startYear: number, endYear: number) {
  return `${formatTimelineYear(startYear)}-${formatTimelineYear(endYear)}`
}

export function assignTimelineLanes(periods: ChronologyPeriod[]): PeriodLane[] {
  const laneEndYears: number[] = []

  return [...periods]
    .sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear)
    .map((period) => {
      const openLane = laneEndYears.findIndex((endYear) => period.startYear >= endYear)
      const lane = openLane === -1 ? laneEndYears.length : openLane
      laneEndYears[lane] = period.endYear
      return { period, lane }
    })
}
