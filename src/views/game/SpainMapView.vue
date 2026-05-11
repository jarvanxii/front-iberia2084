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

const session = useSessionStore()
const firstProvince = provinceShapes[0]!
const selectedProvinceCode = ref<string | null>(null)
const inviteEmail = ref('')
const inviteStatus = ref<string | null>(null)
const inviteError = ref<string | null>(null)

const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)
const territories = computed(() => state.value?.territories ?? [])
const regionalGovernments = computed(() => state.value?.regionalGovernments ?? [])
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

function regionGovernment(province: ProvinceShape) {
  return regionalGovernments.value.find((region) => region.code === province.regionCode)
}

function provinceColor(province: ProvinceShape) {
  return territoryForProvince(province)?.color ?? regionGovernment(province)?.color ?? 'var(--color-border-strong)'
}

function provinceOwner(province: ProvinceShape) {
  const territory = territoryForProvince(province)
  if (territory?.ownerName) return territory.ownerName
  if (territory) return 'Hueco libre'
  return 'Sin datos'
}

function provincePoliticalControl(province: ProvinceShape) {
  const territory = territoryForProvince(province)
  return territory?.flavorFactionName ?? regionGovernment(province)?.controlledByFactionName ?? 'Neutral'
}

function provinceStatusLabel(province: ProvinceShape) {
  const territory = territoryForProvince(province)
  if (!territory) return 'Sin datos'
  if (territory.ownerPlayerId === player.value?.id) return 'Tu provincia'
  if (territory.ownerPlayerId) return 'Ocupada'
  return 'Libre'
}

function selectProvince(province: ProvinceShape) {
  selectedProvinceCode.value = province.code
  inviteStatus.value = null
  inviteError.value = null
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
          <svg class="province-map" :viewBox="MAP_VIEWBOX" role="img" aria-label="Mapa político de España por provincias">
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
                {{ province.name }} · Jugador: {{ provinceOwner(province) }} · Partido: {{ provincePoliticalControl(province) }}
              </title>
              <path :d="province.path" />
              <text :x="province.labelX" :y="province.labelY + 4">{{ province.abbr }}</text>
            </g>
          </svg>
        </div>
      </article>

      <aside class="panel detail-panel">
        <span :style="{ background: provinceColor(selectedProvince) }"></span>
        <p class="muted">{{ selectedProvince.regionName }}</p>
        <h2>{{ selectedProvince.name }}</h2>
        <dl>
          <div>
            <dt>Jugador</dt>
            <dd>{{ provinceOwner(selectedProvince) }}</dd>
          </div>
          <div>
            <dt>Partido/color</dt>
            <dd>{{ provincePoliticalControl(selectedProvince) }}</dd>
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

    <article class="panel province-grid">
      <button
        v-for="province in provinceShapes"
        :key="province.code"
        :class="{
          active: province.code === selectedProvince.code,
          inactive: !territoryForProvince(province),
          free: territoryForProvince(province) && !territoryForProvince(province)?.ownerPlayerId,
        }"
        @click="selectProvince(province)"
      >
        <i :style="{ background: provinceColor(province) }"></i>
        <strong>{{ province.name }}</strong>
        <span>{{ provinceStatusLabel(province) }}</span>
        <em>{{ provinceOwner(province) }}</em>
      </button>
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
.province-grid {
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

.province-cell path {
  fill: var(--province-color);
  fill-rule: evenodd;
  stroke: var(--color-bg);
  stroke-linejoin: round;
  stroke-width: 1.65;
  opacity: 0.82;
  vector-effect: non-scaling-stroke;
}

.province-cell.inactive path {
  opacity: 0.34;
  stroke-dasharray: 5 4;
}

.province-cell.free path {
  opacity: 0.58;
  stroke: color-mix(in srgb, var(--color-accent) 60%, var(--color-bg));
  stroke-dasharray: 6 4;
}

.province-cell.owned path {
  opacity: 0.86;
}

.province-cell.mine path {
  stroke: var(--color-success);
  stroke-width: 2.6;
}

.province-cell.selected path,
.province-cell:hover path,
.province-cell:focus-visible path {
  opacity: 1;
  stroke: var(--color-accent);
  stroke-width: 3.4;
}

.province-cell text {
  fill: var(--color-bg);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0;
  pointer-events: none;
  text-anchor: middle;
}

.province-cell.inset text {
  font-size: 10px;
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
  .province-grid {
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
}
</style>
