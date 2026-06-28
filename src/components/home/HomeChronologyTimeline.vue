<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { chronologyEvents, chronologyPeriods, type ChronologyEvent, type ChronologyPeriod } from '@/data/iberiaChronology'
import {
  assignTimelineLanes,
  formatTimelineRange,
  formatTimelineYear,
  timelineRange,
} from '@/utils/chronology'

const futureStartYear = 2026
const gameStartYear = 2078
const zoomSteps = [1, 2.2, 4.1, 7.2, 12, 18] as const
const canvasBaseWidth = 3200
const selectedPeriodId = ref('iberia-2084')
const selectedEventIndex = ref(chronologyEvents.length - 1)
const zoomIndex = ref(0)
const viewport = ref<HTMLElement | null>(null)
const canvas = ref<HTMLElement | null>(null)
const dragState = ref<{ pointerId: number; startX: number; scrollLeft: number } | null>(null)

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

const range = timelineRange(chronologyPeriods)
const periodLanes = assignTimelineLanes(chronologyPeriods)
const laneCount = Math.max(...periodLanes.map((item) => item.lane)) + 1
const displayYears = [
  ...new Set([
    ...chronologyPeriods.flatMap((period) => [period.startYear, period.endYear]),
    ...chronologyEvents.map((event) => event.year),
    range.startYear,
    476,
    711,
    1492,
    1808,
    1936,
    1975,
    futureStartYear,
    range.endYear,
  ]),
].sort((a, b) => a - b)
const displayScaleSegments = displayYears.slice(0, -1).map((startYear, index) => {
  const endYear = displayYears[index + 1] ?? startYear
  const span = Math.max(1, endYear - startYear)
  return {
    startYear,
    endYear,
    weight: Math.max(4.6, Math.pow(span, 0.56)),
  }
})
const displayTotalWeight = displayScaleSegments.reduce((total, segment) => total + segment.weight, 0)
const zoom = computed(() => zoomSteps[zoomIndex.value] ?? 1)
const isOverview = computed(() => zoomIndex.value === 0)
const canvasWidth = computed(() => Math.round(canvasBaseWidth * zoom.value))
const canvasWidthStyle = computed(() => (isOverview.value ? '100%' : `${canvasWidth.value}px`))
const selectedPeriod = computed(
  () => chronologyPeriods.find((period) => period.id === selectedPeriodId.value) ?? chronologyPeriods[0],
)
const selectedPeriodIndex = computed(() =>
  Math.max(
    0,
    chronologyPeriods.findIndex((period) => period.id === selectedPeriod.value?.id),
  ),
)
const selectedPeriodNumber = computed(() => selectedPeriodIndex.value + 1)
const selectedEvent = computed(() => chronologyEvents[selectedEventIndex.value] ?? chronologyEvents[chronologyEvents.length - 1] ?? null)
const selectedEventNumber = computed(() => selectedEventIndex.value + 1)
const firstYear = computed(() => formatTimelineYear(range.startYear))
const lastYear = computed(() => formatTimelineYear(range.endYear))

const periodSegments = computed(() =>
  periodLanes.map(({ period, lane }) => ({
    period,
    lane,
    left: displayPosition(period.startYear),
    width: Math.max(0.55, displayWidth(period.startYear, period.endYear)),
  })),
)

const eventMarkers = computed(() =>
  chronologyEvents.map((event, index) => ({
    event,
    index,
    left: displayPosition(event.year),
    isFuture: event.year >= futureStartYear,
    isGame: event.year >= gameStartYear,
  })),
)

const futureEventCards = computed(() =>
  chronologyEvents
    .map((event, index) => ({
      event,
      index,
      period: chronologyPeriods.find((period) => event.year >= period.startYear && event.year <= period.endYear),
    }))
    .filter((item) => item.event.year >= futureStartYear),
)

const scaleTicks = computed(() =>
  [range.startYear, 476, 711, 1492, 1808, 1936, 1975, futureStartYear, range.endYear].map((year) => ({
    year,
    left: displayPosition(year),
  })),
)

function displayPosition(year: number) {
  if (year <= range.startYear) return 0
  if (year >= range.endYear) return 100

  let accumulatedWeight = 0
  for (const segment of displayScaleSegments) {
    if (year >= segment.endYear) {
      accumulatedWeight += segment.weight
      continue
    }
    if (year >= segment.startYear) {
      const span = Math.max(1, segment.endYear - segment.startYear)
      const ratio = (year - segment.startYear) / span
      accumulatedWeight += segment.weight * ratio
      break
    }
  }

  return displayTotalWeight > 0 ? (accumulatedWeight / displayTotalWeight) * 100 : 0
}

function displayWidth(startYear: number, endYear: number) {
  return Math.max(0, displayPosition(endYear) - displayPosition(startYear))
}

function periodColorVars(period?: ChronologyPeriod) {
  const palette = period ? periodPalette[period.id] : null
  return {
    '--period-hue': palette?.hue ?? '204 72% 58%',
    '--period-ink': palette?.ink ?? '#e6f4ff',
  }
}

function periodSegmentStyle(segment: { period: ChronologyPeriod; lane: number; left: number; width: number }) {
  return {
    left: `${segment.left}%`,
    width: `${segment.width}%`,
    top: `${segment.lane * 48}px`,
    ...periodColorVars(segment.period),
  }
}

function eventMarkerStyle(marker: { left: number }) {
  return {
    left: `${marker.left}%`,
  }
}

function selectPeriod(period: ChronologyPeriod) {
  selectedPeriodId.value = period.id
}

function selectPeriodByOffset(offset: 1 | -1) {
  const currentIndex = Math.max(
    0,
    chronologyPeriods.findIndex((period) => period.id === selectedPeriod.value?.id),
  )
  const nextIndex = Math.min(Math.max(0, currentIndex + offset), chronologyPeriods.length - 1)
  const nextPeriod = chronologyPeriods[nextIndex]
  if (!nextPeriod) return
  selectPeriod(nextPeriod)
  focusYearAtZoom(Math.round((nextPeriod.startYear + nextPeriod.endYear) / 2), 2)
}

function selectEvent(_event: ChronologyEvent, index: number) {
  selectedEventIndex.value = index
}

function selectEventAndFocus(event: ChronologyEvent, index: number, minimumZoom = 0) {
  selectEvent(event, index)
  if (minimumZoom > 0) focusYearAtZoom(event.year, minimumZoom)
}

function selectEventByOffset(offset: 1 | -1) {
  const nextIndex = Math.min(Math.max(0, selectedEventIndex.value + offset), chronologyEvents.length - 1)
  const nextEvent = chronologyEvents[nextIndex]
  if (!nextEvent) return
  selectEventAndFocus(nextEvent, nextIndex, 2)
}

function scrollByDirection(direction: 1 | -1) {
  const element = viewport.value
  if (!element) return
  element.scrollBy({ left: direction * Math.max(420, element.clientWidth * 0.74), behavior: 'smooth' })
}

function focusYear(year: number, behavior: ScrollBehavior = 'smooth') {
  const element = viewport.value
  const content = canvas.value
  if (!element || !content) return
  const target = (displayPosition(year) / 100) * content.scrollWidth - element.clientWidth / 2
  const maxScroll = Math.max(0, content.scrollWidth - element.clientWidth)
  element.scrollTo({ left: Math.min(Math.max(0, target), maxScroll), behavior })
}

function focusYearAtZoom(year: number, minimumZoom = 2) {
  zoomIndex.value = Math.max(zoomIndex.value, minimumZoom)
  void nextTick(() => focusYear(year))
}

function resetView() {
  zoomIndex.value = 0
  void nextTick(() => viewport.value?.scrollTo({ left: 0, behavior: 'smooth' }))
}

function focusFutureStart() {
  focusYearAtZoom(futureStartYear, 3)
}

function focusGameEra() {
  focusYearAtZoom(2084, 4)
}

function setZoomIndex(nextIndex: number, anchorClientX?: number) {
  const nextZoomIndex = Math.min(Math.max(0, nextIndex), zoomSteps.length - 1)
  if (nextZoomIndex === zoomIndex.value) return

  const element = viewport.value
  const content = canvas.value
  const bounds = element?.getBoundingClientRect()
  const anchorOffset = bounds ? (anchorClientX ?? bounds.left + bounds.width / 2) - bounds.left : 0
  const anchorRatio =
    element && content && bounds && content.scrollWidth > 0 ? (element.scrollLeft + anchorOffset) / content.scrollWidth : null

  zoomIndex.value = nextZoomIndex

  void nextTick(() => {
    const nextElement = viewport.value
    const nextContent = canvas.value
    if (!nextElement || !nextContent || anchorRatio === null) return
    const maxScroll = Math.max(0, nextContent.scrollWidth - nextElement.clientWidth)
    const nextScroll = anchorRatio * nextContent.scrollWidth - anchorOffset
    nextElement.scrollTo({ left: Math.min(Math.max(0, nextScroll), maxScroll), behavior: 'auto' })
  })
}

function changeZoom(direction: 1 | -1) {
  setZoomIndex(zoomIndex.value + direction)
}

function onWheelZoom(event: WheelEvent) {
  if (Math.abs(event.deltaY) < 2) return
  setZoomIndex(zoomIndex.value + (event.deltaY < 0 ? 1 : -1), event.clientX)
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  if (event.target instanceof Element && event.target.closest('button')) return
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
  <section class="panel chronology-panel" aria-labelledby="chronology-title">
    <header class="chronology-heading">
      <div class="chronology-title-block">
        <p class="chronology-kicker">Eje cronológico</p>
        <h1 id="chronology-title">Historia de España e Iberia 2084</h1>
      </div>

      <div class="timeline-controls" aria-label="Controles del cronograma">
        <button type="button" class="timeline-control" aria-label="Reducir zoom" @click="changeZoom(-1)">−</button>
        <span class="zoom-meter" aria-label="Nivel de zoom">x{{ zoom.toFixed(1) }}</span>
        <button type="button" class="timeline-control" aria-label="Aumentar zoom" @click="changeZoom(1)">+</button>
        <button type="button" class="timeline-chip" @click="resetView">Completo</button>
        <button type="button" class="timeline-chip" @click="focusFutureStart">2026</button>
        <button type="button" class="timeline-chip is-strong" @click="focusGameEra">2084</button>
      </div>
    </header>

    <div class="timeline-stage">
      <button
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
        :class="{ dragging: dragState }"
        tabindex="0"
        aria-label="Cronograma desplazable"
        @wheel.prevent="onWheelZoom"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          ref="canvas"
          class="timeline-canvas"
          :class="{ 'is-overview': isOverview }"
          :style="{
            width: canvasWidthStyle,
            '--period-lanes': laneCount,
          }"
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

          <div class="period-layer" aria-label="Periodos históricos">
            <button
              v-for="segment in periodSegments"
              :key="segment.period.id"
              type="button"
              class="period-segment"
              :class="[`tone-${segment.period.tone}`, { selected: segment.period.id === selectedPeriod?.id }]"
              :style="periodSegmentStyle(segment)"
              :aria-pressed="segment.period.id === selectedPeriod?.id"
              @click="selectPeriod(segment.period)"
            >
              <span>{{ formatTimelineRange(segment.period.startYear, segment.period.endYear) }}</span>
              <strong>{{ segment.period.title }}</strong>
            </button>
          </div>

          <div class="event-layer" aria-label="Eventos">
            <span class="event-spine" aria-hidden="true"></span>
            <button
              v-for="marker in eventMarkers"
              :key="`${marker.event.year}-${marker.index}`"
              type="button"
              class="event-marker"
              :class="[
                `tone-${marker.event.tone}`,
                {
                  selected: marker.index === selectedEventIndex,
                  'future-event': marker.isFuture,
                  'game-event': marker.isGame,
                },
              ]"
              :style="eventMarkerStyle(marker)"
              :aria-label="`${formatTimelineYear(marker.event.year)}. ${marker.event.title}`"
              :title="`${formatTimelineYear(marker.event.year)}. ${marker.event.title}`"
              @click="selectEvent(marker.event, marker.index)"
            >
              <span class="event-pin" aria-hidden="true"></span>
              <span class="event-year">{{ formatTimelineYear(marker.event.year) }}</span>
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="timeline-side-control timeline-side-control--right"
        aria-label="Mover hacia delante"
        @click="scrollByDirection(1)"
      >
        ›
      </button>
    </div>

    <section class="future-briefing" aria-label="Eventos futuros destacados">
      <header>
        <span>2026-2084</span>
        <strong>Futuro jugable</strong>
      </header>
      <div class="future-event-row">
        <button
          v-for="item in futureEventCards"
          :key="`future-${item.event.year}-${item.index}`"
          type="button"
          class="future-card"
          :class="{ selected: item.index === selectedEventIndex, 'game-card': item.event.year >= gameStartYear }"
          :style="periodColorVars(item.period)"
          @click="selectEventAndFocus(item.event, item.index, 3)"
        >
          <span>{{ formatTimelineYear(item.event.year) }}</span>
          <strong>{{ item.event.title }}</strong>
        </button>
      </div>
    </section>

    <section v-if="selectedPeriod" class="chronology-detail" aria-label="Detalle separado de periodo y evento">
      <article class="period-detail" :class="`tone-${selectedPeriod.tone}`" :style="periodColorVars(selectedPeriod)">
        <header class="detail-heading">
          <span>Periodo {{ selectedPeriodNumber }} / {{ chronologyPeriods.length }}</span>
          <span class="detail-nav" aria-label="Navegación de periodos">
            <button
              type="button"
              aria-label="Periodo anterior"
              :disabled="selectedPeriodIndex === 0"
              @click="selectPeriodByOffset(-1)"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Periodo siguiente"
              :disabled="selectedPeriodIndex === chronologyPeriods.length - 1"
              @click="selectPeriodByOffset(1)"
            >
              ›
            </button>
          </span>
        </header>
        <h2>{{ selectedPeriod.title }}</h2>
        <dl>
          <div>
            <dt>Inicio</dt>
            <dd>{{ formatTimelineYear(selectedPeriod.startYear) }}</dd>
          </div>
          <div>
            <dt>Final</dt>
            <dd>{{ formatTimelineYear(selectedPeriod.endYear) }}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{{ selectedPeriod.endYear - selectedPeriod.startYear }} años</dd>
          </div>
        </dl>
      </article>

      <article v-if="selectedEvent" class="event-detail" :class="`tone-${selectedEvent.tone}`">
        <header class="detail-heading">
          <span>Evento {{ selectedEventNumber }} / {{ chronologyEvents.length }}</span>
          <span class="detail-nav" aria-label="Navegación de eventos">
            <button
              type="button"
              aria-label="Evento anterior"
              :disabled="selectedEventIndex === 0"
              @click="selectEventByOffset(-1)"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Evento siguiente"
              :disabled="selectedEventIndex === chronologyEvents.length - 1"
              @click="selectEventByOffset(1)"
            >
              ›
            </button>
          </span>
        </header>
        <span>{{ formatTimelineYear(selectedEvent.year) }}</span>
        <strong>{{ selectedEvent.title }}</strong>
      </article>
    </section>
  </section>
</template>

<style scoped>
.chronology-panel {
  display: grid;
  gap: 0.82rem;
  overflow: hidden;
  padding: clamp(0.82rem, 1.5vw, 1.15rem);
  background:
    radial-gradient(circle at 88% 8%, rgba(155, 214, 255, 0.11), transparent 23rem),
    radial-gradient(circle at 10% 18%, rgba(216, 174, 103, 0.07), transparent 18rem),
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent 88px),
    var(--color-surface);
}

.chronology-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: end;
}

.chronology-title-block {
  display: grid;
  min-width: 0;
  gap: 0.18rem;
}

.chronology-kicker {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.chronology-title-block h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.25rem, 2vw, 1.85rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
}

.timeline-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.32rem;
  min-width: 0;
}

.timeline-control,
.timeline-chip,
.zoom-meter {
  display: inline-grid;
  min-height: 32px;
  place-items: center;
  border: 1px solid rgba(125, 190, 255, 0.16);
  border-radius: 4px;
  padding: 0 0.58rem;
  color: #dceeff;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 56%),
    rgba(4, 13, 24, 0.58);
  font-size: 0.78rem;
  font-weight: 950;
  line-height: 1;
  box-shadow: var(--strategy-inset);
}

.timeline-control {
  width: 34px;
  padding: 0;
  font-size: 1.1rem;
}

.timeline-chip.is-strong,
.timeline-control:hover,
.timeline-chip:hover {
  border-color: rgba(155, 214, 255, 0.42);
  color: #ffffff;
  background:
    linear-gradient(180deg, rgba(155, 214, 255, 0.14), rgba(90, 167, 232, 0.08)),
    rgba(4, 13, 24, 0.64);
}

.zoom-meter {
  min-width: 54px;
  color: #9bd6ff;
}

.timeline-stage {
  position: relative;
  isolation: isolate;
}

.timeline-stage::before,
.timeline-stage::after {
  position: absolute;
  z-index: 2;
  top: 1px;
  bottom: 1px;
  width: 72px;
  pointer-events: none;
  content: '';
}

.timeline-stage::before {
  left: 1px;
  background: linear-gradient(90deg, rgba(5, 14, 26, 0.94), transparent);
}

.timeline-stage::after {
  right: 1px;
  background: linear-gradient(270deg, rgba(5, 14, 26, 0.94), transparent);
}

.timeline-side-control {
  position: absolute;
  z-index: 3;
  top: 50%;
  display: grid;
  width: 38px;
  height: 76px;
  place-items: center;
  border: 1px solid rgba(155, 214, 255, 0.2);
  border-radius: 4px;
  color: #e6f4ff;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 56%),
    rgba(4, 13, 24, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 22px rgba(0, 0, 0, 0.24);
  font-size: 1.75rem;
  font-weight: 950;
  transform: translateY(-50%);
}

.timeline-side-control:hover {
  border-color: rgba(155, 214, 255, 0.42);
  background: rgba(42, 91, 137, 0.72);
}

.timeline-side-control--left {
  left: 0.44rem;
}

.timeline-side-control--right {
  right: 0.44rem;
}

.timeline-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid rgba(125, 190, 255, 0.2);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.032), transparent 42%),
    radial-gradient(circle at 96% 12%, rgba(90, 167, 232, 0.12), transparent 18rem),
    rgba(3, 10, 18, 0.36);
  cursor: grab;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 -20px 42px rgba(0, 0, 0, 0.18);
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 214, 255, 0.38) transparent;
}

.timeline-viewport.dragging {
  cursor: grabbing;
}

.timeline-canvas {
  position: relative;
  min-width: 100%;
  height: calc(168px + var(--period-lanes) * 48px);
  min-height: 294px;
  user-select: none;
}

.timeline-scale {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 36px;
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
  padding-left: 0.45rem;
  transform: translateX(-1px);
  white-space: nowrap;
}

.timeline-scale span.last {
  padding-right: 0.45rem;
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
  top: 50px;
  right: 0;
  left: 0;
  height: calc(var(--period-lanes) * 48px);
}

.period-segment {
  --period-hue: 204 72% 58%;
  --period-ink: #e6f4ff;
  position: absolute;
  display: grid;
  min-width: 5px;
  height: 38px;
  align-content: center;
  gap: 0.04rem;
  overflow: hidden;
  border: 1px solid hsl(var(--period-hue) / 0.34);
  border-radius: 4px;
  padding: 0.28rem 0.45rem;
  color: var(--period-ink);
  background:
    linear-gradient(180deg, hsl(var(--period-hue) / 0.32), hsl(var(--period-hue) / 0.1) 64%),
    linear-gradient(90deg, hsl(var(--period-hue) / 0.22), rgba(3, 10, 18, 0.24));
  text-align: left;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    0 8px 18px hsl(var(--period-hue) / 0.07);
}

.period-segment::before {
  position: absolute;
  top: 5px;
  bottom: 5px;
  left: 5px;
  width: 3px;
  border-radius: 999px;
  background: hsl(var(--period-hue) / 0.92);
  box-shadow: 0 0 12px hsl(var(--period-hue) / 0.38);
  content: '';
}

.period-segment:hover,
.period-segment.selected {
  border-color: hsl(var(--period-hue) / 0.64);
  color: #ffffff;
  filter: brightness(1.08);
  background:
    linear-gradient(180deg, hsl(var(--period-hue) / 0.44), hsl(var(--period-hue) / 0.14) 66%),
    linear-gradient(90deg, hsl(var(--period-hue) / 0.3), rgba(5, 16, 30, 0.2));
}

.period-segment.selected {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 0 0 1px hsl(var(--period-hue) / 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 10px 24px hsl(var(--period-hue) / 0.17);
}

.period-segment span,
.period-segment strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.period-segment span {
  padding-left: 0.34rem;
  color: color-mix(in srgb, var(--period-ink) 72%, #8da9c4);
  font-size: 0.58rem;
  font-weight: 950;
}

.period-segment strong {
  padding-left: 0.34rem;
  font-size: 0.74rem;
  font-weight: 950;
  line-height: 1.05;
}

.event-layer {
  position: absolute;
  top: calc(72px + var(--period-lanes) * 48px);
  right: 0;
  left: 0;
  height: 86px;
  border-top: 1px solid rgba(125, 190, 255, 0.12);
}

.event-spine {
  position: absolute;
  top: 30px;
  right: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(155, 214, 255, 0.32), rgba(216, 174, 103, 0.18), transparent);
}

.event-marker {
  position: absolute;
  top: 21px;
  display: grid;
  min-width: 28px;
  justify-items: center;
  gap: 0.18rem;
  transform: translateX(-50%);
  border: 0;
  padding: 0;
  color: #a7c3dc;
  background: transparent;
}

.event-pin {
  display: block;
  width: 8px;
  height: 8px;
  border: 1px solid rgba(230, 244, 255, 0.22);
  border-radius: 999px;
  background: #6faee8;
  box-shadow: 0 0 0 4px rgba(111, 174, 232, 0.1);
}

.event-marker.tone-satirical .event-pin {
  background: #d8ae67;
  box-shadow: 0 0 0 4px rgba(216, 174, 103, 0.11);
}

.event-marker.tone-game .event-pin,
.event-marker.game-event .event-pin {
  background: #9bd6ff;
  box-shadow:
    0 0 0 4px rgba(155, 214, 255, 0.13),
    0 0 20px rgba(155, 214, 255, 0.22);
}

.event-marker.future-event .event-pin {
  width: 12px;
  height: 12px;
  border-color: rgba(255, 247, 215, 0.34);
}

.event-marker.selected .event-pin,
.event-marker:hover .event-pin {
  filter: brightness(1.22);
  transform: scale(1.18);
}

.event-marker.selected .event-year,
.event-marker:hover .event-year {
  border-color: rgba(155, 214, 255, 0.35);
  color: #ffffff;
}

.event-year {
  position: absolute;
  top: 18px;
  left: 50%;
  max-width: 72px;
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: 3px;
  padding: 0.08rem 0.28rem;
  background: rgba(3, 10, 18, 0.78);
  color: currentColor;
  font-size: 0.6rem;
  font-weight: 950;
  opacity: 0;
  text-overflow: ellipsis;
  transform: translateX(-50%);
  transition: opacity 0.14s ease;
  white-space: nowrap;
}

.event-marker.selected .event-year,
.event-marker:hover .event-year {
  opacity: 1;
}

.timeline-canvas.is-overview .event-marker.selected .event-pin,
.timeline-canvas.is-overview .event-marker:hover .event-pin {
  transform: scale(1.28);
}

.future-briefing {
  --period-hue: 204 72% 58%;
  display: grid;
  grid-template-columns: minmax(130px, 0.16fr) minmax(0, 1fr);
  gap: 0.58rem;
  align-items: stretch;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 6px;
  padding: 0.58rem;
  background:
    linear-gradient(90deg, rgba(216, 174, 103, 0.08), transparent 40%),
    rgba(3, 10, 18, 0.28);
}

.future-briefing header {
  display: grid;
  align-content: center;
  gap: 0.18rem;
  border-right: 1px solid rgba(125, 190, 255, 0.12);
  padding-right: 0.62rem;
}

.future-briefing header span {
  color: #d8ae67;
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0.06em;
}

.future-briefing header strong {
  color: #f6fbff;
  font-size: 0.96rem;
  font-weight: 950;
  line-height: 1.05;
}

.future-event-row {
  display: flex;
  gap: 0.44rem;
  overflow-x: auto;
  padding-bottom: 0.18rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(216, 174, 103, 0.42) transparent;
}

.future-card {
  --period-hue: 204 72% 58%;
  --period-ink: #e6f4ff;
  display: grid;
  flex: 0 0 clamp(168px, 18vw, 238px);
  min-height: 92px;
  align-content: start;
  gap: 0.34rem;
  border: 1px solid hsl(var(--period-hue) / 0.22);
  border-radius: 5px;
  padding: 0.62rem;
  color: var(--period-ink);
  background:
    linear-gradient(180deg, hsl(var(--period-hue) / 0.16), hsl(var(--period-hue) / 0.055)),
    rgba(4, 13, 24, 0.66);
  text-align: left;
  box-shadow: var(--strategy-inset);
}

.future-card:hover,
.future-card.selected {
  border-color: hsl(var(--period-hue) / 0.48);
  background:
    linear-gradient(180deg, hsl(var(--period-hue) / 0.22), hsl(var(--period-hue) / 0.07)),
    rgba(4, 13, 24, 0.72);
}

.future-card.game-card {
  flex-basis: clamp(190px, 20vw, 270px);
  min-height: 108px;
}

.future-card span {
  color: hsl(var(--period-hue) / 0.96);
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.04em;
}

.future-card strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: currentColor;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.22;
}

.chronology-detail {
  display: grid;
  grid-template-columns: minmax(220px, 0.74fr) minmax(240px, 1fr);
  gap: 0.7rem;
  align-items: stretch;
}

.period-detail,
.event-detail {
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: 6px;
  background: rgba(3, 10, 18, 0.24);
}

.period-detail {
  --period-hue: 204 72% 58%;
  --period-ink: #e6f4ff;
  display: grid;
  align-content: start;
  gap: 0.45rem;
  border-color: hsl(var(--period-hue) / 0.22);
  padding: 0.72rem;
  background:
    linear-gradient(135deg, hsl(var(--period-hue) / 0.14), transparent 58%),
    rgba(3, 10, 18, 0.26);
}

.event-detail {
  --period-hue: 204 72% 58%;
}

.event-detail.tone-transition {
  --period-hue: 27 62% 55%;
}

.event-detail.tone-satirical {
  --period-hue: 36 66% 57%;
}

.event-detail.tone-game {
  --period-hue: 204 92% 67%;
}

.detail-heading {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.detail-heading > span:first-child,
.event-detail > span {
  margin: 0;
  color: hsl(var(--period-hue) / 0.92);
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detail-nav {
  display: inline-flex;
  gap: 0.24rem;
  align-items: center;
}

.detail-nav button {
  display: grid;
  width: 28px;
  height: 26px;
  place-items: center;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 4px;
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

.period-detail h2 {
  margin: 0;
  color: var(--period-ink);
  font-size: 1rem;
  line-height: 1.12;
}

.period-detail dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
  margin: 0;
}

.period-detail div {
  display: grid;
  gap: 0.12rem;
  border-top: 1px solid hsl(var(--period-hue) / 0.16);
  padding-top: 0.4rem;
}

.period-detail dt {
  color: #8da9c4;
  font-size: 0.66rem;
  font-weight: 900;
  text-transform: uppercase;
}

.period-detail dd {
  margin: 0;
  color: var(--period-ink);
  font-weight: 950;
}

.event-detail {
  display: grid;
  align-content: start;
  gap: 0.35rem;
  padding: 0.72rem;
  border-color: hsl(var(--period-hue) / 0.2);
  background:
    linear-gradient(135deg, hsl(var(--period-hue) / 0.1), transparent 58%),
    rgba(3, 10, 18, 0.24);
}

.event-detail strong {
  color: #f6fbff;
  font-size: 0.94rem;
  line-height: 1.28;
}

@media (max-width: 960px) {
  .chronology-heading,
  .chronology-detail,
  .future-briefing {
    grid-template-columns: 1fr;
  }

  .timeline-controls {
    justify-content: flex-start;
  }

  .future-briefing header {
    border-right: 0;
    border-bottom: 1px solid rgba(125, 190, 255, 0.12);
    padding-right: 0;
    padding-bottom: 0.48rem;
  }
}

@media (max-width: 760px) {
  .chronology-panel {
    padding: 0.7rem;
  }

  .timeline-stage::before,
  .timeline-stage::after {
    width: 42px;
  }

  .timeline-side-control {
    width: 32px;
    height: 58px;
    font-size: 1.45rem;
  }

  .timeline-side-control--left {
    left: 0.26rem;
  }

  .timeline-side-control--right {
    right: 0.26rem;
  }

  .timeline-canvas {
    min-height: 330px;
  }

  .period-detail dl {
    grid-template-columns: 1fr;
  }

  .future-card {
    flex-basis: min(74vw, 250px);
  }
}
</style>
