const BASE_TICK_SECONDS = 10

export function worldSpeedRatio(tickSeconds: number) {
  if (!Number.isFinite(tickSeconds) || tickSeconds <= 0) return 'x1'

  const ratio = BASE_TICK_SECONDS / tickSeconds
  const rounded = Math.max(0.1, Math.round(ratio * 10) / 10)

  return `x${rounded.toLocaleString('es-ES', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: 1,
  })}`
}
