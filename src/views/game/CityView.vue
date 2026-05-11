<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import cityInlandArt from '@/assets/city-inland.png'
import cityMaritimeArt from '@/assets/city-maritime.png'
import AppDropdown from '@/components/ui/AppDropdown.vue'
import { isMaritimeProvince } from '@/data/maritimeProvinces'
import { useSessionStore } from '@/stores/session'
import type { CityBuildingDto, ResourceCostDto } from '@/types/game'
import { resourceIcon } from '@/utils/resourceIcons'

const session = useSessionStore()
const selectedCityId = ref<number | null>(null)
const selectedBuildingCode = ref<string | null>(null)
const now = ref(Date.now())
let timer: number | undefined

const state = computed(() => session.state)
const cities = computed(() => state.value?.cities ?? [])
const resources = computed(() => state.value?.resources ?? [])
const buildings = computed(() => state.value?.cityBuildings ?? [])
const resourceMap = computed(() => new Map(resources.value.map((resource) => [resource.code, resource.amount])))
const selectedCity = computed(() => {
  if (!cities.value.length) return null
  return cities.value.find((city) => city.id === selectedCityId.value) ?? cities.value[0]
})
const selectedCityScene = computed(() => {
  const maritime = isMaritimeProvince(selectedCity.value?.code)

  return {
    art: maritime ? cityMaritimeArt : cityInlandArt,
    label: maritime ? 'Capital marítima' : 'Capital interior',
  }
})
const selectedCityOptionValue = computed(() => selectedCity.value?.id ?? null)
const cityOptions = computed(() =>
  cities.value.map((city) => ({
    value: city.id,
    label: city.name,
    meta: `${city.region} · defensa ${city.defense} · ${city.resourceName}`,
    badge: city.capital ? 'Capital' : undefined,
  })),
)
const selectedTerritory = computed(() => {
  if (!state.value || !selectedCity.value) return null
  return state.value.territories.find((territory) => territory.id === selectedCity.value?.id) ?? null
})
const selectedResourceCode = computed(() => {
  const territoryCode = selectedTerritory.value?.resourceFocus
  if (territoryCode) return territoryCode
  return resources.value.find((resource) => resource.name === selectedCity.value?.resourceName)?.code ?? 'pesetas'
})
const selectedBuilding = computed(() => {
  if (!buildings.value.length) return null
  return buildings.value.find((building) => building.code === selectedBuildingCode.value) ?? buildings.value[0]
})
const cityResourceMetrics = computed(() => {
  if (!selectedCity.value) return []
  return [
    {
      key: 'population',
      label: 'Población',
      value: formatNumber(selectedCity.value.population),
      note: 'Base social',
      icon: resourceIcon('votos'),
    },
    {
      key: 'defense',
      label: 'Defensa',
      value: formatNumber(selectedCity.value.defense),
      note: 'Resiste invasiones',
      icon: resourceIcon('favores'),
    },
    {
      key: 'baseVotes',
      label: 'Votos base',
      value: formatNumber(selectedCity.value.baseVotes),
      note: 'Apoyo público',
      icon: resourceIcon('votos'),
    },
    {
      key: 'focus',
      label: 'Producción local',
      value: selectedCity.value.resourceName,
      note: 'Recurso provincial',
      icon: resourceIcon(selectedResourceCode.value),
    },
    {
      key: 'building',
      label: 'Edificio provincial',
      value: selectedCity.value.buildingName,
      note: selectedCity.value.capital ? 'Capital' : selectedCity.value.region,
      icon: resourceIcon('pesetas'),
    },
  ]
})

function enough(costs: ResourceCostDto[]) {
  return costs.every((cost) => (resourceMap.value.get(cost.code) ?? 0) >= cost.amount)
}

function formatNumber(value: number) {
  return value.toLocaleString('es-ES')
}

function resourceName(code: string) {
  return resources.value.find((resource) => resource.code === code)?.name ?? code
}

function selectCity(cityId: string | number) {
  selectedCityId.value = Number(cityId)
}

function selectBuilding(code: string) {
  selectedBuildingCode.value = code
}

function costLabel(costs: ResourceCostDto[]) {
  return costs.map((cost) => `${cost.amount} ${resourceName(cost.code)}`).join(' · ')
}

function secondsLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

function countdown(date: string) {
  const seconds = Math.max(0, Math.ceil((new Date(date).getTime() - now.value) / 1000))
  return secondsLabel(seconds)
}

function progressWidth(start: string | null, end: string | null) {
  if (!start || !end) return '0%'
  const startedAt = new Date(start).getTime()
  const finishesAt = new Date(end).getTime()
  const total = Math.max(1, finishesAt - startedAt)
  const elapsed = Math.min(total, Math.max(0, now.value - startedAt))
  return `${Math.round((elapsed / total) * 100)}%`
}

function buildingHotspotStyle(building: CityBuildingDto) {
  return {
    left: `${building.mapX}%`,
    top: `${building.mapY}%`,
    '--hotspot-width': `${Math.max(building.width, 6)}%`,
    '--hotspot-height': `${Math.max(building.height, 6)}%`,
  }
}

function buildingInitials(building: CityBuildingDto) {
  const initials = building.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
  return (initials || building.code.slice(0, 2)).toLocaleUpperCase('es-ES')
}

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <section v-if="state" class="city-view">
    <article class="city-local-topbar panel" aria-label="Recursos de la provincia">
      <div class="city-picker">
        <label v-if="cities.length" class="city-select-field">
          <span>Provincia activa</span>
          <AppDropdown
            :model-value="selectedCityOptionValue"
            :options="cityOptions"
            aria-label="Cambiar provincia controlada"
            placeholder="Elige provincia"
            @update:model-value="selectCity"
          />
        </label>

        <div v-if="selectedCity" class="selected-city-summary">
          <strong>{{ selectedCity.name }}</strong>
          <small>{{ selectedCity.region }} · defensa {{ selectedCity.defense }} · {{ selectedCity.resourceName }}</small>
          <em>{{ selectedCity.capital ? 'Capital provincial' : 'Provincia controlada' }}</em>
        </div>

        <div v-else class="city-picker-empty">
          <RouterLink v-if="!cities.length" class="empty-city" :to="{ name: 'home' }">
            Entra en una partida para recibir una provincia
          </RouterLink>
        </div>
      </div>

      <div v-if="selectedCity" class="city-resource-section">
        <div class="city-resource-heading">
          <div>
            <span>Recursos de provincia</span>
            <strong>{{ selectedCity.name }}</strong>
          </div>
          <button class="app-button secondary city-refresh" @click="session.refresh">Actualizar</button>
        </div>

        <div class="city-resource-bar">
          <article v-for="metric in cityResourceMetrics" :key="metric.key" class="city-resource">
            <img :src="metric.icon" :alt="metric.label" />
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <em>{{ metric.note }}</em>
          </article>
        </div>
      </div>
    </article>

    <section v-if="selectedCity" class="city-layout">
      <article class="panel city-panel">
        <div class="section-title">
          <div>
            <p class="muted">{{ selectedCity.region }}</p>
            <h2>{{ selectedCity.name }}</h2>
          </div>
          <span class="city-scene-type">{{ selectedCityScene.label }}</span>
        </div>

        <div class="city-scene" :style="{ backgroundImage: `url(${selectedCityScene.art})` }">
          <div class="city-map-grid" aria-hidden="true"></div>
          <button
            v-for="building in buildings"
            :key="building.code"
            class="building-hotspot"
            :class="{
              selected: building.code === selectedBuilding?.code,
              upgrading: building.upgrading,
              empty: building.level === 0,
            }"
            :style="buildingHotspotStyle(building)"
            :aria-label="`Seleccionar ${building.name}, nivel ${building.level}`"
            :title="building.name"
            @click="selectBuilding(building.code)"
          >
            <span class="hotspot-zone" aria-hidden="true"></span>
            <span class="hotspot-pin">
              <strong>{{ buildingInitials(building) }}</strong>
              <em>Nv {{ building.level }}</em>
            </span>
            <span class="hotspot-tooltip">
              <strong>{{ building.name }}</strong>
              <small v-if="building.upgrading">Obras {{ countdown(building.upgradeFinishesAt!) }}</small>
              <small v-else>{{ building.category }}</small>
            </span>
          </button>

          <div v-if="selectedBuilding" class="city-map-inspector">
            <span>{{ selectedBuilding.category }}</span>
            <strong>{{ selectedBuilding.name }}</strong>
            <small v-if="selectedBuilding.upgrading">Obras {{ countdown(selectedBuilding.upgradeFinishesAt!) }}</small>
            <small v-else>Nivel {{ selectedBuilding.level }} / {{ selectedBuilding.maxLevel }}</small>
          </div>
        </div>

        <nav class="building-dock" aria-label="Selector rápido de edificios">
          <button
            v-for="building in buildings"
            :key="building.code"
            type="button"
            class="building-dock-item"
            :class="{
              selected: building.code === selectedBuilding?.code,
              upgrading: building.upgrading,
              empty: building.level === 0,
            }"
            @click="selectBuilding(building.code)"
          >
            <span>{{ buildingInitials(building) }}</span>
            <strong>{{ building.name }}</strong>
            <em v-if="building.upgrading">{{ countdown(building.upgradeFinishesAt!) }}</em>
            <em v-else>Nv {{ building.level }}</em>
          </button>
        </nav>
      </article>

      <aside v-if="selectedBuilding" class="panel detail-panel">
        <p class="muted">{{ selectedBuilding.category }}</p>
        <h2>{{ selectedBuilding.name }}</h2>
        <p>{{ selectedBuilding.description }}</p>
        <dl>
          <div>
            <dt>Nivel</dt>
            <dd>{{ selectedBuilding.level }} / {{ selectedBuilding.maxLevel }}</dd>
          </div>
          <div>
            <dt>Efecto</dt>
            <dd>{{ selectedBuilding.effects.join(' · ') }}</dd>
          </div>
          <div v-if="selectedBuilding.upgrading">
            <dt>Obras</dt>
            <dd>{{ countdown(selectedBuilding.upgradeFinishesAt!) }}</dd>
          </div>
          <div v-else>
            <dt>Siguiente mejora</dt>
            <dd>{{ secondsLabel(selectedBuilding.nextDurationSeconds) }}</dd>
          </div>
        </dl>
        <div v-if="selectedBuilding.upgrading" class="city-progress">
          <span
            :style="{ width: progressWidth(selectedBuilding.upgradeStartedAt, selectedBuilding.upgradeFinishesAt) }"
          ></span>
        </div>
        <p v-if="selectedBuilding.nextCosts.length" class="muted">
          Coste: {{ costLabel(selectedBuilding.nextCosts) }}
        </p>
        <button
          class="app-button"
          :disabled="
            session.loading ||
            selectedBuilding.upgrading ||
            !selectedBuilding.nextCosts.length ||
            !enough(selectedBuilding.nextCosts)
          "
          @click="session.actions.upgradeBuilding(selectedBuilding.code)"
        >
          Mejorar edificio
        </button>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.city-view {
  display: grid;
  gap: var(--compact-gap);
}

.city-local-topbar {
  display: grid;
  grid-template-columns: minmax(250px, 0.32fr) minmax(0, 1fr);
  gap: var(--compact-gap);
  overflow: visible;
  padding: var(--compact-panel-padding);
  background: var(--color-surface);
}

.city-picker,
.city-resource-section {
  min-width: 0;
}

.city-select-field > span,
.city-resource-heading span,
.city-resource span,
dt {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.city-picker {
  display: grid;
  align-content: start;
  gap: var(--compact-gap-sm);
}

.city-select-field {
  display: grid;
  gap: 0.28rem;
  min-width: 0;
}

.city-select-field :deep(.dropdown-trigger) {
  min-height: 40px;
}

.selected-city-summary,
.empty-city {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  color: var(--color-text);
  background: var(--color-surface-soft);
  text-align: left;
  text-decoration: none;
}

.selected-city-summary strong,
.selected-city-summary small,
.selected-city-summary em,
.city-resource strong,
.city-resource em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-city-summary strong {
  color: var(--color-text);
  font-size: 0.86rem;
}

.selected-city-summary small,
.selected-city-summary em {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.selected-city-summary em {
  color: var(--color-success);
  font-style: normal;
}

.city-resource-section {
  display: grid;
  gap: var(--compact-gap-sm);
}

.city-resource-heading {
  display: flex;
  gap: var(--compact-gap);
  align-items: center;
  justify-content: space-between;
}

.city-resource-heading strong {
  display: block;
  overflow: hidden;
  color: var(--color-text);
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city-refresh {
  padding: 0.32rem 0.48rem;
  font-size: 0.76rem;
}

.city-resource-bar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
}

.city-resource {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 0 0.32rem;
  align-items: center;
  min-width: 0;
  border: 1px solid var(--color-border);
  padding: 0.32rem 0.38rem;
  background: var(--color-surface-soft);
}

.city-resource img {
  grid-row: span 3;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.city-resource strong {
  color: var(--color-text);
  font-size: 0.86rem;
}

.city-resource em {
  color: var(--color-success);
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 900;
}

.city-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 0.42fr);
  gap: var(--compact-gap);
}

.city-panel,
.detail-panel {
  padding: var(--compact-panel-padding);
}

.section-title {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap);
  align-items: end;
  margin-bottom: var(--compact-gap);
}

.section-title h2,
.detail-panel h2 {
  margin: 0;
}

.city-scene-type {
  align-self: start;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.38rem;
  color: var(--color-accent);
  background: var(--color-surface-soft);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
  white-space: nowrap;
}

.city-scene {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-soft);
  background-position: center;
  background-size: cover;
  border: 1px solid var(--color-border);
}

.city-map-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(210, 173, 84, 0.16) 1px, transparent 1px),
    linear-gradient(180deg, rgba(210, 173, 84, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, transparent 54%, rgba(8, 12, 11, 0.44));
  background-size: 64px 64px, 64px 64px, auto;
  opacity: 0.18;
  pointer-events: none;
}

.building-hotspot {
  position: absolute;
  z-index: 2;
  width: max(46px, var(--hotspot-width));
  height: max(46px, var(--hotspot-height));
  border: 1px solid transparent;
  border-radius: 50%;
  padding: 0;
  color: var(--color-text);
  background: transparent;
  text-align: center;
  transform: translate(-50%, -50%);
}

.building-hotspot:hover,
.building-hotspot:focus-visible,
.building-hotspot.selected {
  z-index: 4;
  border-color: var(--color-accent);
}

.building-hotspot.upgrading {
  border-color: color-mix(in srgb, var(--color-success) 84%, var(--color-border));
}

.building-hotspot.empty {
  border-style: dashed;
}

.hotspot-zone {
  position: absolute;
  inset: 3px;
  border: 1px dashed rgba(244, 241, 232, 0.38);
  border-radius: 50%;
  background: rgba(12, 17, 16, 0.16);
  opacity: 0;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.building-hotspot:hover .hotspot-zone,
.building-hotspot:focus-visible .hotspot-zone,
.building-hotspot.selected .hotspot-zone {
  opacity: 1;
  transform: scale(1.08);
}

.hotspot-pin {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  justify-items: center;
  transform: translate(-50%, -50%);
}

.hotspot-pin strong {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  clip-path: polygon(50% 0, 100% 25%, 82% 100%, 18% 100%, 0 25%);
  color: var(--color-on-accent);
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
  box-shadow:
    0 10px 18px rgba(0, 0, 0, 0.32),
    0 0 0 2px rgba(8, 12, 11, 0.74);
  font-size: 0.72rem;
  font-weight: 950;
  line-height: 1;
}

.building-hotspot.upgrading .hotspot-pin strong {
  color: var(--color-bg);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-success) 78%, white), var(--color-success));
}

.building-hotspot.empty .hotspot-pin strong {
  color: var(--color-text);
  background: linear-gradient(180deg, var(--color-surface-raised), var(--color-surface-soft));
}

.hotspot-pin em {
  margin-top: -0.1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.04rem 0.22rem;
  color: var(--color-text);
  background: rgba(8, 12, 11, 0.82);
  font-size: 0.58rem;
  font-style: normal;
  font-weight: 950;
  line-height: 1.1;
  white-space: nowrap;
}

.hotspot-tooltip {
  position: absolute;
  bottom: calc(100% + 0.32rem);
  left: 50%;
  display: grid;
  min-width: 150px;
  max-width: 210px;
  gap: 0.08rem;
  border: 1px solid var(--color-accent);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  padding: 0.34rem 0.42rem;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-bg) 90%, transparent);
  box-shadow: var(--strategy-shadow-soft);
  opacity: 0;
  pointer-events: none;
  text-align: left;
  transform: translate(-50%, 0.24rem);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.building-hotspot:hover .hotspot-tooltip,
.building-hotspot:focus-visible .hotspot-tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

.hotspot-tooltip strong,
.hotspot-tooltip small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hotspot-tooltip strong {
  font-size: 0.78rem;
  font-weight: 950;
}

.hotspot-tooltip small {
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 850;
}

.city-map-inspector {
  position: absolute;
  z-index: 3;
  right: var(--compact-gap);
  bottom: var(--compact-gap);
  display: grid;
  min-width: 190px;
  max-width: min(310px, calc(100% - (var(--compact-gap) * 2)));
  gap: 0.08rem;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-sm);
  padding: 0.42rem 0.52rem;
  background: color-mix(in srgb, var(--color-bg) 86%, transparent);
  box-shadow: var(--strategy-shadow-soft);
}

.city-map-inspector span,
.city-map-inspector small {
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 850;
}

.city-map-inspector span {
  color: var(--color-accent);
  text-transform: uppercase;
}

.city-map-inspector strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-dock {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--compact-gap-sm);
  margin-top: var(--compact-gap);
}

.building-dock-item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 0.38rem;
  align-items: center;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-left: 3px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.34rem 0.42rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
  text-align: left;
}

.building-dock-item:hover,
.building-dock-item.selected {
  border-color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.building-dock-item.upgrading {
  border-left-color: var(--color-success);
}

.building-dock-item span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  clip-path: polygon(50% 0, 100% 25%, 82% 100%, 18% 100%, 0 25%);
  color: var(--color-on-accent);
  background: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
}

.building-dock-item.empty span {
  color: var(--color-text);
  background: var(--color-surface-raised);
}

.building-dock-item strong,
.building-dock-item em {
  overflow: hidden;
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-dock-item em {
  color: var(--color-accent);
}

.detail-panel {
  display: grid;
  align-content: start;
  gap: var(--compact-gap);
}

.detail-panel p {
  color: var(--color-muted);
  line-height: 1.38;
}

dl {
  display: grid;
  gap: var(--compact-gap-sm);
  margin: 0;
}

dd {
  margin: 0.1rem 0 0;
}

.city-progress {
  height: 10px;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
}

.city-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-success);
}

@media (max-width: 1180px) {
  .city-local-topbar,
  .city-layout,
  .section-title {
    grid-template-columns: 1fr;
  }

  .city-resource-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .city-view {
    gap: var(--compact-gap);
  }

  .city-local-topbar,
  .city-panel,
  .detail-panel {
    border-radius: 0;
  }

  .city-local-topbar {
    padding: 0.48rem 0.36rem;
  }

  .city-resource-heading {
    align-items: flex-start;
  }

  .city-resource-bar {
    display: flex;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .city-resource-bar::-webkit-scrollbar {
    display: none;
  }

  .city-resource {
    flex: 0 0 178px;
  }

  .city-panel,
  .detail-panel {
    padding: var(--compact-panel-padding);
  }

  .city-scene {
    min-height: 390px;
  }
}
</style>
