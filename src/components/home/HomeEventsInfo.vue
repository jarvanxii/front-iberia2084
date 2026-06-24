<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DisasterPlanDto, EventDefinitionDto } from '@/types/game'
import { eventImage } from '@/utils/eventImages'

const props = defineProps<{
  events: EventDefinitionDto[]
  disasterPlans: DisasterPlanDto[]
}>()

const activeCategory = ref('todos')

const orderedEvents = computed(() =>
  [...props.events].sort((a, b) => b.baseSeverity - a.baseSeverity || a.name.localeCompare(b.name, 'es')),
)

const categories = computed(() => {
  const counts = new Map<string, number>()
  for (const event of orderedEvents.value) counts.set(event.category, (counts.get(event.category) ?? 0) + 1)
  return [
    { key: 'todos', label: 'Todos', count: orderedEvents.value.length },
    ...[...counts.entries()].map(([label, count]) => ({ key: label, label, count })),
  ]
})

const visibleEvents = computed(() => {
  if (activeCategory.value === 'todos') return orderedEvents.value
  return orderedEvents.value.filter((event) => event.category === activeCategory.value)
})

const summary = computed(() => {
  const maxSeverity = orderedEvents.value.reduce((best, event) => Math.max(best, event.baseSeverity), 0)
  const longest = orderedEvents.value.reduce((best, event) => Math.max(best, event.durationSeconds), 0)
  return {
    total: orderedEvents.value.length,
    categories: categories.value.length - 1,
    maxSeverity,
    longest: secondsLabel(longest),
    plans: props.disasterPlans.length,
  }
})

function secondsLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`
}

function catalogDescription(description: string) {
  return description.replace('{territory}', 'una provincia')
}
</script>

<template>
  <section class="event-guide">
    <header class="event-guide-heading">
      <div class="heading-copy">
        <p class="muted">Catálogo global</p>
        <h2>Eventos de partida</h2>
        <p>
          Los eventos son crisis comunes del mundo activo: cuando aparecen, todos los jugadores compiten bajo la misma
          presión. No pertenecen a un jugador concreto; alteran ritmo, recursos, defensa y lectura del mapa.
        </p>
      </div>

      <dl class="event-metrics" aria-label="Resumen de eventos">
        <div>
          <dt>Total</dt>
          <dd>{{ summary.total }}</dd>
        </div>
        <div>
          <dt>Tipos</dt>
          <dd>{{ summary.categories }}</dd>
        </div>
        <div>
          <dt>Severidad máx.</dt>
          <dd>{{ summary.maxSeverity }}</dd>
        </div>
        <div>
          <dt>Duración máx.</dt>
          <dd>{{ summary.longest }}</dd>
        </div>
        <div>
          <dt>Planes</dt>
          <dd>{{ summary.plans }}</dd>
        </div>
      </dl>
    </header>

    <nav class="event-tabs" aria-label="Filtrar eventos">
      <button
        v-for="category in categories"
        :key="category.key"
        type="button"
        :class="{ active: activeCategory === category.key }"
        :aria-pressed="activeCategory === category.key"
        @click="activeCategory = category.key"
      >
        <span>{{ category.label }}</span>
        <strong>{{ category.count }}</strong>
      </button>
    </nav>

    <section class="event-grid" aria-label="Eventos disponibles">
      <article v-for="event in visibleEvents" :key="event.code" class="event-card panel">
        <figure class="event-art">
          <img :src="eventImage(event.imageKey)" :alt="event.name" loading="lazy" />
        </figure>

        <div class="event-main">
          <div class="event-tags">
            <span>{{ event.category }}</span>
            <span>Severidad {{ event.baseSeverity }}</span>
            <span>{{ secondsLabel(event.durationSeconds) }}</span>
          </div>
          <h3>{{ event.name }}</h3>
          <p>{{ catalogDescription(event.description) }}</p>
        </div>

        <dl class="event-effects">
          <div>
            <dt>Alcance</dt>
            <dd>{{ event.scopeLabel }}</dd>
          </div>
          <div>
            <dt>Impacto</dt>
            <dd>{{ event.impactLabel }}</dd>
          </div>
          <div>
            <dt>Respuesta</dt>
            <dd>{{ event.responseLabel }}</dd>
          </div>
        </dl>
      </article>
    </section>
  </section>
</template>

<style scoped>
.event-guide {
  display: grid;
  gap: var(--compact-gap);
  scroll-margin-top: calc(var(--home-header-height) + var(--space-page));
}

.event-guide-heading {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(520px, 1fr);
  gap: var(--compact-gap);
  align-items: end;
  min-width: 0;
}

.heading-copy {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.heading-copy h2,
.event-main h3 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
}

.heading-copy h2 {
  font-size: clamp(1.65rem, 4vw, 3rem);
  font-weight: 950;
}

.heading-copy p,
.event-main p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.34;
}

.event-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
  min-width: 0;
  margin: 0;
}

.event-metrics div,
.event-card,
.event-effects div {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.event-metrics div {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  padding: var(--compact-card-padding);
}

.event-metrics dt,
.event-effects dt {
  overflow: hidden;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.event-metrics dd {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
}

.event-tabs {
  display: flex;
  gap: var(--compact-gap-sm);
  min-width: 0;
  overflow-x: auto;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 0.36rem 0;
}

.event-tabs button {
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.45rem;
  align-items: center;
  min-width: max-content;
  min-height: 34px;
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 0.26rem 0.18rem;
  color: var(--color-muted);
  background: transparent;
  font-weight: 950;
}

.event-tabs button:hover,
.event-tabs button.active {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.event-tabs strong {
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--compact-gap);
}

.event-card {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: var(--compact-gap);
  align-items: stretch;
  min-width: 0;
  padding: var(--compact-card-padding);
}

.event-art {
  width: 168px;
  aspect-ratio: 1.16;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.event-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-main {
  display: grid;
  align-content: start;
  gap: var(--compact-gap-sm);
  min-width: 0;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.event-tags span {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.16rem 0.32rem;
  color: var(--color-accent);
  background: var(--color-surface-soft);
  font-size: 0.66rem;
  font-weight: 950;
}

.event-main h3 {
  font-size: 1.05rem;
}

.event-effects {
  display: grid;
  gap: var(--compact-gap-sm);
  grid-column: 1 / -1;
  margin: 0;
}

.event-effects div {
  display: grid;
  gap: 0.12rem;
  padding: 0.34rem 0.42rem;
  background: var(--color-surface-soft);
}

.event-effects dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 850;
  line-height: 1.28;
}

@media (max-width: 1180px) {
  .event-guide-heading,
  .event-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .event-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .event-card {
    grid-template-columns: 1fr;
  }

  .event-art {
    width: min(100%, 300px);
  }
}
</style>
