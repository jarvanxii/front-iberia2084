<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { chronologyEvents, chronologyPeriods, type ChronologyEvent, type ChronologyPeriod } from '@/data/iberiaChronology'
import { formatTimelineRange, formatTimelineYear, timelineRange } from '@/utils/chronology'

type TimelineMode = 'modern' | 'complete'
type TimelineSelection = { kind: 'period'; id: string } | { kind: 'event'; index: number }
type TimelineEventItem = { event: ChronologyEvent; index: number }

const modernStartYear = 2026
const trackInsetPercent = 3.2
const modernDefaultPeriod = chronologyPeriods.find((period) => period.startYear >= modernStartYear) ?? chronologyPeriods[0]

const timelineMode = ref<TimelineMode>('modern')
const selectedSelection = ref<TimelineSelection>({ kind: 'period', id: modernDefaultPeriod?.id ?? 'decada-meme-institucional' })
const hoveredSelection = ref<TimelineSelection | null>(null)
const viewport = ref<HTMLElement | null>(null)
const canvas = ref<HTMLElement | null>(null)
const dragState = ref<{ pointerId: number; startX: number; scrollLeft: number } | null>(null)
const hasTimelineOverflow = ref(false)
const canScrollBackward = ref(false)
const canScrollForward = ref(false)
const scrollEdgeTolerance = 3
let timelineResizeObserver: ResizeObserver | null = null

const periodPalette: Record<string, { hue: string; ink: string }> = {
  'hispania-romana': { hue: '35 83% 56%', ink: '#fff2d7' },
  'reino-visigodo': { hue: '264 48% 62%', ink: '#f1e8ff' },
  'alandalus-reinos-cristianos': { hue: '149 54% 48%', ink: '#e6fff0' },
  'reyes-catolicos': { hue: '2 68% 58%', ink: '#ffe8e6' },
  'monarquia-austrias': { hue: '331 53% 52%', ink: '#ffe7f1' },
  'reformismo-borbonico': { hue: '213 72% 58%', ink: '#e6f1ff' },
  'crisis-antiguo-regimen': { hue: '27 62% 55%', ink: '#fff0e3' },
  'estado-liberal-pronunciamientos': { hue: '181 48% 50%', ink: '#e5ffff' },
  'restauracion-borbonica': { hue: '46 76% 54%', ink: '#fff7d7' },
  'dictadura-primo-rivera': { hue: '220 31% 63%', ink: '#eef3ff' },
  'segunda-republica': { hue: '287 55% 60%', ink: '#f8e7ff' },
  'guerra-civil': { hue: '8 72% 55%', ink: '#ffe6df' },
  franquismo: { hue: '199 30% 53%', ink: '#e6f4fb' },
  transicion: { hue: '94 42% 55%', ink: '#efffe4' },
  'bipartidismo-democratico': { hue: '206 56% 55%', ink: '#e7f4ff' },
  'multipartidismo-coaliciones': { hue: '32 72% 58%', ink: '#fff0dc' },
  'decada-meme-institucional': { hue: '320 67% 61%', ink: '#ffe5f6' },
  'ministerios-absurdos': { hue: '171 58% 50%', ink: '#e2fff9' },
  'reconquista-tierras-catalanas': { hue: '52 78% 57%', ink: '#fff8d8' },
  'reina-mopongo': { hue: '272 72% 66%', ink: '#f5e8ff' },
  'invasion-alienigena-administrativa': { hue: '112 60% 54%', ink: '#ebffe5' },
  'segunda-venida-jesus': { hue: '188 72% 62%', ink: '#e0fbff' },
  'guerra-algoritmos': { hue: '356 72% 61%', ink: '#ffe6e8' },
  'restauracion-humana': { hue: '136 43% 58%', ink: '#eaffef' },
  'confederacion-reinos-raros': { hue: '26 83% 61%', ink: '#fff0df' },
  'iberia-2084': { hue: '204 92% 67%', ink: '#e3f5ff' },
}

const tonePalette: Record<ChronologyEvent['tone'], { hue: string; ink: string; label: string }> = {
  historical: { hue: '206 58% 62%', ink: '#e7f4ff', label: 'Histórico' },
  transition: { hue: '34 72% 58%', ink: '#fff0dc', label: 'Transición' },
  satirical: { hue: '36 72% 58%', ink: '#fff0dc', label: 'Sátira jugable' },
  game: { hue: '204 92% 67%', ink: '#e3f5ff', label: 'Iberia 2084' },
}

const activePeriods = computed(() =>
  timelineMode.value === 'modern'
    ? chronologyPeriods.filter((period) => period.startYear >= modernStartYear)
    : chronologyPeriods,
)

const activeEvents = computed<TimelineEventItem[]>(() =>
  chronologyEvents
    .map((event, index) => ({ event, index }))
    .filter((item) => timelineMode.value === 'complete' || item.event.year >= modernStartYear),
)
const orderedPeriods = computed(() =>
  [...activePeriods.value].sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear),
)

const range = computed(() => timelineRange(activePeriods.value))
const firstYear = computed(() => formatTimelineYear(range.value.startYear))
const lastYear = computed(() => formatTimelineYear(range.value.endYear))
const periodMinWidthPx = computed(() => (timelineMode.value === 'modern' ? 176 : 150))
const timelineMinWidthPx = computed(() => Math.max(activePeriods.value.length * periodMinWidthPx.value, 960))
const timelineMinWidth = computed(() => `${timelineMinWidthPx.value}px`)

const importantTicks = computed(() => {
  if (timelineMode.value === 'modern') {
    return [2026, 2031, 2037, 2042, 2048, 2053, 2059, 2066, 2072, 2078, 2084]
  }

  return [range.value.startYear, 476, 711, 1492, 1808, 1936, 1975, modernStartYear, range.value.endYear]
})

const periodSegments = computed(() =>
  orderedPeriods.value
    .map((period) => ({
      period,
      flex: 1,
    }))
)
const laneCount = computed(() => 1)

const eventMarkers = computed(() =>
  activeEvents.value.map((item) => ({
    event: item.event,
    index: item.index,
    left: displayPosition(item.event.year),
    isFuture: item.event.year >= modernStartYear,
    isGame: item.event.tone === 'game',
  })),
)

const scaleTicks = computed(() =>
  importantTicks.value
    .filter((year) => year >= range.value.startYear && year <= range.value.endYear)
    .map((year) => ({
      year,
      left: displayPosition(year),
    })),
)

const activeSelection = computed<TimelineSelection>(() => {
  const selection = hoveredSelection.value ?? selectedSelection.value

  if (selection.kind === 'period' && activePeriods.value.some((period) => period.id === selection.id)) {
    return selection
  }

  if (selection.kind === 'event' && activeEvents.value.some((item) => item.index === selection.index)) {
    return selection
  }

  return { kind: 'period', id: activePeriods.value[0]?.id ?? chronologyPeriods[0]?.id ?? '' }
})

const activePeriod = computed(() => {
  const selection = activeSelection.value
  if (selection.kind !== 'period') return null
  return activePeriods.value.find((period) => period.id === selection.id) ?? activePeriods.value[0]
})

const activeEvent = computed(() => {
  const selection = activeSelection.value
  if (selection.kind !== 'event') return null
  return chronologyEvents[selection.index] ?? activeEvents.value[0]?.event ?? null
})

const activeKindLabel = computed(() => (activeSelection.value.kind === 'period' ? 'Periodo' : 'Evento'))
const activeTitle = computed(() => activePeriod.value?.title ?? activeEvent.value?.title ?? '')
const activePeriodIndex = computed(() => {
  if (!activePeriod.value) return -1
  return activePeriods.value.findIndex((period) => period.id === activePeriod.value?.id)
})
const activeEventSequenceIndex = computed(() => {
  const selection = activeSelection.value
  if (selection.kind !== 'event') return -1
  return activeEvents.value.findIndex((item) => item.index === selection.index)
})
const activeToneLabel = computed(() => {
  if (activePeriod.value) return activePeriod.value.tone === 'game' ? 'Iberia 2084' : 'Periodo histórico'
  if (activeEvent.value) return tonePalette[activeEvent.value.tone]?.label ?? 'Evento'
  return ''
})
const activeColorVars = computed(() => {
  if (activePeriod.value) return periodColorVars(activePeriod.value)
  return eventColorVars(activeEvent.value)
})
const canMoveDetailBackward = computed(() =>
  activeSelection.value.kind === 'period' ? activePeriodIndex.value > 0 : activeEventSequenceIndex.value > 0,
)
const canMoveDetailForward = computed(() =>
  activeSelection.value.kind === 'period'
    ? activePeriodIndex.value < activePeriods.value.length - 1
    : activeEventSequenceIndex.value < activeEvents.value.length - 1,
)

watch(timelineMode, () => {
  const firstPeriod = activePeriods.value[0]
  if (firstPeriod) selectedSelection.value = { kind: 'period', id: firstPeriod.id }
  hoveredSelection.value = null
  void nextTick(() => focusYear(range.value.startYear, 'auto'))
})

watch([timelineMinWidth, laneCount], () => {
  void nextTick(() => {
    observeTimelineSizes()
    updateTimelineScrollState()
  })
})

onMounted(() => {
  observeTimelineSizes()
  window.addEventListener('resize', updateTimelineScrollState)
  void nextTick(updateTimelineScrollState)
})

onBeforeUnmount(() => {
  timelineResizeObserver?.disconnect()
  window.removeEventListener('resize', updateTimelineScrollState)
})

function displayPosition(year: number) {
  const periods = orderedPeriods.value
  if (!periods.length) return trackInsetPercent

  const firstPeriod = periods[0]
  const lastPeriod = periods[periods.length - 1]
  if (!firstPeriod || !lastPeriod || year <= firstPeriod.startYear) return trackInsetPercent
  if (year >= lastPeriod.endYear) return 100 - trackInsetPercent

  const periodIndex = periods.findIndex((period) => year >= period.startYear && year <= period.endYear)
  if (periodIndex !== -1) {
    const period = periods[periodIndex]
    if (!period) return trackInsetPercent
    const span = Math.max(1, period.endYear - period.startYear)
    const progress = Math.min(Math.max((year - period.startYear) / span, 0), 1)
    return positionFromPeriodSlot(periodIndex + progress, periods.length)
  }

  const nextPeriodIndex = periods.findIndex((period) => year < period.startYear)
  return positionFromPeriodSlot(nextPeriodIndex === -1 ? periods.length : nextPeriodIndex, periods.length)
}

function positionFromPeriodSlot(slot: number, totalSlots: number) {
  const boundedSlot = Math.min(Math.max(slot, 0), totalSlots)
  const usableWidth = 100 - trackInsetPercent * 2
  return trackInsetPercent + (boundedSlot / totalSlots) * usableWidth
}

function periodColorVars(period?: ChronologyPeriod | null) {
  const palette = period ? periodPalette[period.id] : null
  return {
    '--timeline-hue': palette?.hue ?? '204 72% 58%',
    '--timeline-ink': palette?.ink ?? '#e6f4ff',
  }
}

function eventColorVars(event?: ChronologyEvent | null) {
  const palette = event ? tonePalette[event.tone] : null
  return {
    '--timeline-hue': palette?.hue ?? '204 72% 58%',
    '--timeline-ink': palette?.ink ?? '#e6f4ff',
  }
}

function periodStyle(segment: { period: ChronologyPeriod; flex: number }) {
  return {
    '--period-flex': `${segment.flex}`,
    '--period-basis': `${periodMinWidthPx.value}px`,
    ...periodColorVars(segment.period),
  }
}

function selectPeriod(period: ChronologyPeriod, focus = false) {
  selectedSelection.value = { kind: 'period', id: period.id }
  hoveredSelection.value = null
  if (focus) focusYear(Math.round((period.startYear + period.endYear) / 2))
}

function selectEvent(event: ChronologyEvent, index: number, focus = false) {
  selectedSelection.value = { kind: 'event', index }
  hoveredSelection.value = null
  if (focus) focusYear(event.year)
}

function previewPeriod(period: ChronologyPeriod) {
  hoveredSelection.value = { kind: 'period', id: period.id }
}

function previewEvent(index: number) {
  hoveredSelection.value = { kind: 'event', index }
}

function clearPreview() {
  hoveredSelection.value = null
}

function moveActive(offset: 1 | -1) {
  const active = activeSelection.value
  hoveredSelection.value = null

  if (active.kind === 'period') {
    const currentIndex = Math.max(0, activePeriods.value.findIndex((period) => period.id === active.id))
    const nextPeriod = activePeriods.value[Math.min(Math.max(0, currentIndex + offset), activePeriods.value.length - 1)]
    if (nextPeriod) selectPeriod(nextPeriod, true)
    return
  }

  const nextSequenceIndex = Math.min(Math.max(0, activeEventSequenceIndex.value + offset), activeEvents.value.length - 1)
  const nextEvent = activeEvents.value[nextSequenceIndex]
  if (nextEvent) selectEvent(nextEvent.event, nextEvent.index, true)
}

function scrollByDirection(direction: 1 | -1) {
  const element = viewport.value
  if (!element) return
  element.scrollBy({ left: direction * Math.max(300, element.clientWidth * 0.7), behavior: 'smooth' })
  scheduleTimelineScrollStateUpdate()
}

function focusYear(year: number, behavior: ScrollBehavior = 'smooth') {
  const element = viewport.value
  const content = canvas.value
  if (!element || !content) return
  const target = (displayPosition(year) / 100) * content.scrollWidth - element.clientWidth / 2
  const maxScroll = Math.max(0, content.scrollWidth - element.clientWidth)
  void nextTick(() => {
    element.scrollTo({ left: Math.min(Math.max(0, target), maxScroll), behavior })
    scheduleTimelineScrollStateUpdate()
  })
}

function updateTimelineScrollState() {
  const element = viewport.value
  const content = canvas.value
  if (!element || !content) {
    hasTimelineOverflow.value = false
    canScrollBackward.value = false
    canScrollForward.value = false
    return
  }

  const maxScroll = Math.max(0, content.scrollWidth - element.clientWidth)
  const scrollLeft = Math.min(Math.max(0, element.scrollLeft), maxScroll)
  const hasOverflow = maxScroll > scrollEdgeTolerance

  hasTimelineOverflow.value = hasOverflow
  canScrollBackward.value = hasOverflow && scrollLeft > scrollEdgeTolerance
  canScrollForward.value = hasOverflow && scrollLeft < maxScroll - scrollEdgeTolerance
}

function scheduleTimelineScrollStateUpdate() {
  if (typeof window === 'undefined') return
  window.requestAnimationFrame(() => updateTimelineScrollState())
}

function observeTimelineSizes() {
  timelineResizeObserver?.disconnect()
  if (typeof ResizeObserver === 'undefined') return

  timelineResizeObserver = new ResizeObserver(updateTimelineScrollState)
  if (viewport.value) timelineResizeObserver.observe(viewport.value)
  if (canvas.value) timelineResizeObserver.observe(canvas.value)
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  if (event.target instanceof Element && event.target.closest('button, select')) return
  const element = viewport.value
  if (!element) return
  dragState.value = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: element.scrollLeft }
  element.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  const state = dragState.value
  const element = viewport.value
  if (!state || !element) return
  element.scrollLeft = state.scrollLeft - (event.clientX - state.startX)
  updateTimelineScrollState()
}

function onPointerUp(event: PointerEvent) {
  const element = viewport.value
  if (dragState.value?.pointerId === event.pointerId && element?.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
  dragState.value = null
}
</script>

<template>
  <section class="panel chronology-board" aria-labelledby="chronology-title">
    <header class="chronology-heading">
      <div class="chronology-title-block">
        <p class="chronology-kicker">Cronología</p>
        <h1 id="chronology-title">Historia de Iberia 2084</h1>
      </div>

      <label class="timeline-mode">
        <span>Vista</span>
        <select v-model="timelineMode" aria-label="Elegir alcance de la cronología">
          <option value="modern">Historia moderna</option>
          <option value="complete">Historia completa</option>
        </select>
      </label>
    </header>

    <div class="timeline-frame">
      <div
        class="timeline-stage"
        :class="{ 'can-scroll-left': canScrollBackward, 'can-scroll-right': canScrollForward }"
      >
        <button
          v-if="canScrollBackward"
          type="button"
          class="timeline-side-control timeline-side-control--left"
          aria-label="Mover hacia atrás"
          @click="scrollByDirection(-1)"
        >
          ‹
        </button>

        <div
          ref="viewport"
          class="timeline-viewport"
          :class="{ dragging: dragState, 'has-overflow': hasTimelineOverflow }"
          tabindex="0"
          aria-label="Cronología horizontal"
          @scroll="updateTimelineScrollState"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @mouseleave="clearPreview"
        >
          <div
            ref="canvas"
            class="timeline-canvas"
            :class="`timeline-canvas--${timelineMode}`"
            :style="{ '--timeline-min-width': timelineMinWidth, '--period-lanes': laneCount }"
          >
            <div class="timeline-scale" aria-hidden="true">
              <span
                v-for="tick in scaleTicks"
                :key="tick.year"
                :class="{ first: tick.year === range.startYear, last: tick.year === range.endYear }"
                :style="{ left: `${tick.left}%` }"
              >
                {{ tick.year === range.startYear ? firstYear : tick.year === range.endYear ? lastYear : tick.year }}
              </span>
            </div>

            <div class="period-layer" aria-label="Periodos">
              <button
                v-for="segment in periodSegments"
                :key="segment.period.id"
                type="button"
                class="period-segment"
                :class="{ active: activeSelection.kind === 'period' && activePeriod?.id === segment.period.id }"
                :style="periodStyle(segment)"
                :aria-label="`${segment.period.title}. ${formatTimelineRange(segment.period.startYear, segment.period.endYear)}`"
                @mouseenter="previewPeriod(segment.period)"
                @focus="previewPeriod(segment.period)"
                @click="selectPeriod(segment.period)"
              >
                <span>{{ formatTimelineRange(segment.period.startYear, segment.period.endYear) }}</span>
                <strong>{{ segment.period.title }}</strong>
              </button>
            </div>

            <div class="event-layer" aria-label="Eventos">
              <span class="event-line" aria-hidden="true"></span>
              <button
                v-for="marker in eventMarkers"
                :key="`${marker.event.year}-${marker.index}`"
                type="button"
                class="event-marker"
                :class="[
                  `tone-${marker.event.tone}`,
                  {
                    active: activeSelection.kind === 'event' && activeSelection.index === marker.index,
                    'future-event': marker.isFuture,
                    'game-event': marker.isGame,
                  },
                ]"
                :style="{ left: `${marker.left}%`, ...eventColorVars(marker.event) }"
                :aria-label="`${formatTimelineYear(marker.event.year)}. ${marker.event.title}`"
                @mouseenter="previewEvent(marker.index)"
                @focus="previewEvent(marker.index)"
                @click="selectEvent(marker.event, marker.index)"
              >
                <span class="event-pin" aria-hidden="true"></span>
                <span class="event-year">{{ formatTimelineYear(marker.event.year) }}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="canScrollForward"
          type="button"
          class="timeline-side-control timeline-side-control--right"
          aria-label="Mover hacia delante"
          @click="scrollByDirection(1)"
        >
          ›
        </button>
      </div>

      <section class="chronology-detail" :style="activeColorVars" aria-live="polite">
        <header class="detail-heading">
          <div class="detail-kicker">
            <span>{{ activeKindLabel }}</span>
            <strong>{{ activeToneLabel }}</strong>
          </div>
          <div v-if="canMoveDetailBackward || canMoveDetailForward" class="detail-nav" aria-label="Navegar detalle">
            <button
              v-if="canMoveDetailBackward"
              type="button"
              aria-label="Elemento anterior"
              @click="moveActive(-1)"
            >
              ‹
            </button>
            <button
              v-if="canMoveDetailForward"
              type="button"
              aria-label="Elemento siguiente"
              @click="moveActive(1)"
            >
              ›
            </button>
          </div>
        </header>

        <h2>{{ activeTitle }}</h2>

        <dl v-if="activePeriod" class="detail-facts">
          <div>
            <dt>Inicio</dt>
            <dd>{{ formatTimelineYear(activePeriod.startYear) }}</dd>
          </div>
          <div>
            <dt>Final</dt>
            <dd>{{ formatTimelineYear(activePeriod.endYear) }}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{{ activePeriod.endYear - activePeriod.startYear }} años</dd>
          </div>
        </dl>

        <dl v-else-if="activeEvent" class="detail-facts detail-facts--event">
          <div>
            <dt>Año</dt>
            <dd>{{ formatTimelineYear(activeEvent.year) }}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{{ activeToneLabel }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>

<style scoped>
.chronology-board {
  display: grid;
  gap: 0.84rem;
  overflow: hidden;
  padding: clamp(0.78rem, 1.4vw, 1rem);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent 86px),
    rgba(11, 23, 38, 0.98);
}

.chronology-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: end;
}

.chronology-title-block {
  display: grid;
  min-width: 0;
  gap: 0.16rem;
}

.chronology-kicker,
.timeline-mode span {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.chronology-title-block h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.2rem, 2vw, 1.72rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
}

.timeline-mode {
  display: grid;
  gap: 0.28rem;
  justify-self: end;
  width: 220px;
  max-width: 100%;
}

.timeline-mode select {
  min-height: 34px;
  border: 1px solid rgba(125, 190, 255, 0.22);
  border-radius: 3px;
  padding: 0 0.7rem;
  color: #e8f4ff;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 58%),
    rgba(4, 13, 24, 0.72);
  box-shadow: var(--strategy-inset);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 900;
}

.timeline-mode select:focus-visible {
  outline: 2px solid rgba(155, 214, 255, 0.48);
  outline-offset: 2px;
}

.timeline-frame {
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.18);
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 46%),
    rgba(3, 10, 18, 0.36);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 -18px 36px rgba(0, 0, 0, 0.12);
}

.timeline-stage {
  position: relative;
  isolation: isolate;
}

.timeline-stage::before,
.timeline-stage::after {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  width: 54px;
  pointer-events: none;
  opacity: 0;
  content: '';
  transition: opacity 0.14s ease;
}

.timeline-stage::before {
  left: 0;
  background: linear-gradient(90deg, rgba(5, 14, 26, 0.96), transparent);
}

.timeline-stage::after {
  right: 0;
  background: linear-gradient(270deg, rgba(5, 14, 26, 0.96), transparent);
}

.timeline-stage.can-scroll-left::before,
.timeline-stage.can-scroll-right::after {
  opacity: 1;
}

.timeline-side-control {
  position: absolute;
  z-index: 3;
  top: 50%;
  display: grid;
  width: 34px;
  height: 64px;
  place-items: center;
  border: 1px solid rgba(155, 214, 255, 0.2);
  border-radius: 3px;
  color: #e6f4ff;
  background: rgba(4, 13, 24, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 22px rgba(0, 0, 0, 0.24);
  font-size: 1.44rem;
  font-weight: 950;
  transform: translateY(-50%);
}

.timeline-side-control:hover {
  border-color: rgba(155, 214, 255, 0.42);
  background: rgba(42, 91, 137, 0.72);
}

.timeline-side-control--left {
  left: 0.36rem;
}

.timeline-side-control--right {
  right: 0.36rem;
}

.timeline-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  cursor: default;
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 214, 255, 0.38) transparent;
}

.timeline-viewport.has-overflow {
  cursor: grab;
}

.timeline-viewport.has-overflow.dragging {
  cursor: grabbing;
}

.timeline-canvas {
  position: relative;
  width: max(100%, var(--timeline-min-width));
  min-width: 100%;
  height: 236px;
  min-height: 236px;
  user-select: none;
}

.timeline-scale {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 34px;
  border-bottom: 1px solid rgba(125, 190, 255, 0.1);
  color: #8da9c4;
  font-size: 0.68rem;
  font-weight: 900;
}

.timeline-scale span {
  position: absolute;
  top: 0;
  display: grid;
  height: 100%;
  align-items: center;
  border-left: 1px solid rgba(125, 190, 255, 0.1);
  padding-left: 0.42rem;
  transform: translateX(-1px);
  white-space: nowrap;
}

.timeline-scale span.last {
  padding-right: 0.42rem;
  padding-left: 0;
  transform: translateX(-100%);
  border-right: 1px solid rgba(125, 190, 255, 0.1);
  border-left: 0;
}

.timeline-scale span.first {
  transform: none;
}

.period-layer {
  position: absolute;
  top: 48px;
  right: 0;
  left: 0;
  display: flex;
  height: 84px;
}

.period-segment {
  --timeline-hue: 204 72% 58%;
  --timeline-ink: #e6f4ff;
  --period-flex: 1;
  --period-basis: 150px;
  position: relative;
  display: grid;
  flex: var(--period-flex) 0 var(--period-basis);
  min-width: var(--period-basis);
  height: 76px;
  align-content: start;
  gap: 0.16rem;
  overflow: hidden;
  border: 1px solid hsl(var(--timeline-hue) / 0.34);
  border-right-width: 0;
  border-radius: 0;
  padding: 0.36rem 0.46rem;
  color: var(--timeline-ink);
  background:
    linear-gradient(180deg, hsl(var(--timeline-hue) / 0.28), hsl(var(--timeline-hue) / 0.1) 66%),
    rgba(3, 10, 18, 0.3);
  font-family: 'Arial Narrow', 'Roboto Condensed', 'Segoe UI', Inter, ui-sans-serif, sans-serif;
  text-align: left;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.period-segment:last-child {
  border-right-width: 1px;
}

.timeline-canvas--modern .period-segment {
  min-width: 11rem;
}

.period-segment:hover,
.period-segment:focus-visible,
.period-segment.active {
  border-color: hsl(var(--timeline-hue) / 0.68);
  color: #ffffff;
  filter: brightness(1.08);
}

.period-segment span,
.period-segment strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: normal;
  word-break: normal;
}

.period-segment span {
  color: color-mix(in srgb, var(--timeline-ink) 72%, #8da9c4);
  font-size: 0.54rem;
  font-weight: 850;
  line-height: 1;
}

.period-segment strong {
  font-size: 0.66rem;
  font-weight: 850;
  line-height: 1.08;
}

.event-layer {
  position: absolute;
  top: 148px;
  right: 0;
  left: 0;
  height: 66px;
  border-top: 1px solid rgba(125, 190, 255, 0.12);
}

.event-line {
  position: absolute;
  top: 31px;
  right: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(155, 214, 255, 0.28), rgba(216, 174, 103, 0.18), transparent);
}

.event-marker {
  --timeline-hue: 204 72% 58%;
  position: absolute;
  top: 16px;
  display: grid;
  width: 34px;
  height: 36px;
  align-content: start;
  justify-items: center;
  transform: translateX(-50%);
  border: 0;
  padding: 6px 0 0;
  color: #a7c3dc;
  background: transparent;
}

.event-pin {
  display: block;
  width: 8px;
  height: 8px;
  border: 1px solid rgba(230, 244, 255, 0.22);
  border-radius: 999px;
  background: hsl(var(--timeline-hue) / 0.86);
  box-shadow: 0 0 0 4px hsl(var(--timeline-hue) / 0.1);
}

.event-marker.future-event .event-pin {
  width: 10px;
  height: 10px;
}

.event-marker.game-event .event-pin {
  box-shadow:
    0 0 0 4px hsl(var(--timeline-hue) / 0.12),
    0 0 18px hsl(var(--timeline-hue) / 0.22);
}

.event-marker:hover .event-pin,
.event-marker:focus-visible .event-pin,
.event-marker.active .event-pin {
  filter: brightness(1.2);
  transform: scale(1.22);
}

.event-year {
  position: absolute;
  top: 24px;
  left: 50%;
  max-width: 76px;
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 2px;
  padding: 0.08rem 0.3rem;
  background: rgba(3, 10, 18, 0.84);
  color: var(--timeline-ink, #e6f4ff);
  font-size: 0.6rem;
  font-weight: 950;
  opacity: 0;
  text-overflow: ellipsis;
  transform: translateX(-50%);
  transition: opacity 0.14s ease;
  white-space: nowrap;
}

.event-marker:hover .event-year,
.event-marker:focus-visible .event-year,
.event-marker.active .event-year {
  opacity: 1;
}

.chronology-detail {
  --timeline-hue: 204 72% 58%;
  --timeline-ink: #e6f4ff;
  display: grid;
  gap: 0.56rem;
  border-top: 1px solid rgba(125, 190, 255, 0.16);
  padding: 0.74rem 0.9rem 0.82rem;
  background:
    linear-gradient(135deg, hsl(var(--timeline-hue) / 0.1), transparent 62%),
    rgba(4, 13, 24, 0.28);
}

.detail-heading {
  display: flex;
  gap: 0.65rem;
  align-items: start;
  justify-content: space-between;
  min-width: 0;
}

.detail-kicker {
  display: grid;
  min-width: 0;
  gap: 0.12rem;
}

.detail-kicker span {
  color: hsl(var(--timeline-hue) / 0.95);
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.detail-kicker strong {
  color: #9fb6ce;
  font-size: 0.72rem;
  font-weight: 850;
  line-height: 1.1;
}

.detail-nav {
  display: inline-flex;
  gap: 0.24rem;
}

.detail-nav button {
  display: grid;
  width: 30px;
  height: 28px;
  place-items: center;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 3px;
  color: #dceeff;
  background: rgba(4, 13, 24, 0.46);
  font-size: 1rem;
  font-weight: 950;
  line-height: 1;
}

.detail-nav button:hover:not(:disabled) {
  border-color: rgba(155, 214, 255, 0.34);
  background: rgba(90, 167, 232, 0.1);
}

.detail-nav button:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

.chronology-detail h2 {
  max-width: 70rem;
  margin: 0;
  color: var(--timeline-ink);
  font-size: clamp(1rem, 1.25vw, 1.22rem);
  font-weight: 950;
  line-height: 1.16;
}

.detail-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0;
}

.detail-facts--event {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-facts div {
  display: grid;
  gap: 0.12rem;
  border-top: 1px solid hsl(var(--timeline-hue) / 0.18);
  padding-top: 0.4rem;
}

.detail-facts dt {
  color: #8da9c4;
  font-size: 0.64rem;
  font-weight: 900;
  text-transform: uppercase;
}

.detail-facts dd {
  margin: 0;
  color: #f6fbff;
  font-weight: 950;
}

@media (max-width: 960px) {
  .chronology-heading {
    grid-template-columns: 1fr;
  }

  .timeline-mode {
    width: min(100%, 260px);
  }
}

@media (max-width: 760px) {
  .chronology-board {
    padding: 0.7rem;
  }

  .chronology-title-block h1 {
    font-size: clamp(1.1rem, 8vw, 1.55rem);
  }

  .timeline-frame {
    border-radius: 4px;
  }

  .timeline-stage::before,
  .timeline-stage::after {
    width: 36px;
  }

  .timeline-side-control {
    width: 32px;
    height: 58px;
    font-size: 1.34rem;
  }

  .timeline-side-control--left {
    left: 0.24rem;
  }

  .timeline-side-control--right {
    right: 0.24rem;
  }

  .timeline-canvas {
    min-height: 226px;
  }

  .chronology-detail {
    padding: 0.68rem 0.7rem 0.76rem;
  }

  .detail-heading {
    align-items: center;
  }

  .detail-facts,
  .detail-facts--event {
    grid-template-columns: 1fr;
  }
}
</style>
