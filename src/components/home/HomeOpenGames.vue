<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDropdown from '@/components/ui/AppDropdown.vue'
import type { FactionDto, PlayerDto, WorldDto } from '@/types/game'
import { useSessionStore } from '@/stores/session'
import { partyLogo } from '@/utils/partyLogos'
import { sortByPartyOrder } from '@/utils/partyOrder'
import { worldSpeedRatio } from '@/utils/worldSpeed'

const props = defineProps<{
  worlds: WorldDto[]
  activeWorld: WorldDto | null
  players: PlayerDto[]
  factions: FactionDto[]
  hasPlayer: boolean
}>()

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const selectedWorldCode = ref('')
const factionCode = ref('')
const leaderName = ref('')
const setupError = ref<string | null>(null)

const selectedWorld = computed(() => {
  return (
    props.worlds.find((world) => world.code === selectedWorldCode.value) ??
    props.activeWorld ??
    props.worlds.find((world) => world.joinable) ??
    props.worlds[0] ??
    null
  )
})
const orderedFactions = computed(() => sortByPartyOrder(props.factions))
const selectedFaction = computed(
  () => orderedFactions.value.find((faction) => faction.code === factionCode.value) ?? orderedFactions.value[0] ?? null,
)
const selectedFactionLogo = computed(() => (selectedFaction.value ? partyLogo(selectedFaction.value.code) : ''))
const maxJoinedWorlds = 2
const joinedWorldIds = computed(() => new Set(props.players.map((player) => player.worldId)))
const joinedWorldCount = computed(() => joinedWorldIds.value.size)
const selectedPlayer = computed(() => {
  if (!selectedWorld.value) return null
  return props.players.find((player) => player.worldId === selectedWorld.value?.id) ?? null
})
const selectedIsActive = computed(() => selectedWorld.value?.id === props.activeWorld?.id)
const invitedWorldCode = computed(() => (typeof route.query.mundo === 'string' ? route.query.mundo : ''))
const invitedProvinceCode = computed(() => (typeof route.query.provincia === 'string' ? route.query.provincia : ''))
const canEnterSelected = computed(() => {
  if (!selectedWorld.value) return false
  if (selectedPlayer.value) return true
  return selectedWorld.value.joinable && joinedWorldCount.value < maxJoinedWorlds
})
const factionOptions = computed(() =>
  orderedFactions.value.map((faction) => ({
    value: faction.code,
    label: faction.name,
    meta: faction.motto,
    badge: faction.shortName,
    icon: partyLogo(faction.code),
    color: faction.color,
  })),
)
const selectedWorldNotice = computed(() => {
  if (!selectedWorld.value) return ''
  if (!props.hasPlayer && invitedProvinceCode.value && selectedWorld.value.code === invitedWorldCode.value) {
    return `Invitación recibida para el hueco ${invitedProvinceCode.value}.`
  }
  if (selectedPlayer.value) {
    return selectedIsActive.value
      ? 'Esta es la partida que tienes abierta ahora.'
      : 'Ya formas parte de esta partida. Puedes entrar y cambiar el contexto activo.'
  }
  if (joinedWorldCount.value >= maxJoinedWorlds) return 'Ya estás en 2 partidas, el máximo permitido por cuenta.'
  if (!selectedWorld.value.joinable) return 'Esta partida no admite altas nuevas.'
  if (props.hasPlayer) return 'Puedes estar en hasta 2 partidas distintas con la misma cuenta.'
  return ''
})

watch(
  () => [props.worlds.map((world) => world.code).join('|'), props.activeWorld?.code ?? '', invitedWorldCode.value],
  () => {
    if (selectedWorldCode.value && props.worlds.some((world) => world.code === selectedWorldCode.value)) return
    const invitedCode = props.worlds.some((world) => world.code === invitedWorldCode.value) ? invitedWorldCode.value : ''
    selectedWorldCode.value =
      props.activeWorld?.code || invitedCode || props.worlds.find((world) => world.joinable)?.code || props.worlds[0]?.code || ''
  },
  { immediate: true },
)

watch(
  () => orderedFactions.value.map((faction) => faction.code).join('|'),
  () => {
    if (factionCode.value && orderedFactions.value.some((faction) => faction.code === factionCode.value)) return
    factionCode.value = orderedFactions.value[0]?.code ?? ''
  },
  { immediate: true },
)

function statusLabel(status: WorldDto['status']) {
  if (status === 'OPEN') return 'Abierta'
  if (status === 'UPCOMING') return 'Próximamente'
  return 'Cerrada'
}

function statusClass(status: WorldDto['status']) {
  return {
    'is-open': status === 'OPEN',
    'is-upcoming': status === 'UPCOMING',
    'is-closed': status === 'CLOSED',
  }
}

function worldDateLabel(world: WorldDto) {
  const value = world.status === 'CLOSED' ? world.closedAt : world.opensAt
  if (!value) {
    if (world.status === 'OPEN') return 'Ya iniciada'
    if (world.status === 'CLOSED') return 'Cierre registrado'
    return 'Inicio por anunciar'
  }
  const label = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
  return world.status === 'CLOSED' ? `Cerrada ${label}` : `Inicio ${label}`
}

function worldFillLabel(world: WorldDto) {
  return `${world.currentPlayers.toLocaleString('es-ES')} / ${world.maxPlayers.toLocaleString('es-ES')}`
}

function selectWorld(code: string) {
  selectedWorldCode.value = code
  setupError.value = null
}

async function enterSelectedWorld() {
  if (!selectedWorld.value || !canEnterSelected.value) return

  if (!selectedPlayer.value) {
    const cleanLeaderName = leaderName.value.trim()
    if (cleanLeaderName.length < 3) {
      setupError.value = 'El líder de campaña necesita al menos 3 caracteres.'
      return
    }
    if (!selectedFaction.value) {
      setupError.value = 'Elige un partido antes de entrar en la partida.'
      return
    }
    await session.actions.joinWorld({
      worldCode: selectedWorld.value.code,
      factionCode: selectedFaction.value.code,
      leaderName: cleanLeaderName,
      provinceCode: selectedWorld.value.code === invitedWorldCode.value ? invitedProvinceCode.value || undefined : undefined,
    })
  } else {
    await session.refresh(selectedWorld.value.code)
  }

  await router.push({ name: 'gameCity', params: { worldCode: selectedWorld.value.code } })
}
</script>

<template>
  <article class="panel open-games-panel">
    <header class="games-header">
      <div class="games-heading-copy">
        <p class="muted">Partidas</p>
        <h1>Selecciona partida</h1>
        <span class="games-limit">Puedes jugar hasta 2 partidas a la vez.</span>
      </div>

      <button
        type="button"
        class="app-button enter-game-button"
        :disabled="!canEnterSelected || session.loading"
        @click="enterSelectedWorld"
      >
        {{ selectedPlayer ? 'Entrar' : 'Unirse' }}
      </button>
    </header>

    <section v-if="selectedWorld" class="games-layout">
      <nav class="world-list" aria-label="Partidas disponibles">
        <button
          v-for="world in worlds"
          :key="world.code"
          type="button"
          class="world-row"
          :class="{
            selected: world.code === selectedWorld.code,
            active: world.id === activeWorld?.id,
            joined: joinedWorldIds.has(world.id),
            locked: !joinedWorldIds.has(world.id) && (!world.joinable || joinedWorldCount >= maxJoinedWorlds),
          }"
          @click="selectWorld(world.code)"
        >
          <span class="world-main">
            <strong>{{ world.name }}</strong>
            <small>{{ world.difficultyName }} · {{ worldSpeedRatio(world.tickSeconds) }}</small>
          </span>
          <span class="world-side">
            <i :class="statusClass(world.status)">{{ statusLabel(world.status) }}</i>
            <b>{{ worldFillLabel(world) }}</b>
          </span>
        </button>
      </nav>

      <section class="world-detail" aria-label="Partida seleccionada">
        <header class="world-detail-header">
          <span class="status-pill" :class="statusClass(selectedWorld.status)">
            {{ statusLabel(selectedWorld.status) }}
          </span>
          <h2>{{ selectedWorld.name }}</h2>
        </header>

        <dl class="world-facts">
          <div>
            <dt>Inicio</dt>
            <dd>{{ worldDateLabel(selectedWorld) }}</dd>
          </div>
          <div>
            <dt>Dificultad</dt>
            <dd>{{ selectedWorld.difficultyName }}</dd>
          </div>
          <div>
            <dt>Plazas</dt>
            <dd>{{ worldFillLabel(selectedWorld) }} provincias</dd>
          </div>
          <div>
            <dt>Mapa</dt>
            <dd>{{ selectedWorld.controlledTerritories }} / {{ selectedWorld.totalTerritories || '??' }}</dd>
          </div>
          <div>
            <dt>Velocidad</dt>
            <dd>{{ worldSpeedRatio(selectedWorld.tickSeconds) }}</dd>
          </div>
        </dl>

        <section
          v-if="!selectedPlayer && selectedWorld.joinable && joinedWorldCount < maxJoinedWorlds"
          class="join-panel"
          aria-label="Alta en partida"
        >
          <label>
            Líder
            <input v-model="leaderName" placeholder="Nombre visible" @keydown.enter.prevent="enterSelectedWorld" />
          </label>

          <label>
            Partido
            <AppDropdown
              :model-value="factionCode"
              :options="factionOptions"
              aria-label="Seleccionar partido"
              placeholder="Elige partido"
              @update:model-value="factionCode = String($event)"
            />
          </label>

          <article v-if="selectedFaction" class="party-summary">
            <span class="party-mark" :style="{ background: selectedFaction.color }">
              <img v-if="selectedFactionLogo" :src="selectedFactionLogo" :alt="`Logo de ${selectedFaction.name}`" />
              <b v-else>{{ selectedFaction.shortName.slice(0, 2) }}</b>
            </span>
            <strong>{{ selectedFaction.shortName }}</strong>
            <small>{{ selectedFaction.name }}</small>
          </article>
        </section>

        <p v-if="selectedWorldNotice" class="world-notice">{{ selectedWorldNotice }}</p>
        <p v-if="setupError || session.error" class="form-error">{{ setupError || session.error }}</p>
      </section>
    </section>

    <section v-else class="empty-games">
      No hay partidas disponibles.
    </section>
  </article>
</template>

<style scoped>
.open-games-panel {
  display: grid;
  align-content: start;
  grid-auto-rows: max-content;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--compact-panel-padding);
  scroll-margin-top: calc(var(--home-header-height) + var(--space-page));
}

.games-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-2);
}

.games-heading-copy {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 0.28rem 0.42rem;
  align-items: baseline;
}

.games-heading-copy .muted {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
}

.games-limit {
  color: var(--color-muted);
  font-size: 0.74rem;
  font-weight: 820;
}

.games-header h1,
.world-detail-header h2 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
}

.games-header h1 {
  overflow: hidden;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enter-game-button {
  min-width: 86px;
  min-height: 30px;
  padding: 0.26rem 0.48rem;
  font-size: 0.76rem;
}

.games-layout {
  display: grid;
  grid-template-columns: minmax(250px, 0.46fr) minmax(0, 1fr);
  gap: var(--compact-gap);
  min-width: 0;
}

.world-list {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-width: 0;
}

.world-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  width: 100%;
  border: 1px solid var(--color-border);
  border-left: 3px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.44rem 0.52rem;
  color: var(--color-text);
  background: rgba(5, 14, 26, 0.62);
  text-align: left;
}

.world-row:hover {
  border-color: var(--color-border-strong);
}

.world-row.selected {
  border-color: var(--color-accent);
  border-left-color: var(--color-accent);
  background: var(--color-surface-soft);
}

.world-row.locked:not(.selected) {
  opacity: 0.62;
}

.world-row.active .world-main strong::after {
  content: ' · tu partida';
  color: var(--color-success);
  font-size: 0.72rem;
  font-weight: 850;
}

.world-row.joined:not(.active) .world-main strong::after {
  content: ' · dentro';
  color: var(--color-success);
  font-size: 0.72rem;
  font-weight: 850;
}

.world-main,
.world-side {
  display: grid;
  min-width: 0;
  gap: 0.08rem;
}

.world-main strong,
.world-main small,
.world-side b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.world-main strong {
  font-size: 0.92rem;
  font-weight: 950;
}

.world-main small,
.world-side b {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.world-side {
  justify-items: end;
}

.world-side i,
.status-pill {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.12rem 0.34rem;
  color: var(--color-muted);
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 950;
  text-transform: uppercase;
  white-space: nowrap;
}

.world-side i.is-open,
.status-pill.is-open {
  border-color: color-mix(in srgb, var(--color-success) 72%, var(--color-border));
  color: var(--color-success);
}

.world-side i.is-upcoming,
.status-pill.is-upcoming {
  border-color: color-mix(in srgb, var(--color-info) 70%, var(--color-border));
  color: var(--color-info);
}

.world-side i.is-closed,
.status-pill.is-closed {
  border-color: color-mix(in srgb, var(--color-danger) 72%, var(--color-border));
  color: var(--color-danger);
}

.world-detail {
  display: grid;
  align-content: start;
  gap: var(--compact-gap);
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--compact-panel-padding);
  background:
    radial-gradient(circle at 0 0, rgba(85, 166, 232, 0.045), transparent 14rem),
    rgba(5, 14, 26, 0.46);
}

.world-detail-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.world-detail-header h2 {
  min-width: min(100%, 260px);
  font-size: clamp(1.18rem, 2.2vw, 1.7rem);
}

.world-facts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
}

.world-facts div {
  border-left: 2px solid var(--color-accent);
  padding: 0.18rem 0 0.18rem 0.48rem;
}

.world-facts dt {
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.world-facts dd {
  overflow: hidden;
  margin: 0.1rem 0 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.join-panel {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(230px, 1fr) minmax(160px, 0.65fr);
  gap: var(--space-3);
  align-items: end;
  border-top: 1px solid var(--color-border);
  padding-top: var(--compact-gap);
}

.join-panel label {
  display: grid;
  gap: 0.28rem;
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
}

.join-panel input {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.38rem 0.52rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.party-summary {
  display: grid;
  grid-template-columns: 34px minmax(0, auto);
  gap: 0.06rem 0.42rem;
  align-items: center;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.28rem 0.42rem;
  background: var(--color-surface-soft);
}

.party-mark {
  display: grid;
  grid-row: span 2;
  width: 30px;
  height: 30px;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius-sm);
  color: var(--color-on-accent);
  font-weight: 950;
}

.party-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.party-summary strong,
.party-summary small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.party-summary strong {
  color: var(--color-text);
  font-size: 0.82rem;
}

.party-summary small {
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 780;
}

.world-notice,
.form-error,
.empty-games {
  margin: 0;
  font-weight: 850;
}

.world-notice {
  color: var(--color-muted);
}

.form-error {
  color: var(--color-danger);
}

.empty-games {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--compact-panel-padding);
  color: var(--color-muted);
}

@media (max-width: 980px) {
  .games-layout,
  .join-panel {
    grid-template-columns: 1fr;
  }

  .world-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .games-header {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .world-row {
    grid-template-columns: 1fr;
  }

  .world-side {
    grid-template-columns: auto 1fr;
    justify-items: start;
  }

  .world-facts {
    grid-template-columns: 1fr;
  }
}
</style>
