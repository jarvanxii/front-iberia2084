<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BuildingDefinitionDto, ResourceCostDto } from '@/types/game'
import { buildingImage } from '@/utils/buildingImages'
import { resourceIcon } from '@/utils/resourceIcons'

const props = defineProps<{
  buildings: BuildingDefinitionDto[]
}>()

const activeCategory = ref('todos')

const resourceNames: Record<string, string> = {
  pesetas: 'Pesetas',
  votos: 'Votos',
  favores: 'Favores',
}

const orderedBuildings = computed(() =>
  [...props.buildings].sort(
    (a, b) =>
      a.category.localeCompare(b.category, 'es') ||
      a.mapY - b.mapY ||
      a.mapX - b.mapX ||
      a.name.localeCompare(b.name, 'es'),
  ),
)

const categories = computed(() => {
  const counts = new Map<string, number>()
  for (const building of orderedBuildings.value) {
    counts.set(building.category, (counts.get(building.category) ?? 0) + 1)
  }
  return [
    { key: 'todos', label: 'Todos', count: orderedBuildings.value.length },
    ...[...counts.entries()].map(([label, count]) => ({ key: label, label, count })),
  ]
})

const visibleBuildings = computed(() => {
  if (activeCategory.value === 'todos') return orderedBuildings.value
  return orderedBuildings.value.filter((building) => building.category === activeCategory.value)
})

const summary = computed(() => {
  const buildings = orderedBuildings.value
  const longest = buildings.reduce((best, building) => Math.max(best, building.durationSeconds), 0)
  const maxLevel = buildings.reduce((best, building) => Math.max(best, building.maxLevel), 0)
  return {
    total: buildings.length,
    categories: categories.value.length - 1,
    maxLevel,
    longest: secondsLabel(longest),
  }
})

function activeCosts(costs: ResourceCostDto[]) {
  return costs.filter((cost) => cost.amount > 0)
}

function costLabel(cost: ResourceCostDto) {
  return `${cost.amount.toLocaleString('es-ES')} ${resourceNames[cost.code] ?? cost.code}`
}

function secondsLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`
}
</script>

<template>
  <section class="building-guide">
    <header class="building-guide-heading">
      <div class="heading-copy">
        <p class="muted">Catálogo urbano</p>
        <h2>Edificios de provincia</h2>
        <p>
          Cada edificio define una función concreta de tu capital provincial. Aquí se ven usos, costes base,
          duración inicial y estética de referencia, sin enseñar datos privados de ninguna partida.
        </p>
      </div>

      <dl class="building-metrics" aria-label="Resumen de edificios">
        <div>
          <dt>Total</dt>
          <dd>{{ summary.total }}</dd>
        </div>
        <div>
          <dt>Tipos</dt>
          <dd>{{ summary.categories }}</dd>
        </div>
        <div>
          <dt>Nivel máx.</dt>
          <dd>{{ summary.maxLevel }}</dd>
        </div>
        <div>
          <dt>Mayor obra</dt>
          <dd>{{ summary.longest }}</dd>
        </div>
      </dl>
    </header>

    <nav class="building-tabs" aria-label="Filtrar edificios">
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

    <section class="building-grid" aria-label="Edificios disponibles">
      <article v-for="building in visibleBuildings" :key="building.code" class="building-card panel">
        <figure class="building-art">
          <img :src="buildingImage(building.imageKey)" :alt="building.name" loading="lazy" />
        </figure>

        <div class="building-main">
          <div class="building-tags">
            <span>{{ building.category }}</span>
            <span>Nivel {{ building.maxLevel }}</span>
            <span>{{ secondsLabel(building.durationSeconds) }}</span>
          </div>

          <h3>{{ building.name }}</h3>
          <p>{{ building.description }}</p>

          <div class="building-use">
            <span>Uso</span>
            <strong>{{ building.effects.join(' · ') }}</strong>
          </div>
        </div>

        <aside class="building-costs" aria-label="Costes base">
          <h4>Costes base</h4>
          <span v-for="cost in activeCosts(building.costs)" :key="`${building.code}-${cost.code}`">
            <img :src="resourceIcon(cost.code)" :alt="resourceNames[cost.code] ?? cost.code" />
            <strong>{{ costLabel(cost) }}</strong>
          </span>
        </aside>
      </article>
    </section>
  </section>
</template>

<style scoped>
.building-guide {
  display: grid;
  gap: var(--compact-gap);
  scroll-margin-top: calc(var(--home-header-height) + var(--space-page));
}

.building-guide-heading {
  display: grid;
  grid-template-columns: minmax(280px, 0.82fr) minmax(420px, 1fr);
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
.building-main h3 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
}

.heading-copy h2 {
  font-size: clamp(1.65rem, 4vw, 3rem);
  font-weight: 950;
}

.heading-copy p {
  max-width: 82ch;
  margin: 0;
}

.building-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
  min-width: 0;
  margin: 0;
}

.building-metrics div,
.building-card,
.building-use,
.building-costs span {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.building-metrics div {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  padding: var(--compact-card-padding);
}

.building-metrics dt,
.building-costs h4,
.building-use span {
  overflow: hidden;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.building-metrics dd {
  margin: 0;
  color: var(--color-text);
  font-size: 1.02rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
}

.building-tabs {
  display: flex;
  gap: var(--compact-gap-sm);
  min-width: 0;
  overflow-x: auto;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 0.36rem 0;
}

.building-tabs button {
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
  text-align: left;
}

.building-tabs button:hover,
.building-tabs button.active {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.building-tabs strong {
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.building-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--compact-gap);
  min-width: 0;
}

.building-card {
  display: grid;
  grid-template-columns: 154px minmax(0, 1fr);
  grid-template-areas:
    'art main'
    'costs costs';
  gap: var(--compact-gap);
  align-items: stretch;
  min-width: 0;
  padding: var(--compact-card-padding);
}

.building-art {
  grid-area: art;
  width: 154px;
  aspect-ratio: 1.2;
  align-self: start;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.building-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.building-main {
  display: grid;
  align-content: start;
  gap: var(--compact-gap-sm);
  grid-area: main;
  min-width: 0;
}

.building-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.building-tags span {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.16rem 0.32rem;
  color: var(--color-accent);
  background: var(--color-surface-soft);
  font-size: 0.66rem;
  font-weight: 950;
}

.building-main h3 {
  font-size: 1.02rem;
}

.building-main p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.34;
  -webkit-line-clamp: 3;
}

.building-use {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  padding: 0.34rem 0.42rem;
  background: var(--color-surface-soft);
}

.building-use strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-costs {
  display: grid;
  grid-template-columns: auto repeat(3, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
  grid-area: costs;
  align-items: center;
  min-width: 0;
  border-top: 1px solid var(--color-border);
  padding-top: var(--compact-gap-sm);
}

.building-costs h4 {
  margin: 0;
}

.building-costs span {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 0.3rem;
  align-items: center;
  min-width: 0;
  padding: 0.24rem 0.34rem;
  background: var(--color-surface-soft);
}

.building-costs img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.building-costs strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .building-guide-heading,
  .building-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .building-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .building-card,
  .building-costs {
    grid-template-columns: 1fr;
    grid-template-areas:
      'art'
      'main'
      'costs';
  }

  .building-art {
    width: min(100%, 280px);
  }

  .building-costs h4 {
    min-height: 1rem;
  }
}
</style>
