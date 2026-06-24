<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MAP_ASPECT_RATIO,
  MAP_VIEWBOX,
  provinceShapes,
  type ProvinceShape,
} from '@/data/spanishProvinceMap'
import { useSessionStore } from '@/stores/session'
import type { TerritoryDto } from '@/types/game'
import { comparePartyCodes } from '@/utils/partyOrder'

interface ResourceMultiplier {
  code: string
  label: string
  value: number
  tone: 'low' | 'neutral' | 'high'
}

interface AttackSimulation {
  power: number
  defense: number
  chance: number
  title: string
  body: string
  tone: 'good' | 'warn' | 'bad'
}

interface ProvincePartySummary {
  code: string
  label: string
  color: string
  count: number
  percentage: number
  free?: boolean
}

const multiplierResources = [
  { code: 'pesetas', label: 'Pesetas' },
  { code: 'votos', label: 'Votos' },
  { code: 'favores', label: 'Favores' },
]

const session = useSessionStore()
const firstProvince = provinceShapes[0]!
const selectedProvinceCode = ref<string | null>(null)
const inviteEmail = ref('')
const inviteStatus = ref<string | null>(null)
const inviteError = ref<string | null>(null)
const simulationResult = ref<AttackSimulation | null>(null)

const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)
const territories = computed(() => state.value?.territories ?? [])
const troops = computed(() => state.value?.troops ?? [])
const territoryByCode = computed(() => new Map(territories.value.map((territory) => [territory.code, territory])))
const activeWorld = computed(() => {
  if (!state.value || !player.value) return null
  return state.value.worlds.find((world) => world.id === player.value?.worldId) ?? null
})

const selectedProvince = computed<ProvinceShape>(() => {
  if (selectedProvinceCode.value) {
    return provinceShapes.find((province) => province.code === selectedProvinceCode.value) ?? firstProvince
  }
  const firstMappedTerritory = territories.value.find((territory) => provinceShapes.some((province) => province.code === territory.code))
  return provinceShapes.find((province) => province.code === firstMappedTerritory?.code) ?? firstProvince
})

const selectedTerritory = computed(() => territoryForProvince(selectedProvince.value))
const selectedCanInvite = computed(() => Boolean(selectedTerritory.value && !selectedTerritory.value.ownerPlayerId))
const resourceMultipliers = computed<ResourceMultiplier[]>(() =>
  multiplierResources.map((resource) => {
    const value = multiplierForResource(selectedTerritory.value, resource.code)

    return {
      ...resource,
      value,
      tone: multiplierTone(value),
    }
  }),
)
const attackPower = computed(() =>
  troops.value.reduce((total, troop) => total + troop.amount * Math.max(0, troop.attack), 0),
)
const troopCount = computed(() => troops.value.reduce((total, troop) => total + troop.amount, 0))
const provincePartySummary = computed<ProvincePartySummary[]>(() => {
  const total = provinceShapes.length
  const summaries = new Map<string, Omit<ProvincePartySummary, 'percentage'>>()
  const sortedFactions = [...(state.value?.factions ?? [])].sort((a, b) => comparePartyCodes(a.code, b.code))

  sortedFactions.forEach((faction) => {
    summaries.set(faction.code, {
      code: faction.code,
      label: faction.shortName,
      color: faction.color,
      count: 0,
    })
  })

  const freeSummary: Omit<ProvincePartySummary, 'percentage'> = {
    code: 'sin-jugador',
    label: 'Sin jugador',
    color: 'var(--color-accent)',
    count: 0,
    free: true,
  }

  provinceShapes.forEach((province) => {
    const territory = territoryForProvince(province)

    if (!territory?.ownerPlayerId) {
      freeSummary.count += 1
      return
    }

    const code = territory.ownerFactionCode?.toLowerCase() ?? 'sin-datos'
    const existing = summaries.get(code)

    if (existing) {
      existing.count += 1
      return
    }

    summaries.set(code, {
      code,
      label: territory.ownerFactionShortName ?? territory.ownerFactionCode?.toUpperCase() ?? 'Sin datos',
      color: territory.ownerFactionColor ?? fallbackOwnerColor(territory.ownerPlayerId),
      count: 1,
    })
  })

  return [...summaries.values(), freeSummary].map((summary) => ({
    ...summary,
    percentage: total > 0 ? Math.round((summary.count / total) * 100) : 0,
  }))
})
const invitationLink = computed(() => {
  const origin = window.location.origin
  const params = new URLSearchParams({
    mundo: activeWorld.value?.code ?? '',
    provincia: selectedProvince.value.code,
  })

  return `${origin}/login?${params.toString()}`
})
const invitationSubject = computed(() => `Iberia 2084: empieza en ${selectedProvince.value.name}`)
const invitationBody = computed(() =>
  [
    `Te he reservado ${selectedProvince.value.name} para empezar una partida en Iberia 2084.`,
    '',
    `Provincia: ${selectedProvince.value.name}`,
    `Partida: ${activeWorld.value?.name ?? 'Iberia 2084'}`,
    `Enlace: ${invitationLink.value}`,
  ].join('\n'),
)

function territoryForProvince(province: ProvinceShape): TerritoryDto | undefined {
  return territoryByCode.value.get(province.code)
}

function fallbackOwnerColor(ownerPlayerId: number) {
  const colors = ['#d8b24c', '#59b89c', '#8aa7ff', '#de796d', '#b48ae2', '#7fc667', '#d38a48', '#5fb6d1']
  return colors[Math.abs(ownerPlayerId - 1) % colors.length] ?? colors[0] ?? '#d8b24c'
}

function provinceColor(province: ProvinceShape) {
  const territory = territoryForProvince(province)
  if (!territory?.ownerPlayerId) return 'var(--color-border-strong)'
  return territory.ownerFactionColor ?? fallbackOwnerColor(territory.ownerPlayerId)
}

function provinceOwner(province: ProvinceShape) {
  const territory = territoryForProvince(province)
  if (territory?.ownerName) return territory.ownerName
  if (territory) return 'Hueco libre'
  return 'Sin datos'
}

function provinceOwnerParty(province: ProvinceShape) {
  const territory = territoryForProvince(province)
  if (!territory?.ownerPlayerId) return 'Sin partido'
  return territory.ownerFactionShortName ?? territory.ownerFactionCode?.toUpperCase() ?? 'Sin datos'
}

function provinceStatusLabel(province: ProvinceShape) {
  const territory = territoryForProvince(province)
  if (!territory) return 'Sin datos'
  if (territory.ownerPlayerId === player.value?.id) return 'Tu provincia'
  if (territory.ownerPlayerId) return 'Ocupada'
  return 'Libre'
}

function isMineProvince(province: ProvinceShape) {
  return territoryForProvince(province)?.ownerPlayerId === player.value?.id
}

function provinceLabelBox(province: ProvinceShape) {
  const width = Math.max(17, province.abbr.length * 7.5 + 8)
  const height = province.inset ? 15 : 16

  return {
    x: province.labelX - width / 2,
    y: province.labelY - height / 2,
    width,
    height,
  }
}

function mineMarkerTransform(province: ProvinceShape) {
  const box = provinceLabelBox(province)
  return `translate(${box.x + box.width + 2} ${box.y - 1})`
}

function selectProvince(province: ProvinceShape) {
  selectedProvinceCode.value = province.code
  inviteStatus.value = null
  inviteError.value = null
  simulationResult.value = null
}

function emailIsValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function prepareInvitation() {
  inviteStatus.value = null
  inviteError.value = null

  if (!selectedCanInvite.value) {
    inviteError.value = 'Selecciona una provincia libre para invitar a otro jugador.'
    return
  }

  const email = inviteEmail.value.trim()
  if (!emailIsValid(email)) {
    inviteError.value = 'Introduce un correo válido.'
    return
  }

  const mailto = new URL(`mailto:${email}`)
  mailto.searchParams.set('subject', invitationSubject.value)
  mailto.searchParams.set('body', invitationBody.value)
  window.location.href = mailto.toString()
  inviteStatus.value = `Invitación preparada para ${email}.`
}

function multiplierForResource(territory: TerritoryDto | undefined, resourceCode: string) {
  if (!territory) return 1

  const focusBonus = territory.resourceFocus === resourceCode ? 0.06 : 0
  const drift = (stableNumber(`${territory.code}:${resourceCode}`) - 4) / 100
  const defenseBias = resourceCode === 'favores' ? Math.min(0.03, territory.defense / 2500) : 0
  const voteBias = resourceCode === 'votos' ? Math.min(0.03, territory.baseVotes / 4200) : 0

  return clampNumber(1 + focusBonus + drift + defenseBias + voteBias, 0.88, 1.14)
}

function stableNumber(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997
  }
  return hash % 9
}

function multiplierTone(value: number): ResourceMultiplier['tone'] {
  if (value >= 1.03) return 'high'
  if (value <= 0.98) return 'low'
  return 'neutral'
}

function multiplierLabel(value: number) {
  return `x${value.toFixed(2)}`
}

function formatNumber(value: number) {
  return value.toLocaleString('es-ES')
}

function provinceCountLabel(value: number) {
  return value === 1 ? '1 provincia' : `${value} provincias`
}

function formatProvinceShare(value: number) {
  return `${value}%`
}

function simulateAttack() {
  if (!selectedTerritory.value) return

  const power = attackPower.value
  const defense = selectedTerritory.value.defense
  const occupationModifier = selectedTerritory.value.ownerPlayerId ? -4 : 8
  const pressureRatio = power / Math.max(1, power + defense * 9 + 120)
  const chance = Math.round(clampNumber(32 + pressureRatio * 62 + occupationModifier, 4, 96))
  const title = simulationTitle(power, chance)

  simulationResult.value = {
    power,
    defense,
    chance,
    title,
    body: simulationBody(power, chance),
    tone: chance >= 65 ? 'good' : chance >= 42 ? 'warn' : 'bad',
  }
}

function simulationTitle(power: number, chance: number) {
  if (power <= 0) return 'Sin fuerza desplegable'
  if (chance >= 65) return 'Ventaja operativa'
  if (chance >= 42) return 'Riesgo controlado'
  return 'Ataque desaconsejado'
}

function simulationBody(power: number, chance: number) {
  if (power <= 0) {
    return 'No hay reservas con capacidad de ataque. Entrena o reasigna unidades antes de lanzar una operación real.'
  }

  if (chance >= 65) {
    return 'La presión estimada supera la defensa local. Aun así, revisa costes y tiempos antes de invadir.'
  }

  if (chance >= 42) {
    return 'La provincia puede caer, pero el margen es estrecho. Una unidad de espionaje puede inclinar la lectura.'
  }

  return 'La defensa provincial está por encima de tu fuerza actual. Mejor prepara tropas, favores o una campaña previa.'
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
</script>

<template>
  <section v-if="state && player" class="map-view">
    <article class="panel intro-panel">
      <p class="muted">Mapa de España</p>
      <h2>Propiedad provincial y huecos disponibles</h2>
    </article>

    <section class="map-layout">
      <article class="panel map-panel">
        <div class="map-stage" :style="{ '--map-aspect': MAP_ASPECT_RATIO }">
          <svg class="province-map" :viewBox="MAP_VIEWBOX" role="img" aria-label="Mapa de España por provincias">
            <defs>
              <pattern
                id="province-mine-stripes"
                width="7"
                height="7"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <path d="M0 0H7" stroke="#f0d77b" stroke-opacity="0.36" stroke-width="2" />
              </pattern>
            </defs>

            <g class="inset-frame canarias-frame">
              <rect x="48" y="680" width="282" height="100" rx="14" />
              <text x="189" y="674">Canarias</text>
            </g>
            <g class="inset-frame ciudades-frame">
              <rect x="444" y="686" width="184" height="94" rx="12" />
              <text x="536" y="680">Ciudades autónomas</text>
            </g>

            <g
              v-for="province in provinceShapes"
              :key="province.code"
              class="province-cell"
              :class="{
                selected: province.code === selectedProvince.code,
                inactive: !territoryForProvince(province),
                free: territoryForProvince(province) && !territoryForProvince(province)?.ownerPlayerId,
                owned: Boolean(territoryForProvince(province)?.ownerPlayerId),
                mine: territoryForProvince(province)?.ownerPlayerId === player.id,
                inset: province.inset,
              }"
              :style="{ '--province-color': provinceColor(province) }"
              role="button"
              tabindex="0"
              :aria-label="`${province.name}, jugador ${provinceOwner(province)}`"
              @click="selectProvince(province)"
              @keyup.enter="selectProvince(province)"
              @keyup.space="selectProvince(province)"
            >
              <title>
                {{ province.name }} · Jugador: {{ provinceOwner(province) }} · Partido: {{ provinceOwnerParty(province) }} · Estado:
                {{ provinceStatusLabel(province) }}
              </title>
              <path class="province-base" :d="province.path" />
              <path v-if="isMineProvince(province)" class="province-mine-stripes" :d="province.path" />
              <rect
                class="province-label-frame"
                :x="provinceLabelBox(province).x"
                :y="provinceLabelBox(province).y"
                :width="provinceLabelBox(province).width"
                :height="provinceLabelBox(province).height"
                rx="3"
              />
              <text :x="province.labelX" :y="province.labelY" dominant-baseline="middle">{{ province.abbr }}</text>
              <g v-if="isMineProvince(province)" class="province-mine-marker" :transform="mineMarkerTransform(province)">
                <path d="M0 -6 5 0 0 6 -5 0Z" />
              </g>
            </g>
          </svg>
        </div>
      </article>

      <aside class="panel detail-panel">
        <span :style="{ background: provinceColor(selectedProvince) }"></span>
        <p class="muted">Mapa provincial</p>
        <h2>{{ selectedProvince.name }}</h2>
        <dl>
          <div>
            <dt>Jugador</dt>
            <dd>{{ provinceOwner(selectedProvince) }}</dd>
          </div>
          <div>
            <dt>Partido</dt>
            <dd>{{ provinceOwnerParty(selectedProvince) }}</dd>
          </div>
          <div>
            <dt>Defensa</dt>
            <dd>{{ selectedTerritory?.defense ?? 'Sin datos' }}</dd>
          </div>
          <div>
            <dt>Recurso</dt>
            <dd>{{ selectedTerritory?.resourceName ?? 'Pendiente' }}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{{ provinceStatusLabel(selectedProvince) }}</dd>
          </div>
        </dl>
        <div class="action-row">
          <button
            class="app-button"
            :disabled="session.loading || !selectedTerritory || selectedTerritory.ownerPlayerId === player.id"
            @click="selectedTerritory && session.actions.conquer(selectedTerritory.id)"
          >
            Invadir
          </button>
          <button
            class="app-button secondary"
            :disabled="session.loading || !selectedTerritory"
            @click="selectedTerritory && session.actions.influence(selectedTerritory.id)"
          >
            Campaña de presión
          </button>
        </div>

        <section class="multiplier-panel" aria-label="Multiplicadores provinciales">
          <header>
            <span>Multiplicadores</span>
            <strong>Rendimiento local</strong>
          </header>
          <table>
            <tbody>
              <tr v-for="multiplier in resourceMultipliers" :key="multiplier.code">
                <th scope="row">{{ multiplier.label }}</th>
                <td :class="`multiplier-${multiplier.tone}`">{{ multiplierLabel(multiplier.value) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="simulator-panel" aria-label="Simulador de ataque">
          <header>
            <span>Simulador</span>
            <strong>Prueba de ataque</strong>
          </header>
          <dl class="simulator-stats">
            <div>
              <dt>Fuerza</dt>
              <dd>{{ formatNumber(attackPower) }}</dd>
            </div>
            <div>
              <dt>Tropas</dt>
              <dd>{{ formatNumber(troopCount) }}</dd>
            </div>
            <div>
              <dt>Defensa</dt>
              <dd>{{ selectedTerritory?.defense ?? 'Sin datos' }}</dd>
            </div>
          </dl>
          <button class="app-button secondary simulator-button" :disabled="!selectedTerritory" @click="simulateAttack">
            Simular ataque
          </button>
          <div v-if="simulationResult" class="simulation-result" :class="`simulation-result-${simulationResult.tone}`">
            <strong>{{ simulationResult.title }}</strong>
            <span>{{ simulationResult.chance }}% estimado</span>
            <p>{{ simulationResult.body }}</p>
          </div>
        </section>

        <section class="invite-panel" :class="{ disabled: !selectedCanInvite }" aria-label="Invitar jugador">
          <div>
            <span>Invitación</span>
            <strong>{{ selectedCanInvite ? 'Enviar a este hueco' : 'Provincia ocupada' }}</strong>
            <small v-if="!selectedCanInvite">Solo se puede invitar a provincias libres.</small>
            <small v-else>Borrador local, sin envío automático.</small>
          </div>

          <form @submit.prevent="prepareInvitation">
            <input
              v-model="inviteEmail"
              :disabled="!selectedCanInvite"
              autocomplete="email"
              placeholder="amigo@correo.es"
              type="email"
            />
            <button class="app-button secondary" :disabled="!selectedCanInvite" type="submit">
              Preparar email
            </button>
          </form>

          <p v-if="inviteError" class="invite-error">{{ inviteError }}</p>
          <p v-else-if="inviteStatus" class="invite-status">{{ inviteStatus }}</p>
        </section>
      </aside>
    </section>

    <article class="panel province-overview">
      <header class="province-overview-header">
        <div>
          <span>Resumen por partido</span>
          <strong>Control provincial</strong>
        </div>
        <em>{{ provinceCountLabel(provinceShapes.length) }}</em>
      </header>

      <section class="party-control-summary" aria-label="Resumen de control provincial por partido">
        <article
          v-for="summary in provincePartySummary"
          :key="summary.code"
          class="party-summary-card"
          :class="{ free: summary.free, empty: summary.count === 0 }"
          :style="{ '--party-color': summary.color }"
        >
          <i></i>
          <div>
            <strong>{{ summary.label }}</strong>
            <span>{{ provinceCountLabel(summary.count) }}</span>
          </div>
          <em>{{ formatProvinceShare(summary.percentage) }}</em>
        </article>
      </section>

      <div class="province-grid">
        <button
          v-for="province in provinceShapes"
          :key="province.code"
          :class="{
            active: province.code === selectedProvince.code,
            inactive: !territoryForProvince(province),
            free: territoryForProvince(province) && !territoryForProvince(province)?.ownerPlayerId,
            owned: Boolean(territoryForProvince(province)?.ownerPlayerId),
            mine: isMineProvince(province),
          }"
          :style="{ '--province-color': provinceColor(province) }"
          @click="selectProvince(province)"
        >
          <i></i>
          <strong>{{ province.name }}</strong>
          <span>{{ provinceStatusLabel(province) }}</span>
          <em>{{ provinceOwner(province) }} · {{ provinceOwnerParty(province) }}</em>
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.map-view {
  display: grid;
  gap: var(--compact-gap);
}

.intro-panel,
.map-panel,
.detail-panel,
.province-overview {
  padding: var(--compact-panel-padding);
}

.intro-panel h2,
.detail-panel h2 {
  margin: 0;
}

.intro-panel p:last-child,
.detail-panel p {
  color: var(--color-muted);
  line-height: 1.38;
}

.map-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.36fr);
  gap: var(--compact-gap);
}

.map-panel {
  overflow: hidden;
}

.map-stage {
  position: relative;
  width: 100%;
  aspect-ratio: var(--map-aspect);
  min-height: 360px;
}

.province-map {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.inset-frame rect {
  fill: var(--color-surface);
  stroke: var(--color-border);
  stroke-width: 1.5;
}

.inset-frame text {
  fill: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-anchor: middle;
  text-transform: uppercase;
}

.province-cell {
  cursor: pointer;
  outline: none;
}

.province-cell .province-base {
  fill: var(--province-color);
  fill-rule: evenodd;
  stroke: var(--color-bg);
  stroke-linejoin: round;
  stroke-width: 1.65;
  opacity: 0.82;
  vector-effect: non-scaling-stroke;
}

.province-cell.inactive .province-base {
  opacity: 0.34;
  stroke-dasharray: 5 4;
}

.province-cell.free .province-base {
  opacity: 0.58;
  stroke: color-mix(in srgb, var(--color-accent) 60%, var(--color-bg));
  stroke-dasharray: 6 4;
}

.province-cell.owned .province-base {
  opacity: 0.9;
}

.province-cell.mine .province-base {
  stroke: var(--color-success);
  stroke-width: 3;
}

.province-cell.selected .province-base,
.province-cell:hover .province-base,
.province-cell:focus-visible .province-base {
  opacity: 1;
  stroke: var(--color-accent);
  stroke-width: 3.4;
}

.province-mine-stripes {
  fill: url('#province-mine-stripes');
  fill-rule: evenodd;
  opacity: 0.82;
  pointer-events: none;
  stroke: transparent;
  stroke-width: 0;
}

.province-cell text {
  fill: var(--color-text);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: 0;
  pointer-events: none;
  text-anchor: middle;
}

.province-cell.inset text {
  font-size: 8.5px;
}

.province-label-frame {
  fill: color-mix(in srgb, var(--color-bg) 86%, transparent);
  stroke: color-mix(in srgb, var(--color-border-strong) 72%, var(--color-bg));
  stroke-width: 1;
  opacity: 0.9;
  pointer-events: none;
  vector-effect: non-scaling-stroke;
}

.province-cell.owned .province-label-frame {
  fill: color-mix(in srgb, var(--province-color) 22%, var(--color-bg));
  stroke: color-mix(in srgb, var(--province-color) 74%, var(--color-bg));
}

.province-cell.free .province-label-frame {
  fill: color-mix(in srgb, var(--color-bg) 76%, transparent);
}

.province-cell.mine .province-label-frame {
  stroke: var(--color-success);
  stroke-width: 1.5;
}

.province-mine-marker {
  pointer-events: none;
}

.province-mine-marker path {
  fill: var(--color-success);
  stroke: var(--color-bg);
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
}

.detail-panel {
  display: grid;
  align-content: start;
  gap: var(--compact-gap);
}

.detail-panel > span {
  width: 52px;
  height: 10px;
  border-radius: var(--radius-sm);
}

dl {
  display: grid;
  gap: var(--compact-gap-sm);
  margin: 0;
}

dt {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

dd {
  margin: 0.1rem 0 0;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--compact-gap-sm);
}

.multiplier-panel,
.simulator-panel {
  display: grid;
  gap: var(--compact-gap-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--compact-card-padding);
  background: var(--color-surface-soft);
}

.multiplier-panel header,
.simulator-panel header {
  display: grid;
  gap: 0.08rem;
}

.multiplier-panel header span,
.simulator-panel header span {
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  text-transform: uppercase;
}

.multiplier-panel header strong,
.simulator-panel header strong {
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.05;
}

.multiplier-panel table {
  width: 100%;
  border-collapse: collapse;
}

.multiplier-panel tr {
  border-top: 1px solid var(--color-border);
}

.multiplier-panel th,
.multiplier-panel td {
  padding: 0.36rem 0;
  font-size: 0.82rem;
}

.multiplier-panel th {
  color: var(--color-muted);
  font-weight: 850;
  text-align: left;
}

.multiplier-panel td {
  color: var(--color-text);
  font-weight: 950;
  text-align: right;
}

.multiplier-panel .multiplier-high {
  color: var(--color-success);
}

.multiplier-panel .multiplier-low {
  color: var(--color-danger);
}

.simulator-panel {
  border-left: 3px solid var(--color-info);
}

.simulator-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
}

.simulator-stats div {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.34rem;
  background: color-mix(in srgb, var(--color-bg) 70%, transparent);
}

.simulator-stats dd {
  color: var(--color-text);
  font-weight: 950;
}

.simulator-button {
  width: 100%;
}

.simulation-result {
  display: grid;
  gap: 0.12rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--compact-card-padding);
  background: color-mix(in srgb, var(--color-bg) 76%, transparent);
}

.simulation-result strong {
  color: var(--color-text);
}

.simulation-result span {
  color: var(--color-accent);
  font-size: 0.78rem;
  font-weight: 950;
}

.simulation-result p {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.simulation-result-good {
  border-color: color-mix(in srgb, var(--color-success) 68%, var(--color-border));
}

.simulation-result-warn {
  border-color: color-mix(in srgb, var(--color-accent) 70%, var(--color-border));
}

.simulation-result-bad {
  border-color: color-mix(in srgb, var(--color-danger) 70%, var(--color-border));
}

.invite-panel {
  display: grid;
  gap: var(--compact-gap-sm);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-sm);
  padding: var(--compact-card-padding);
  background: var(--color-surface-soft);
}

.invite-panel.disabled {
  border-left-color: var(--color-border-strong);
  opacity: 0.76;
}

.invite-panel span,
.invite-panel small {
  display: block;
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 850;
}

.invite-panel span {
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  text-transform: uppercase;
}

.invite-panel strong {
  display: block;
  margin-top: 0.08rem;
  color: var(--color-text);
  font-size: 0.92rem;
}

.invite-panel form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap-sm);
}

.invite-panel input {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.42rem 0.5rem;
  color: var(--color-text);
  background: var(--color-bg);
}

.invite-panel button {
  min-height: 34px;
  padding: 0.36rem 0.5rem;
  white-space: nowrap;
}

.invite-error,
.invite-status {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 850;
}

.invite-error {
  color: var(--color-danger);
}

.invite-status {
  color: var(--color-success);
}

.province-overview {
  display: grid;
  gap: var(--compact-gap);
}

.province-overview-header {
  display: flex;
  gap: var(--compact-gap);
  align-items: end;
  justify-content: space-between;
  min-width: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 16%, transparent);
  padding-bottom: 0.5rem;
}

.province-overview-header div {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.province-overview-header span {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.province-overview-header strong {
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 950;
  line-height: 1;
}

.province-overview-header em {
  color: var(--color-muted);
  font-size: 0.76rem;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.party-control-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: var(--compact-gap-sm);
}

.party-summary-card {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: center;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--party-color) 34%, var(--color-border));
  border-radius: var(--radius-sm);
  padding: 0.42rem 0.48rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--party-color) 12%, transparent), transparent 56%),
    var(--color-surface-soft);
}

.party-summary-card.empty {
  opacity: 0.62;
}

.party-summary-card.free {
  border-style: dashed;
}

.party-summary-card i {
  width: 8px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--party-color);
}

.party-summary-card div {
  display: grid;
  min-width: 0;
  gap: 0.08rem;
}

.party-summary-card strong,
.party-summary-card span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.party-summary-card strong {
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 950;
}

.party-summary-card span {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 820;
}

.party-summary-card em {
  color: color-mix(in srgb, var(--party-color) 72%, var(--color-text));
  font-size: 0.9rem;
  font-style: normal;
  font-weight: 950;
}

.province-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
}

.province-grid button {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.1rem 0.36rem;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.38rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
  text-align: left;
}

.province-grid button.active {
  border-color: var(--color-accent);
}

.province-grid button.owned {
  border-left: 3px solid var(--province-color);
}

.province-grid button.mine {
  border-color: var(--color-success);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-success) 12%, transparent), transparent 42%),
    var(--color-surface-soft);
}

.province-grid button.free {
  border-left: 3px solid var(--color-accent);
}

.province-grid button.inactive {
  opacity: 0.58;
}

.province-grid i {
  grid-row: span 3;
  width: 10px;
  height: 42px;
  border-radius: var(--radius-sm);
  background: var(--province-color);
}

.province-grid strong,
.province-grid span,
.province-grid em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.province-grid span {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 900;
}

.province-grid em {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 780;
}

@media (max-width: 1100px) {
  .map-layout,
  .province-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .intro-panel,
  .map-panel,
  .detail-panel,
  .province-overview {
    padding: var(--compact-panel-padding);
  }

  .map-stage {
    min-height: 240px;
  }

  .province-cell text {
    font-size: 9px;
  }

  .invite-panel form {
    grid-template-columns: 1fr;
  }

  .simulator-stats {
    grid-template-columns: 1fr;
  }
}
</style>
