<script setup lang="ts">
import { computed, ref } from 'vue'
import UnitStatsPanel from '@/components/game/UnitStatsPanel.vue'
import type { ResourceCostDto, TroopDefinitionDto } from '@/types/game'
import { comparePartyCodes } from '@/utils/partyOrder'
import { resourceIcon } from '@/utils/resourceIcons'
import { troopPortrait } from '@/utils/troopPortraits'

const props = defineProps<{
  troopDefinitions: TroopDefinitionDto[]
}>()

type TroopTab = 'comunes' | 'transporte' | 'especiales'

interface TroopGroup {
  code: string
  name: string
  shortName: string
  color: string
  units: TroopDefinitionDto[]
}

interface TroopSection {
  code: string
  name: string
  meta: string
  color: string
  units: TroopDefinitionDto[]
}

const activeTab = ref<TroopTab>('comunes')

const resourceNames: Record<string, string> = {
  pesetas: 'Pesetas',
  votos: 'Votos',
  favores: 'Favores',
}

function sortTroops(units: TroopDefinitionDto[]) {
  return [...units].sort(
    (a, b) => a.tier - b.tier || b.attack - a.attack || a.trainingSeconds - b.trainingSeconds || a.code.localeCompare(b.code),
  )
}

const orderedUnits = computed(() => sortTroops(props.troopDefinitions))
const commonUnits = computed(() =>
  orderedUnits.value.filter((unit) => !unit.factionCode && !isTransportUnit(unit)),
)
const transportUnits = computed(() => orderedUnits.value.filter((unit) => !unit.factionCode && isTransportUnit(unit)))
const specialTroopGroups = computed(() => {
  const groups = new Map<string, TroopGroup>()

  for (const unit of orderedUnits.value.filter((current) => current.factionCode)) {
    const code = unit.factionCode ?? 'unknown'
    if (!groups.has(code)) {
      groups.set(code, {
        code,
        name: unit.factionName ?? 'Partido sin identificar',
        shortName: unit.factionShortName ?? code.toUpperCase(),
        color: unit.factionColor ?? 'var(--color-accent-strong)',
        units: [],
      })
    }
    groups.get(code)?.units.push(unit)
  }

  return [...groups.values()].sort((a, b) => comparePartyCodes(a.code, b.code))
})

const tabItems = computed(() => [
  { key: 'comunes' as const, label: 'Comunes', count: commonUnits.value.length },
  { key: 'transporte' as const, label: 'Transporte', count: transportUnits.value.length },
  {
    key: 'especiales' as const,
    label: 'Especiales',
    count: specialTroopGroups.value.reduce((total, group) => total + group.units.length, 0),
  },
])

const visibleSections = computed<TroopSection[]>(() => {
  if (activeTab.value === 'transporte') {
    return [
      {
        code: 'transportes',
        name: 'Medios de transporte',
        meta: 'Logística terrestre, marítima y aérea sin valor de ataque',
        color: 'var(--color-success)',
        units: transportUnits.value,
      },
    ]
  }

  if (activeTab.value === 'especiales') {
    return specialTroopGroups.value.map((group) => ({
      code: group.code,
      name: group.name,
      meta: `${group.shortName} · ${group.units.length} unidades exclusivas`,
      color: group.color,
      units: group.units,
    }))
  }

  return [
    {
      code: 'comunes',
      name: 'Unidades comunes',
      meta: 'Base de entrenamiento compartida por todos los partidos',
      color: 'var(--color-accent)',
      units: commonUnits.value,
    },
  ]
})

function isTransportUnit(unit: TroopDefinitionDto) {
  return Boolean(unit.transportType || unit.role.toLowerCase().startsWith('transporte'))
}

function mainRole(unit: TroopDefinitionDto) {
  if (isTransportUnit(unit)) return unit.transportTypeLabel ?? 'Transporte'
  if (unit.attackType === 'INCISIVE') return 'Incisiva'
  if (unit.attackType === 'MEDIA') return 'Mediática'
  return 'Burocrática'
}

function unitAccent(unit: TroopDefinitionDto) {
  if (unit.factionColor) return unit.factionColor
  if (isTransportUnit(unit)) return 'var(--color-success)'
  if (unit.attackType === 'INCISIVE') return 'var(--color-danger)'
  if (unit.attackType === 'MEDIA') return 'var(--color-info)'
  return 'var(--color-accent)'
}

function buildingLabel(code: string) {
  return code
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function activeCosts(costs: ResourceCostDto[]) {
  return costs.filter((cost) => cost.amount > 0)
}
</script>

<template>
  <section class="troop-guide">
    <nav class="troop-tabs" aria-label="Tipos de unidades">
      <button
        v-for="tab in tabItems"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key }"
        :aria-pressed="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        <span>{{ tab.label }}</span>
        <strong>{{ tab.count }}</strong>
      </button>
    </nav>

    <header class="troop-guide-heading">
      <div class="heading-copy">
        <p class="muted">Catálogo de unidades</p>
        <h2>Unidades disponibles</h2>
      </div>
    </header>

    <section class="unit-sections">
      <article
        v-for="section in visibleSections"
        :key="section.code"
        class="unit-section"
        :style="{ '--section-color': section.color }"
      >
        <header class="unit-section-heading">
          <div>
            <h3>{{ section.name }}</h3>
            <p>{{ section.meta }}</p>
          </div>
          <strong>{{ section.units.length }}</strong>
        </header>

        <div class="unit-list">
          <article
            v-for="unit in section.units"
            :key="unit.code"
            class="unit-row"
            :style="{ '--unit-color': unitAccent(unit) }"
          >
            <figure class="unit-portrait">
              <img :src="troopPortrait(unit.imageKey)" :alt="unit.name" loading="lazy" />
            </figure>

            <div class="unit-main">
              <div class="unit-tags">
                <span>{{ mainRole(unit) }}</span>
                <span>T{{ unit.tier }}</span>
                <span v-if="unit.factionShortName">{{ unit.factionShortName }}</span>
              </div>
              <h4>{{ unit.name }}</h4>
              <p>{{ unit.description }}</p>

              <div class="unlock-block">
                <span>Desbloqueo</span>
                <strong>{{ buildingLabel(unit.unlockBuildingCode) }}</strong>
                <em>Nivel {{ unit.unlockBuildingLevel }}</em>
              </div>
            </div>

            <UnitStatsPanel class="unit-stats" :unit="unit" dense />

            <aside class="unit-economy" aria-label="Costes">
              <h5>Costes</h5>

              <div class="cost-stack">
                <span v-for="cost in activeCosts(unit.costs)" :key="`${unit.code}-${cost.code}`" class="cost-chip">
                  <img :src="resourceIcon(cost.code)" :alt="resourceNames[cost.code] ?? cost.code" />
                  <strong>{{ cost.amount.toLocaleString('es-ES') }}</strong>
                  <em>{{ resourceNames[cost.code] ?? cost.code }}</em>
                </span>
              </div>
            </aside>
          </article>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.troop-guide {
  --troop-tabs-height: 42px;
  display: grid;
  gap: var(--compact-gap);
  padding-top: calc(var(--troop-tabs-height) + var(--compact-gap));
  scroll-margin-top: calc(var(--home-header-height) + var(--troop-tabs-height) + var(--space-page));
}

.troop-guide-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
}

.heading-copy {
  min-width: 0;
}

.heading-copy h2,
.unit-section-heading h3,
.unit-main h4 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
}

.heading-copy h2 {
  font-size: clamp(1.65rem, 4vw, 3rem);
  font-weight: 950;
}

.heading-copy p {
  margin: 0 0 0.16rem;
  font-weight: 850;
}

.troop-tabs {
  position: fixed;
  z-index: 999;
  top: var(--home-header-height);
  right: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  min-height: var(--troop-tabs-height);
  min-width: 0;
  margin: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 34%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 24%, transparent);
  padding: 0.18rem var(--space-page);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 9%, transparent), transparent 34rem),
    linear-gradient(180deg, rgba(10, 22, 36, 0.96), rgba(6, 17, 31, 0.98));
  box-shadow:
    0 10px 18px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

.troop-tabs button {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.48rem;
  align-items: center;
  min-height: 34px;
  border: 0;
  border-right: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
  border-radius: 0;
  padding: 0.32rem 0.62rem;
  color: var(--color-muted);
  background: transparent;
  font-weight: 950;
  text-align: left;
  transition:
    color 0.16s ease,
    background-color 0.16s ease;
}

.troop-tabs button:first-child {
  border-left: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
}

.troop-tabs button::after {
  content: '';
  position: absolute;
  right: 0.42rem;
  bottom: 0.12rem;
  left: 0.42rem;
  height: 2px;
  transform: scaleX(0);
  background: var(--color-accent-strong);
  transform-origin: center;
  transition: transform 0.16s ease;
}

.troop-tabs button:hover,
.troop-tabs button.active {
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.troop-tabs button.active {
  color: var(--color-accent-strong);
}

.troop-tabs button:hover::after,
.troop-tabs button.active::after {
  transform: scaleX(1);
}

.troop-tabs span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.troop-tabs strong {
  color: currentColor;
  font-variant-numeric: tabular-nums;
}

.unit-sections,
.unit-section,
.unit-list {
  display: grid;
  gap: var(--compact-gap);
  min-width: 0;
}

.unit-section {
  border-top: 3px solid var(--section-color);
  padding-top: var(--compact-gap);
}

.unit-section-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap);
  align-items: center;
  min-width: 0;
}

.unit-section-heading p {
  margin: 0.08rem 0 0;
  color: var(--color-muted);
}

.unit-section-heading strong {
  display: grid;
  min-width: 2rem;
  min-height: 2rem;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--section-color) 64%, var(--color-border));
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface);
  font-variant-numeric: tabular-nums;
}

.unit-row {
  display: grid;
  grid-template-columns: 160px minmax(260px, 1fr) minmax(320px, 0.95fr) minmax(220px, 0.72fr);
  gap: var(--compact-gap);
  align-items: stretch;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--unit-color);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background: var(--color-surface);
}

.unit-portrait {
  position: relative;
  min-width: 0;
  width: 160px;
  aspect-ratio: 1 / 1;
  align-self: center;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.unit-portrait::after {
  position: absolute;
  inset: auto 0 0;
  height: 34%;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.36));
  content: '';
}

.unit-portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.unit-main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  align-content: stretch;
  gap: var(--compact-gap-sm);
  min-height: 100%;
  min-width: 0;
}

.unit-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.unit-tags span {
  border: 1px solid color-mix(in srgb, var(--unit-color) 58%, var(--color-border));
  border-radius: var(--radius-sm);
  padding: 0.16rem 0.32rem;
  color: var(--unit-color);
  background: color-mix(in srgb, var(--unit-color) 10%, var(--color-surface));
  font-size: 0.66rem;
  font-weight: 950;
}

.unit-main h4 {
  overflow-wrap: anywhere;
  font-size: 1.04rem;
}

.unit-main p {
  display: -webkit-box;
  align-self: start;
  max-width: 70ch;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.34;
  -webkit-line-clamp: 3;
}

.unit-stats {
  align-self: stretch;
  min-width: 0;
}

.unit-economy {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  align-self: stretch;
  gap: 0.2rem;
  min-width: 0;
}

.unit-economy h5 {
  min-height: 1rem;
  margin: 0;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
  text-transform: uppercase;
}

.cost-stack {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  gap: 0.22rem;
  height: 100%;
  min-width: 0;
}

.cost-chip {
  display: grid;
  grid-template-columns: 18px minmax(0, auto) minmax(0, 1fr);
  gap: 0.28rem;
  align-items: center;
  min-width: 0;
  min-height: 2.06rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.24rem 0.34rem;
  background: var(--color-surface-soft);
}

.cost-chip img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.cost-chip strong {
  color: var(--color-text);
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
}

.cost-chip em {
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unlock-block {
  display: grid;
  align-self: end;
  gap: 0.12rem;
  min-width: 0;
  margin-top: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.34rem 0.42rem;
  background: var(--color-surface-soft);
}

.unlock-block span,
.unlock-block em {
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unlock-block span {
  color: var(--color-accent);
  font-weight: 950;
  text-transform: uppercase;
}

.unlock-block strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .troop-guide-heading {
    grid-template-columns: 1fr;
  }

  .unit-row {
    grid-template-columns: 140px minmax(220px, 1fr) minmax(290px, 1fr);
  }

  .unit-portrait {
    width: 140px;
  }

  .unit-economy {
    grid-column: 2 / -1;
  }

  .cost-stack {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 1fr;
  }
}

@media (max-width: 820px) {
  .unit-row {
    grid-template-columns: 126px minmax(0, 1fr);
  }

  .unit-portrait {
    width: 126px;
  }

  .unit-stats,
  .unit-economy {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .troop-guide {
    gap: var(--compact-gap);
  }

  .cost-stack {
    grid-template-columns: 1fr;
  }

  .troop-tabs {
    grid-template-columns: repeat(3, minmax(96px, 1fr));
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .troop-tabs button {
    min-width: 96px;
    padding: 0.32rem 0.44rem;
  }

  .cost-stack {
    grid-auto-rows: minmax(0, 1fr);
  }

  .unit-row {
    grid-template-columns: 1fr;
    gap: var(--compact-gap);
  }

  .unit-portrait {
    width: min(100%, 280px);
    justify-self: start;
  }
}
</style>
