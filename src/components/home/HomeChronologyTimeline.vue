<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { chronologyEvents, chronologyPeriods, type ChronologyEvent, type ChronologyPeriod } from '@/data/iberiaChronology'
import {
  assignTimelineLanes,
  formatTimelineRange,
  formatTimelineYear,
  timelinePosition,
  timelineRange,
  timelineWidth,
} from '@/utils/chronology'

const zoomSteps = [1, 1.8, 3.2, 5.8, 9.6, 15] as const
const canvasBaseWidth = 3000
const selectedPeriodId = ref('iberia-2084')
const selectedEventIndex = ref(chronologyEvents.length - 1)
const zoomIndex = ref(3)
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
const zoom = computed(() => zoomSteps[zoomIndex.value] ?? 1)
const canvasWidth = computed(() => Math.round(canvasBaseWidth * zoom.value))
const selectedPeriod = computed(
  () => chronologyPeriods.find((period) => period.id === selectedPeriodId.value) ?? chronologyPeriods[0],
)
const selectedEvent = computed(() => chronologyEvents[selectedEventIndex.value] ?? chronologyEvents[chronologyEvents.length - 1] ?? null)
const selectedPeriodEvents = computed(() => {
  const period = selectedPeriod.value
  if (!period) return []
  return chronologyEvents.filter((event) => event.year >= period.startYear && event.year <= period.endYear)
})
const firstYear = computed(() => formatTimelineYear(range.startYear))
const lastYear = computed(() => formatTimelineYear(range.endYear))

const periodSegments = computed(() =>
  periodLanes.map(({ period, lane }) => ({
    period,
    lane,
    left: timelinePosition(period.startYear, range),
    width: timelineWidth(period.startYear, period.endYear, range),
  })),
)

const eventMarkers = computed(() =>
  chronologyEvents.map((event, index) => ({
    event,
    index,
    left: timelinePosition(event.year, range),
    level: index % 5,
  })),
)
const scaleTicks = computed(() =>
  [range.startYear, 476, 711, 1492, 1808, 1936, 1975, 2026, range.endYear].map((year) => ({
    year,
    left: timelinePosition(year, range),
  })),
)

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

function periodEventCount(period: ChronologyPeriod) {
  return chronologyEvents.filter((event) => event.year >= period.startYear && event.year <= period.endYear).length
}

function selectPeriod(period: ChronologyPeriod) {
  selectedPeriodId.value = period.id
  const firstEventIndex = chronologyEvents.findIndex((event) => event.year >= period.startYear && event.year <= period.endYear)
  if (firstEventIndex >= 0) selectedEventIndex.value = firstEventIndex
}

function selectEvent(event: ChronologyEvent, index: number) {
  selectedEventIndex.value = index
  const period = chronologyPeriods.find((item) => event.year >= item.startYear && event.year <= item.endYear)
  if (period) selectedPeriodId.value = period.id
}

function scrollByDirection(direction: 1 | -1) {
  const element = viewport.value
  if (!element) return
  element.scrollBy({ left: direction * Math.max(360, element.clientWidth * 0.72), behavior: 'smooth' })
}

function focusYear(year: number, behavior: ScrollBehavior = 'smooth') {
  const element = viewport.value
  const content = canvas.value
  if (!element || !content) return
  const target = (timelinePosition(year, range) / 100) * content.scrollWidth - element.clientWidth / 2
  const maxScroll = Math.max(0, content.scrollWidth - element.clientWidth)
  element.scrollTo({ left: Math.min(Math.max(0, target), maxScroll), behavior })
}

function resetView() {
  zoomIndex.value = 0
  void nextTick(() => viewport.value?.scrollTo({ left: 0, behavior: 'smooth' }))
}

function focusGameEra() {
  zoomIndex.value = Math.max(zoomIndex.value, 4)
  void nextTick(() => focusYear(2084))
}

function changeZoom(direction: 1 | -1) {
  const activeYear = selectedEvent.value?.year ?? selectedPeriod.value?.startYear ?? 2026
  zoomIndex.value = Math.min(Math.max(0, zoomIndex.value + direction), zoomSteps.length - 1)
  void nextTick(() => focusYear(activeYear))
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

onMounted(() => {
  void nextTick(() => focusYear(2026, 'auto'))
})
</script>

<template>
  <section class="panel chronology-panel" aria-labelledby="chronology-title">
    <header class="chronology-heading">
      <div class="chronology-title-block">
        <p class="chronology-kicker">Eje cronológico</p>
        <h1 id="chronology-title">Historia de España e Iberia 2084</h1>
      </div>

      <div class="timeline-controls" aria-label="Controles del cronograma">
        <button type="button" class="timeline-control" aria-label="Mover hacia atrás" @click="scrollByDirection(-1)">‹</button>
        <button type="button" class="timeline-control" aria-label="Mover hacia delante" @click="scrollByDirection(1)">›</button>
        <button type="button" class="timeline-control" aria-label="Reducir zoom" @click="changeZoom(-1)">−</button>
        <span class="zoom-meter" aria-label="Nivel de zoom">x{{ zoom.toFixed(1) }}</span>
        <button type="button" class="timeline-control" aria-label="Aumentar zoom" @click="changeZoom(1)">+</button>
        <button type="button" class="timeline-chip" @click="resetView">218 a.C.</button>
        <button type="button" class="timeline-chip" @click="focusYear(2026)">2026</button>
        <button type="button" class="timeline-chip is-strong" @click="focusGameEra">2084</button>
      </div>
    </header>

    <div
      ref="viewport"
      class="timeline-viewport"
      :class="{ dragging: dragState }"
      tabindex="0"
      aria-label="Cronograma desplazable"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        ref="canvas"
        class="timeline-canvas"
        :style="{
          width: `${canvasWidth}px`,
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
          <button
            v-for="marker in eventMarkers"
            :key="`${marker.event.year}-${marker.index}`"
            type="button"
            class="event-marker"
            :class="[`tone-${marker.event.tone}`, { selected: marker.index === selectedEventIndex }]"
            :style="{ left: `${marker.left}%`, top: `${marker.level * 31}px` }"
            :aria-label="`${formatTimelineYear(marker.event.year)}. ${marker.event.title}`"
            @click="selectEvent(marker.event, marker.index)"
          >
            <span class="event-pin" aria-hidden="true"></span>
            <span class="event-year">{{ formatTimelineYear(marker.event.year) }}</span>
          </button>
        </div>
      </div>
    </div>

    <section v-if="selectedPeriod" class="chronology-detail" aria-label="Detalle del periodo seleccionado">
      <article class="period-detail" :class="`tone-${selectedPeriod.tone}`" :style="periodColorVars(selectedPeriod)">
        <p>{{ formatTimelineRange(selectedPeriod.startYear, selectedPeriod.endYear) }}</p>
        <h2>{{ selectedPeriod.title }}</h2>
        <dl>
          <div>
            <dt>Duración</dt>
            <dd>{{ selectedPeriod.endYear - selectedPeriod.startYear }} años</dd>
          </div>
          <div>
            <dt>Eventos</dt>
            <dd>{{ periodEventCount(selectedPeriod) }}</dd>
          </div>
        </dl>
      </article>

      <article v-if="selectedEvent" class="event-detail" :class="`tone-${selectedEvent.tone}`">
        <span>{{ formatTimelineYear(selectedEvent.year) }}</span>
        <strong>{{ selectedEvent.title }}</strong>
      </article>

      <div class="period-events" aria-label="Eventos del periodo">
        <button
          v-for="event in selectedPeriodEvents"
          :key="`${selectedPeriod.id}-${event.year}-${event.title}`"
          type="button"
          class="period-event"
          :class="{ selected: event === selectedEvent }"
          @click="selectEvent(event, chronologyEvents.indexOf(event))"
        >
          <span>{{ formatTimelineYear(event.year) }}</span>
          <strong>{{ event.title }}</strong>
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.chronology-panel {
  display: grid;
  gap: 0.75rem;
  overflow: hidden;
  padding: clamp(0.82rem, 1.5vw, 1.15rem);
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
    rgba(4, 13, 24, 0.48);
  font-size: 0.78rem;
  font-weight: 950;
  line-height: 1;
}

.timeline-control {
  width: 34px;
  padding: 0;
  font-size: 1.1rem;
}

.timeline-chip.is-strong,
.timeline-control:hover,
.timeline-chip:hover {
  border-color: rgba(155, 214, 255, 0.34);
  color: #ffffff;
  background: rgba(90, 167, 232, 0.12);
}

.zoom-meter {
  min-width: 54px;
  color: #9bd6ff;
}

.timeline-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid rgba(125, 190, 255, 0.18);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.032), transparent 42%),
    radial-gradient(circle at 92% 12%, rgba(90, 167, 232, 0.1), transparent 19rem),
    repeating-linear-gradient(90deg, rgba(125, 190, 255, 0.045) 0 1px, transparent 1px 120px),
    rgba(3, 10, 18, 0.34);
  cursor: grab;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 -20px 42px rgba(0, 0, 0, 0.16);
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 214, 255, 0.38) transparent;
}

.timeline-viewport.dragging {
  cursor: grabbing;
}

.timeline-canvas {
  position: relative;
  min-width: 100%;
  height: calc(236px + var(--period-lanes) * 48px);
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
  border-left: 1px solid rgba(125, 190, 255, 0.09);
  padding-left: 0.45rem;
  transform: translateX(-1px);
  white-space: nowrap;
}

.timeline-scale span.last {
  padding-right: 0.45rem;
  padding-left: 0;
  transform: translateX(-100%);
  border-right: 1px solid rgba(125, 190, 255, 0.09);
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
  height: calc(var(--period-lanes) * 48px);
}

.period-segment {
  --period-hue: 204 72% 58%;
  --period-ink: #e6f4ff;
  position: absolute;
  display: grid;
  min-width: 4px;
  height: 38px;
  align-content: center;
  gap: 0.04rem;
  overflow: hidden;
  border: 1px solid hsl(var(--period-hue) / 0.34);
  border-radius: 4px;
  padding: 0.28rem 0.45rem;
  color: var(--period-ink);
  background:
    linear-gradient(180deg, hsl(var(--period-hue) / 0.3), hsl(var(--period-hue) / 0.1) 64%),
    linear-gradient(90deg, hsl(var(--period-hue) / 0.2), rgba(3, 10, 18, 0.24));
  text-align: left;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.075),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18),
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
    linear-gradient(180deg, hsl(var(--period-hue) / 0.42), hsl(var(--period-hue) / 0.14) 66%),
    linear-gradient(90deg, hsl(var(--period-hue) / 0.3), rgba(5, 16, 30, 0.2));
}

.period-segment.selected {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.11),
    inset 0 0 0 1px hsl(var(--period-hue) / 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.035),
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
  right: 0;
  bottom: 14px;
  left: 0;
  height: 168px;
  border-top: 1px solid rgba(125, 190, 255, 0.1);
}

.event-marker {
  position: absolute;
  display: grid;
  min-width: 38px;
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
  width: 9px;
  height: 22px;
  border-radius: 999px;
  background: #6faee8;
  box-shadow: 0 0 0 4px rgba(111, 174, 232, 0.1);
}

.event-marker.tone-satirical .event-pin {
  background: #d8ae67;
  box-shadow: 0 0 0 4px rgba(216, 174, 103, 0.11);
}

.event-marker.tone-game .event-pin {
  background: #9bd6ff;
  box-shadow: 0 0 0 4px rgba(155, 214, 255, 0.13);
}

.event-marker.selected .event-pin,
.event-marker:hover .event-pin {
  filter: brightness(1.18);
  transform: scaleY(1.12);
}

.event-year {
  max-width: 64px;
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: 3px;
  padding: 0.08rem 0.28rem;
  background: rgba(3, 10, 18, 0.72);
  color: currentColor;
  font-size: 0.6rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chronology-detail {
  display: grid;
  grid-template-columns: minmax(220px, 0.74fr) minmax(240px, 1fr);
  gap: 0.7rem;
  align-items: stretch;
}

.period-detail,
.event-detail,
.period-event {
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

.period-detail p,
.event-detail span {
  margin: 0;
  color: hsl(var(--period-hue) / 0.92);
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.period-detail h2 {
  margin: 0;
  color: var(--period-ink);
  font-size: 1rem;
  line-height: 1.12;
}

.period-detail dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  align-content: center;
  gap: 0.35rem;
  padding: 0.72rem;
}

.event-detail strong {
  color: #f6fbff;
  font-size: 0.94rem;
  line-height: 1.28;
}

.period-events {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.44rem;
  max-height: 176px;
  overflow: auto;
  padding-right: 0.18rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 214, 255, 0.34) transparent;
}

.period-event {
  display: grid;
  gap: 0.18rem;
  min-height: 64px;
  padding: 0.52rem 0.58rem;
  color: #dceeff;
  text-align: left;
}

.period-event:hover,
.period-event.selected {
  border-color: rgba(155, 214, 255, 0.28);
  background: rgba(90, 167, 232, 0.075);
}

.period-event span {
  color: #9bd6ff;
  font-size: 0.66rem;
  font-weight: 950;
}

.period-event strong {
  color: currentColor;
  font-size: 0.8rem;
  line-height: 1.24;
}

@media (max-width: 960px) {
  .chronology-heading,
  .chronology-detail {
    grid-template-columns: 1fr;
  }

  .timeline-controls {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .chronology-panel {
    padding: 0.7rem;
  }

  .timeline-canvas {
    height: calc(260px + var(--period-lanes) * 48px);
  }

  .event-layer {
    height: 190px;
  }

  .period-events {
    grid-template-columns: 1fr;
    max-height: 230px;
  }
}
</style>
