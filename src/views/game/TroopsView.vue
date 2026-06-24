<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import UnitStatsPanel from '@/components/game/UnitStatsPanel.vue'
import AppDropdown from '@/components/ui/AppDropdown.vue'
import { useSessionStore } from '@/stores/session'
import type { ResourceCostDto, TroopDefinitionDto } from '@/types/game'
import { comparePartyCodes } from '@/utils/partyOrder'
import { troopPortrait } from '@/utils/troopPortraits'

const session = useSessionStore()
const selectedCityId = ref<number | null>(null)
const troopDraft = reactive<Record<string, number>>({})
const deployDraft = reactive<Record<string, number>>({})

interface TroopGroup {
  code: string
  name: string
  shortName: string
  color: string
  units: TroopDefinitionDto[]
}

const state = computed(() => session.state)
const cities = computed(() => state.value?.cities ?? [])
const troops = computed(() => state.value?.troops ?? [])
const troopDefinitions = computed(() => state.value?.troopDefinitions ?? [])
const garrisons = computed(() => state.value?.garrisons ?? [])
const resources = computed(() => state.value?.resources ?? [])
const playerFactionCode = computed(() => state.value?.player?.faction.code ?? null)
const selectedCity = computed(() => {
  if (!cities.value.length) return null
  return cities.value.find((city) => city.id === selectedCityId.value) ?? cities.value[0]
})
const selectedCityOptionValue = computed(() => selectedCity.value?.id ?? null)
const cityOptions = computed(() =>
  cities.value.map((city) => ({
    value: city.id,
    label: city.name,
    meta: `${city.region} · defensa ${city.defense}`,
    badge: city.capital ? 'Capital' : undefined,
  })),
)
const resourceMap = computed(() => new Map(resources.value.map((resource) => [resource.code, resource.amount])))
const troopMap = computed(() => new Map(troops.value.map((troop) => [troop.code, troop.amount])))
const cityGarrison = computed(() =>
  garrisons.value.filter((garrison) => garrison.territoryId === selectedCity.value?.id),
)

function sortTroops(units: TroopDefinitionDto[]) {
  return [...units].sort(
    (a, b) => a.tier - b.tier || a.trainingSeconds - b.trainingSeconds || a.code.localeCompare(b.code),
  )
}

const commonTroopDefinitions = computed(() =>
  sortTroops(troopDefinitions.value.filter((unit) => !unit.factionCode && !isTransportUnit(unit))),
)
const transportTroopDefinitions = computed(() =>
  sortTroops(troopDefinitions.value.filter((unit) => !unit.factionCode && isTransportUnit(unit))),
)
const specialTroopGroups = computed(() => {
  const groups = new Map<string, TroopGroup>()

  for (const unit of sortTroops(troopDefinitions.value.filter((current) => current.factionCode))) {
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

function enough(costs: ResourceCostDto[]) {
  return costs.every((cost) => (resourceMap.value.get(cost.code) ?? 0) >= cost.amount)
}

function resourceName(code: string) {
  return resources.value.find((resource) => resource.code === code)?.name ?? code
}

function amountFor(unitCode: string) {
  return Math.max(1, Number(troopDraft[unitCode] || 1))
}

function deployAmount(unitCode: string) {
  return Math.max(1, Number(deployDraft[unitCode] || 1))
}

function troopCosts(unit: TroopDefinitionDto) {
  return unit.costs.map((cost) => ({ ...cost, amount: cost.amount * amountFor(unit.code) }))
}

function costLabel(costs: ResourceCostDto[]) {
  return costs.map((cost) => `${cost.amount} ${resourceName(cost.code)}`).join(' · ')
}

function canTrain(unit: TroopDefinitionDto) {
  return !unit.factionCode || unit.factionCode === playerFactionCode.value
}

function unitStatus(unit: TroopDefinitionDto) {
  if (unit.factionShortName) return `Especial ${unit.factionShortName} · T${unit.tier}`
  return `${unit.role} · T${unit.tier}`
}

function isTransportUnit(unit: TroopDefinitionDto) {
  return Boolean(unit.transportType || unit.role.toLowerCase().startsWith('transporte'))
}

function partyGroupStatus(group: TroopGroup) {
  if (group.code === playerFactionCode.value) return 'Tu partido'
  return `Solo ${group.shortName}`
}

function selectCity(cityId: string | number) {
  selectedCityId.value = Number(cityId)
}

async function train(unit: TroopDefinitionDto) {
  if (!canTrain(unit)) return
  await session.actions.trainTroops(unit.code, amountFor(unit.code))
  troopDraft[unit.code] = 1
}

async function deploy(unit: TroopDefinitionDto) {
  if (!selectedCity.value) return
  await session.actions.deployTroops(selectedCity.value.id, unit.code, deployAmount(unit.code))
  deployDraft[unit.code] = 1
}
</script>

<template>
  <section v-if="state" class="troops-view">
    <article class="panel city-selector">
      <div>
        <p class="muted">Destino de guarnición</p>
        <h2>{{ selectedCity?.name ?? 'Sin provincia controlada' }}</h2>
      </div>
      <AppDropdown
        :model-value="selectedCityOptionValue"
        :options="cityOptions"
        aria-label="Seleccionar destino de guarnición"
        placeholder="Elige provincia"
        @update:model-value="selectCity"
      />
    </article>

    <section class="troops-layout">
      <article class="panel roster-panel">
        <div class="section-title">
          <div>
            <p class="muted">Generación y cola</p>
            <h2>Unidades comunes</h2>
          </div>
          <button class="app-button secondary" @click="() => session.refresh()">Actualizar</button>
        </div>

        <div class="troop-list">
          <article v-for="unit in commonTroopDefinitions" :key="unit.code" class="troop-row">
            <figure class="unit-portrait">
              <img :src="troopPortrait(unit.imageKey)" :alt="unit.name" loading="lazy" />
              <figcaption>{{ unit.name }}</figcaption>
            </figure>
            <div class="troop-main">
              <span class="status">{{ unitStatus(unit) }}</span>
              <h3>{{ unit.name }}</h3>
              <p>{{ unit.description }}</p>
              <div class="troop-meta">
                <small>Reserva {{ troopMap.get(unit.code) ?? 0 }}</small>
                <small>Coste: {{ costLabel(troopCosts(unit)) }}</small>
              </div>
            </div>
            <UnitStatsPanel class="troop-stat-block" :unit="unit" dense />
            <div class="troop-actions">
              <label>
                Crear
                <input v-model.number="troopDraft[unit.code]" type="number" min="1" max="250" />
              </label>
              <button class="app-button" :disabled="session.loading || !enough(troopCosts(unit))" @click="train(unit)">
                Generar
              </button>
              <label>
                Asignar
                <input v-model.number="deployDraft[unit.code]" type="number" min="1" max="250" />
              </label>
              <button
                class="app-button secondary"
                :disabled="session.loading || !selectedCity || (troopMap.get(unit.code) ?? 0) < deployAmount(unit.code)"
                @click="deploy(unit)"
              >
                Destinar
              </button>
            </div>
          </article>
        </div>

        <section v-if="transportTroopDefinitions.length" class="special-section transport-section">
          <header class="special-title">
            <p class="muted">Logística territorial</p>
            <h2>Medios de transporte</h2>
          </header>

          <div class="troop-list">
            <article v-for="unit in transportTroopDefinitions" :key="unit.code" class="troop-row transport-row">
              <figure class="unit-portrait">
                <img :src="troopPortrait(unit.imageKey)" :alt="unit.name" loading="lazy" />
                <figcaption>{{ unit.name }}</figcaption>
              </figure>
              <div class="troop-main">
                <span class="status">{{ unitStatus(unit) }}</span>
                <h3>{{ unit.name }}</h3>
                <p>{{ unit.description }}</p>
                <div class="troop-meta">
                  <small>Reserva {{ troopMap.get(unit.code) ?? 0 }}</small>
                  <small>Coste: {{ costLabel(troopCosts(unit)) }}</small>
                </div>
              </div>
              <UnitStatsPanel class="troop-stat-block" :unit="unit" dense />
              <div class="troop-actions">
                <label>
                  Crear
                  <input v-model.number="troopDraft[unit.code]" type="number" min="1" max="250" />
                </label>
                <button class="app-button" :disabled="session.loading || !enough(troopCosts(unit))" @click="train(unit)">
                  Generar
                </button>
                <label>
                  Asignar
                  <input v-model.number="deployDraft[unit.code]" type="number" min="1" max="250" />
                </label>
                <button
                  class="app-button secondary"
                  :disabled="session.loading || !selectedCity || (troopMap.get(unit.code) ?? 0) < deployAmount(unit.code)"
                  @click="deploy(unit)"
                >
                  Destinar
                </button>
              </div>
            </article>
          </div>
        </section>

        <section v-if="specialTroopGroups.length" class="special-section">
          <header class="special-title">
            <p class="muted">Unidades específicas de cada partido</p>
            <h2>Especialistas de partido</h2>
          </header>

          <section
            v-for="group in specialTroopGroups"
            :key="group.code"
            class="party-special-block"
            :style="{ '--party-color': group.color }"
          >
            <header class="party-heading">
              <span>{{ group.shortName }}</span>
              <div>
                <h3>{{ group.name }}</h3>
                <p>{{ partyGroupStatus(group) }}</p>
              </div>
            </header>

            <div class="troop-list">
              <article v-for="unit in group.units" :key="unit.code" class="troop-row special-row">
                <figure class="unit-portrait">
                  <img :src="troopPortrait(unit.imageKey)" :alt="unit.name" loading="lazy" />
                  <figcaption>{{ unit.name }}</figcaption>
                </figure>
                <div class="troop-main">
                  <span class="status">{{ unitStatus(unit) }}</span>
                  <h3>{{ unit.name }}</h3>
                  <p>{{ unit.description }}</p>
                  <div class="troop-meta">
                    <small>Reserva {{ troopMap.get(unit.code) ?? 0 }}</small>
                    <small>Coste: {{ costLabel(troopCosts(unit)) }}</small>
                  </div>
                </div>
                <UnitStatsPanel class="troop-stat-block" :unit="unit" dense />
                <div class="troop-actions">
                  <label>
                    Crear
                    <input v-model.number="troopDraft[unit.code]" type="number" min="1" max="250" />
                  </label>
                  <button
                    class="app-button"
                    :disabled="session.loading || !canTrain(unit) || !enough(troopCosts(unit))"
                    @click="train(unit)"
                  >
                    {{ canTrain(unit) ? 'Generar' : `Solo ${unit.factionShortName}` }}
                  </button>
                  <label>
                    Asignar
                    <input v-model.number="deployDraft[unit.code]" type="number" min="1" max="250" />
                  </label>
                  <button
                    class="app-button secondary"
                    :disabled="
                      session.loading || !selectedCity || (troopMap.get(unit.code) ?? 0) < deployAmount(unit.code)
                    "
                    @click="deploy(unit)"
                  >
                    Destinar
                  </button>
                </div>
              </article>
            </div>
          </section>
        </section>
      </article>

      <aside class="side-stack">
        <article class="panel">
          <h2>Guarnición local</h2>
          <div v-if="!cityGarrison.length" class="empty">
            Esta provincia no tiene unidades asignadas.
          </div>
          <div v-for="unit in cityGarrison" :key="unit.unitCode" class="garrison-row">
            <span>{{ unit.unitName }}</span>
            <strong>{{ unit.amount }}</strong>
          </div>
        </article>

        <article class="panel">
          <h2>Cola de generación</h2>
          <div v-if="!state.trainingQueue.length" class="empty">No hay unidades en fabricación burocrática.</div>
          <div v-for="item in state.trainingQueue" :key="item.id" class="garrison-row">
            <span>{{ item.amount }} {{ item.unitName }}</span>
            <strong>En curso</strong>
          </div>
        </article>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.troops-view,
.roster-panel,
.side-stack,
.troop-list,
.special-section,
.party-special-block {
  display: grid;
  gap: var(--compact-gap);
}

.city-selector,
.roster-panel,
.side-stack > .panel {
  padding: var(--compact-panel-padding);
}

.city-selector {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.35fr);
  gap: var(--compact-gap);
  align-items: end;
}

.city-selector h2,
.section-title h2,
.special-title h2,
.party-heading h3,
.side-stack h2,
.troop-main h3 {
  margin: 0;
}

input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.58rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.city-selector :deep(.dropdown-trigger) {
  min-height: 40px;
}

.troops-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.38fr);
  gap: var(--compact-gap);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--compact-gap);
}

.special-section {
  border-top: 1px solid var(--color-border);
  padding-top: var(--compact-gap);
}

.special-title {
  display: grid;
  gap: 0.25rem;
}

.party-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--compact-gap);
  align-items: center;
  border-left: 3px solid var(--party-color);
  padding: 0.42rem 0 0.42rem 0.62rem;
}

.party-heading > span {
  display: grid;
  min-width: 2.5rem;
  min-height: 2.5rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-weight: 950;
}

.party-heading p {
  margin: 0.18rem 0 0;
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 800;
}

.troop-row {
  display: grid;
  grid-template-columns: 112px minmax(180px, 0.95fr) minmax(260px, 0.9fr) 156px;
  grid-template-areas: 'portrait main stats actions';
  gap: var(--compact-gap);
  align-items: stretch;
  border-top: 1px solid var(--color-border);
  padding: var(--compact-gap) 0;
}

.transport-row .status {
  background: color-mix(in srgb, var(--color-success) 18%, transparent);
  color: var(--color-success);
}

.unit-portrait {
  position: relative;
  grid-area: portrait;
  width: 112px;
  aspect-ratio: 1;
  align-self: center;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-soft);
}

.unit-portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.unit-portrait figcaption {
  position: absolute;
  right: 0.38rem;
  bottom: 0.38rem;
  left: 0.38rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.26rem 0.34rem;
  background: color-mix(in srgb, var(--color-bg) 90%, transparent);
  color: var(--color-text);
  font-size: 0.62rem;
  font-weight: 900;
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.troop-main {
  display: grid;
  gap: var(--compact-gap-sm);
  grid-area: main;
  align-content: center;
  min-width: 0;
}

.troop-main p,
.troop-main small {
  margin: 0;
  color: var(--color-muted);
}

.troop-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.troop-meta small {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.38rem;
  background: var(--color-surface-soft);
  font-weight: 850;
}

.troop-stat-block {
  grid-area: stats;
  align-self: center;
}

.status {
  width: fit-content;
  border-radius: var(--radius-sm);
  padding: 0.22rem 0.42rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface-soft);
  color: var(--color-accent);
  font-size: 0.76rem;
  font-weight: 900;
}

.special-row .status {
  background: var(--color-surface-soft);
  color: var(--color-accent);
}

.troop-actions {
  display: grid;
  gap: var(--compact-gap-sm);
  grid-area: actions;
  align-content: center;
}

.troop-actions label {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.garrison-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap);
  border-top: 1px solid var(--color-border);
  padding: 0.48rem 0;
}

.garrison-row span {
  overflow: hidden;
  color: var(--color-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.garrison-row strong {
  color: var(--color-accent);
}

.empty {
  color: var(--color-muted);
}

@media (max-width: 1180px) {
  .city-selector,
  .troops-layout,
  .troop-row {
    grid-template-columns: 1fr;
  }

  .troop-row {
    grid-template-areas:
      'portrait'
      'main'
      'stats'
      'actions';
  }

  .unit-portrait {
    width: min(100%, 260px);
  }
}

@media (max-width: 640px) {
  .section-title,
  .party-heading {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .section-title {
    display: grid;
  }

  .party-heading > span {
    width: 2.5rem;
  }
}
</style>
