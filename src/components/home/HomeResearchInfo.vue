<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResearchDefinitionDto, ResourceCostDto } from '@/types/game'
import { comparePartyCodes } from '@/utils/partyOrder'
import { researchImage } from '@/utils/researchImages'
import { resourceIcon } from '@/utils/resourceIcons'

const props = defineProps<{
  research: ResearchDefinitionDto[]
}>()

const activeGroup = ref('comunes')

const resourceNames: Record<string, string> = {
  pesetas: 'Pesetas',
  votos: 'Votos',
  favores: 'Favores',
}

const orderedResearch = computed(() =>
  [...props.research].sort(
    (a, b) =>
      (a.factionCode ? 1 : 0) - (b.factionCode ? 1 : 0) ||
      comparePartyCodes(a.factionCode, b.factionCode) ||
      a.durationSeconds - b.durationSeconds ||
      a.name.localeCompare(b.name, 'es'),
  ),
)

const commonResearch = computed(() => orderedResearch.value.filter((item) => !item.factionCode))
const factionGroups = computed(() => {
  const groups = new Map<string, { key: string; name: string; shortName: string; color: string; items: ResearchDefinitionDto[] }>()
  for (const item of orderedResearch.value.filter((current) => current.factionCode)) {
    const key = item.factionCode ?? 'unknown'
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: item.factionName ?? 'Partido sin identificar',
        shortName: item.factionShortName ?? key.toUpperCase(),
        color: item.factionColor ?? 'var(--color-accent)',
        items: [],
      })
    }
    groups.get(key)?.items.push(item)
  }
  return [...groups.values()].sort((a, b) => comparePartyCodes(a.key, b.key))
})

const tabs = computed(() => [
  { key: 'comunes', label: 'Comunes', count: commonResearch.value.length },
  ...factionGroups.value.map((group) => ({ key: group.key, label: group.shortName, count: group.items.length })),
])

const visibleResearch = computed(() => {
  if (activeGroup.value === 'comunes') return commonResearch.value
  return factionGroups.value.find((group) => group.key === activeGroup.value)?.items ?? []
})

const activeParty = computed(() => factionGroups.value.find((group) => group.key === activeGroup.value) ?? null)

const summary = computed(() => {
  const longest = orderedResearch.value.reduce((best, item) => Math.max(best, item.durationSeconds), 0)
  return {
    total: orderedResearch.value.length,
    common: commonResearch.value.length,
    special: factionGroups.value.reduce((total, group) => total + group.items.length, 0),
    parties: factionGroups.value.length,
    longest: secondsLabel(longest),
  }
})

function costsFor(item: ResearchDefinitionDto): ResourceCostDto[] {
  return [
    { code: 'pesetas', amount: item.costPesetas },
    { code: 'votos', amount: item.costVotos },
    { code: 'favores', amount: item.costFavores },
  ].filter((cost) => cost.amount > 0)
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
  <section class="research-guide">
    <header class="research-guide-heading">
      <div class="heading-copy">
        <p class="muted">Catálogo tecnológico</p>
        <h2>Investigaciones</h2>
        <p>
          Las investigaciones comunes están disponibles para cualquier jugador. Las especiales pertenecen a un partido
          concreto y refuerzan su personalidad sin ligar territorios ni provincias a ese partido.
        </p>
      </div>

      <dl class="research-metrics" aria-label="Resumen de investigaciones">
        <div>
          <dt>Total</dt>
          <dd>{{ summary.total }}</dd>
        </div>
        <div>
          <dt>Comunes</dt>
          <dd>{{ summary.common }}</dd>
        </div>
        <div>
          <dt>Especiales</dt>
          <dd>{{ summary.special }}</dd>
        </div>
        <div>
          <dt>Partidos</dt>
          <dd>{{ summary.parties }}</dd>
        </div>
        <div>
          <dt>Mayor duración</dt>
          <dd>{{ summary.longest }}</dd>
        </div>
      </dl>
    </header>

    <nav class="research-tabs" aria-label="Filtrar investigaciones">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ active: activeGroup === tab.key }"
        :aria-pressed="activeGroup === tab.key"
        @click="activeGroup = tab.key"
      >
        <span>{{ tab.label }}</span>
        <strong>{{ tab.count }}</strong>
      </button>
    </nav>

    <header v-if="activeParty" class="party-strip" :style="{ '--party-color': activeParty.color }">
      <span>{{ activeParty.shortName }}</span>
      <strong>{{ activeParty.name }}</strong>
    </header>

    <section class="research-grid" aria-label="Investigaciones disponibles">
      <article
        v-for="item in visibleResearch"
        :key="item.code"
        class="research-card panel"
        :style="{ '--research-color': item.factionColor ?? 'var(--color-accent)' }"
      >
        <figure class="research-art">
          <img :src="researchImage(item.imageKey)" :alt="item.name" loading="lazy" />
        </figure>

        <div class="research-main">
          <div class="research-tags">
            <span>{{ item.category }}</span>
            <span v-if="item.factionShortName">{{ item.factionShortName }}</span>
            <span>{{ secondsLabel(item.durationSeconds) }}</span>
          </div>
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>

          <div class="research-effect">
            <span>Efecto</span>
            <strong>{{ item.effectLabel }}</strong>
          </div>
        </div>

        <aside class="research-costs" aria-label="Costes">
          <h4>Costes</h4>
          <span v-for="cost in costsFor(item)" :key="`${item.code}-${cost.code}`">
            <img :src="resourceIcon(cost.code)" :alt="resourceNames[cost.code] ?? cost.code" />
            <strong>{{ costLabel(cost) }}</strong>
          </span>
        </aside>
      </article>
    </section>
  </section>
</template>

<style scoped>
.research-guide {
  display: grid;
  gap: var(--compact-gap);
  scroll-margin-top: calc(var(--home-header-height) + var(--space-page));
}

.research-guide-heading {
  display: grid;
  grid-template-columns: minmax(280px, 0.78fr) minmax(560px, 1fr);
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
.research-main h3 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
}

.heading-copy h2 {
  font-size: clamp(1.65rem, 4vw, 3rem);
  font-weight: 950;
}

.heading-copy p,
.research-main p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.34;
}

.research-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
  min-width: 0;
  margin: 0;
}

.research-metrics div,
.research-card,
.research-effect,
.research-costs span {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.research-metrics div {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  padding: var(--compact-card-padding);
}

.research-metrics dt,
.research-effect span,
.research-costs h4 {
  overflow: hidden;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.research-metrics dd {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
}

.research-tabs {
  display: flex;
  gap: var(--compact-gap-sm);
  min-width: 0;
  overflow-x: auto;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 0.36rem 0;
}

.research-tabs button {
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

.research-tabs button:hover,
.research-tabs button.active {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.research-tabs strong {
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.party-strip {
  display: flex;
  gap: var(--compact-gap-sm);
  align-items: center;
  min-width: 0;
  border-left: 3px solid var(--party-color);
  padding: 0.36rem 0 0.36rem 0.58rem;
}

.party-strip span {
  color: var(--party-color);
  font-weight: 950;
}

.party-strip strong {
  color: var(--color-text);
}

.research-grid {
  display: grid;
  gap: var(--compact-gap);
}

.research-card {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) minmax(220px, 0.4fr);
  gap: var(--compact-gap);
  align-items: stretch;
  min-width: 0;
  border-left: 4px solid var(--research-color);
  padding: var(--compact-card-padding);
}

.research-art {
  width: 160px;
  aspect-ratio: 1.16;
  align-self: center;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.research-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.research-main {
  display: grid;
  align-content: start;
  gap: var(--compact-gap-sm);
  min-width: 0;
}

.research-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.research-tags span {
  border: 1px solid color-mix(in srgb, var(--research-color) 58%, var(--color-border));
  border-radius: var(--radius-sm);
  padding: 0.16rem 0.32rem;
  color: var(--research-color);
  background: color-mix(in srgb, var(--research-color) 10%, var(--color-surface));
  font-size: 0.66rem;
  font-weight: 950;
}

.research-main h3 {
  font-size: 1.05rem;
}

.research-effect {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  padding: 0.34rem 0.42rem;
  background: var(--color-surface-soft);
}

.research-effect strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.research-costs {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  gap: 0.22rem;
  min-width: 0;
}

.research-costs h4 {
  margin: 0;
}

.research-costs span {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 0.3rem;
  align-items: center;
  min-width: 0;
  min-height: 2.08rem;
  padding: 0.24rem 0.34rem;
  background: var(--color-surface-soft);
}

.research-costs img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.research-costs strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .research-guide-heading,
  .research-card {
    grid-template-columns: 1fr;
  }

  .research-art {
    width: min(100%, 300px);
  }
}

@media (max-width: 700px) {
  .research-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
