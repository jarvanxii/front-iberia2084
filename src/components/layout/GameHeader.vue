<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { resourceIcon } from '@/utils/resourceIcons'
import { partyLogo } from '@/utils/partyLogos'
import { worldSpeedRatio } from '@/utils/worldSpeed'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const userMenuOpen = ref(false)
const appLogoUrl = '/logo-iberia84.png'

let poller: number | undefined

const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)
const resources = computed(() => state.value?.resources ?? [])
const activeWorld = computed(() => {
  if (!state.value || !player.value) return null
  return state.value.worlds.find((world) => world.id === player.value?.worldId) ?? null
})
const currentWorldCode = computed(() => {
  const routeCode = route.params.worldCode
  if (typeof routeCode === 'string' && routeCode.length) return routeCode
  return activeWorld.value?.code ?? 'iberia-beta-1'
})
const resourceOrder = ['pesetas', 'votos', 'favores']
const coreResources = computed(() =>
  resourceOrder.flatMap((code) => {
    const resource = resources.value.find((item) => item.code === code)
    return resource ? [resource] : []
  }),
)
const playerInitials = computed(() => {
  const source = player.value?.leaderName || player.value?.faction.shortName || 'IB'
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})
const playerHandle = computed(() => player.value?.leaderName ?? 'Jugador')
const playerParty = computed(() => player.value?.faction.shortName ?? 'Partido')
const playerPartyLogo = computed(() => (player.value ? partyLogo(player.value.faction.code) : ''))

const navItems = [
  { name: 'homeGames', label: 'Partidas', worldScoped: false },
  { name: 'gameCity', label: 'Provincia', worldScoped: true },
  { name: 'gameTroops', label: 'Unidades', worldScoped: true },
  { name: 'gameAlliance', label: 'Alianza', worldScoped: true },
  { name: 'gameMap', label: 'Mapa', worldScoped: true },
  { name: 'gameIberopedia', label: 'Iberopedia', worldScoped: true },
]

function formatResourceAmount(value: number) {
  return value.toLocaleString('es-ES')
}

function formatProduction(value: number) {
  return `+${value.toLocaleString('es-ES')}/min`
}

function statusLabel(status?: string) {
  if (status === 'OPEN') return 'Abierto'
  if (status === 'UPCOMING') return 'Próxima'
  if (status === 'CLOSED') return 'Cerrado'
  return 'Partida'
}

async function logout() {
  userMenuOpen.value = false
  session.logout()
  await router.push({ name: 'access' })
}

async function leaveToMainMenu() {
  userMenuOpen.value = false
  await router.push({ name: 'home' })
}

async function openAllianceChat() {
  userMenuOpen.value = false
  await router.push(worldRoute('gameAlliance'))
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('.game-user-shell')) userMenuOpen.value = false
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') userMenuOpen.value = false
}

function worldRoute(name: string) {
  return { name, params: { worldCode: currentWorldCode.value } }
}

function navRoute(item: (typeof navItems)[number]) {
  return item.worldScoped ? worldRoute(item.name) : { name: item.name }
}

onMounted(async () => {
  window.addEventListener('click', closeOnOutsideClick)
  window.addEventListener('keydown', closeOnEscape)
  if (!state.value) await session.refresh(currentWorldCode.value)
  poller = window.setInterval(() => {
    void session.refresh(currentWorldCode.value)
  }, 5000)
})

onUnmounted(() => {
  window.removeEventListener('click', closeOnOutsideClick)
  window.removeEventListener('keydown', closeOnEscape)
  if (poller) window.clearInterval(poller)
})
</script>

<template>
  <div v-if="state && player" class="game-command-bar" :style="{ '--faction': player.faction.color }">
    <header class="game-header" aria-label="Estado del jugador">
      <div class="header-primary">
        <RouterLink class="brand-block" :to="{ name: 'home' }" aria-label="Volver a inicio">
          <img :src="appLogoUrl" alt="" />
          <span class="brand-copy">
            <strong>Iberia 2084</strong>
            <em>Mando provincial</em>
          </span>
        </RouterLink>

        <section class="player-block" aria-label="Partida activa">
          <span class="player-party-logo" aria-hidden="true">
            <img v-if="playerPartyLogo" :src="playerPartyLogo" :alt="''" />
            <b v-else>{{ player.faction.shortName.slice(0, 2) }}</b>
          </span>
          <div class="player-copy">
            <span class="world-meta">
              <em>{{ activeWorld?.name ?? 'Partida' }}</em>
              <em>{{ activeWorld?.difficultyName ?? 'Normal' }}</em>
              <em>{{ activeWorld ? worldSpeedRatio(activeWorld.tickSeconds) : 'x1' }}</em>
              <em>{{ statusLabel(activeWorld?.status) }}</em>
            </span>
            <strong>{{ player.faction.name }}</strong>
            <small>{{ player.leaderName }} · {{ player.faction.motto }}</small>
          </div>
        </section>

        <section class="resource-dock" aria-label="Recursos del jugador">
          <article
            v-for="resource in coreResources"
            :key="resource.code"
            class="resource-pill"
            :title="`${resource.name}: ${resource.amount.toLocaleString('es-ES')} / +${resource.productionPerMinute}/min`"
          >
            <img :src="resourceIcon(resource.code)" :alt="resource.name" />
            <span>{{ resource.name }}</span>
            <strong>{{ formatResourceAmount(resource.amount) }}</strong>
            <em>{{ formatProduction(resource.productionPerMinute) }}</em>
          </article>
        </section>

        <div class="game-user-shell">
          <button
            type="button"
            class="avatar-menu-button"
            :aria-expanded="userMenuOpen"
            aria-label="Abrir menú de jugador"
            @click.stop="userMenuOpen = !userMenuOpen"
          >
            <span class="avatar-frame" aria-hidden="true">
              <span class="avatar-head"></span>
              <span class="avatar-shoulders"></span>
            </span>
            <span class="avatar-status" aria-hidden="true"></span>
          </button>

          <section v-if="userMenuOpen" class="game-user-menu" aria-label="Menú de jugador" @click.stop>
            <div class="game-user-identity">
              <span class="identity-avatar">{{ playerInitials }}</span>
              <div>
                <strong>{{ playerHandle }}</strong>
                <span>{{ playerParty }} · {{ activeWorld?.name ?? 'Sin partida activa' }}</span>
              </div>
            </div>

            <div class="game-user-actions">
              <button type="button" class="game-user-action" @click="closeUserMenu">Preferencias</button>
              <button type="button" class="game-user-action" @click="closeUserMenu">Notificaciones</button>
              <button type="button" class="game-user-action" @click="closeUserMenu">Cuenta y seguridad</button>
              <button type="button" class="game-user-action" @click="openAllianceChat">Chat</button>
              <button type="button" class="game-user-action" @click="closeUserMenu">Amigos</button>
              <button type="button" class="game-user-action" @click="leaveToMainMenu">Salir al menú principal</button>
              <button type="button" class="game-user-action danger" @click="logout">Cerrar sesión</button>
            </div>
          </section>
        </div>
      </div>

      <nav class="screen-nav" aria-label="Pantallas de Iberia 2084">
        <RouterLink v-for="item in navItems" :key="item.name" class="screen-nav-link" :to="navRoute(item)">
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </header>
  </div>
</template>

<style scoped>
.game-command-bar {
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  left: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 32%, transparent);
  background:
    radial-gradient(circle at 7% 0%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 20rem),
    radial-gradient(circle at 92% 0%, rgba(143, 167, 232, 0.08), transparent 18rem),
    linear-gradient(180deg, #141a17 0%, #0f1512 58%, #080d0b 100%);
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.44),
    inset 0 1px 0 rgba(255, 241, 190, 0.05);
}

.game-command-bar::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 68%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 86%, transparent),
    color-mix(in srgb, var(--color-accent) 62%, transparent),
    transparent
  );
}

.game-header {
  --header-gutter: clamp(0.52rem, 1.1vw, 0.95rem);
  display: grid;
  grid-template-rows: auto auto;
  gap: 0.26rem;
  width: 100%;
  min-height: var(--game-header-height);
  margin: 0;
  padding: 0.42rem var(--header-gutter) 0.28rem;
}

.header-primary {
  display: grid;
  grid-template-columns: 190px minmax(290px, 1fr) minmax(430px, 0.74fr) 58px;
  gap: 0.84rem;
  align-items: center;
  min-height: 62px;
}

.brand-block,
.player-block,
.screen-nav-link,
.resource-pill {
  min-width: 0;
}

.brand-block {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 0.58rem;
  align-items: center;
  width: 190px;
  min-height: 62px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 42%, var(--color-border));
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: 0.32rem 0.48rem;
  color: var(--color-accent-strong);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 58%),
    rgba(12, 17, 16, 0.82);
  text-decoration: none;
  box-shadow: inset 0 1px 0 rgba(255, 241, 190, 0.06);
}

.brand-block img {
  display: block;
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--color-accent) 24%, transparent));
}

.brand-copy {
  display: grid;
  min-width: 0;
  gap: 0.12rem;
}

.brand-block strong {
  color: var(--color-text);
  overflow: hidden;
  font-size: 1.08rem;
  line-height: 0.88;
  letter-spacing: 0;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.brand-block em {
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.player-block {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  align-content: center;
  gap: 0.56rem;
  min-height: 62px;
  border-left: 3px solid var(--faction);
  padding: 0.32rem 0.48rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--faction) 13%, transparent), transparent 82%),
    rgba(12, 17, 16, 0.38);
}

.player-party-logo {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  align-self: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--faction) 54%, var(--color-border));
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.player-party-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-party-logo b {
  color: var(--color-text);
  font-size: 0.66rem;
  font-weight: 950;
}

.player-copy {
  display: grid;
  min-width: 0;
  gap: 0.16rem;
}

.player-copy strong,
.player-copy small,
.screen-nav-link,
.resource-pill span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-copy strong {
  color: var(--color-text);
  font-size: clamp(1rem, 1.25vw, 1.24rem);
  font-weight: 950;
  line-height: 1.05;
}

.world-meta {
  display: flex;
  min-width: 0;
  gap: 0.2rem;
  align-items: center;
  overflow: hidden;
}

.world-meta em {
  min-width: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--faction) 24%, var(--color-border));
  border-radius: var(--radius-sm);
  padding: 0.08rem 0.26rem;
  color: var(--color-muted);
  background: rgba(255, 255, 255, 0.025);
  font-size: 0.62rem;
  font-style: normal;
  font-weight: 950;
  line-height: 1.1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.world-meta em:first-child {
  max-width: min(18vw, 220px);
  color: var(--color-accent-strong);
}

.player-copy small {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0;
  line-height: 1.1;
}

.screen-nav {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--color-accent) 14%, transparent);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(7, 13, 11, 0.42);
}

.screen-nav-link {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 32px;
  border: 0;
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 11%, transparent);
  padding: 0.32rem 0.46rem 0.26rem;
  color: var(--color-muted);
  box-shadow: none;
  font-size: 0.82rem;
  font-weight: 900;
  text-align: center;
  text-decoration: none;
  transition:
    color 0.16s ease,
    text-shadow 0.16s ease;
}

.screen-nav-link::after {
  content: '';
  position: absolute;
  right: 15%;
  bottom: -1px;
  left: 15%;
  height: 2px;
  transform: scaleX(0);
  background: linear-gradient(90deg, transparent, var(--color-accent), var(--color-accent-strong), transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 45%, transparent);
  transition: transform 0.2s ease;
}

.screen-nav-link:hover,
.screen-nav-link.router-link-active {
  color: var(--color-accent-strong);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
  text-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 22%, transparent);
}

.screen-nav-link:hover::after,
.screen-nav-link.router-link-active::after {
  transform: scaleX(1);
}

.resource-dock {
  display: grid;
  grid-template-columns: repeat(3, minmax(136px, 1fr));
  gap: 0.16rem;
  align-items: center;
  min-width: 0;
}

.resource-pill {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  column-gap: 0.42rem;
  align-items: center;
  min-height: 54px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 16%, var(--color-border));
  border-radius: var(--radius-md);
  padding: 0.34rem 0.48rem;
  background:
    linear-gradient(180deg, rgba(255, 241, 190, 0.035), transparent 80%),
    rgba(12, 17, 16, 0.54);
  box-shadow: none;
}

.resource-pill img {
  grid-row: 1 / 4;
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.resource-pill span {
  color: color-mix(in srgb, var(--color-accent-strong) 84%, var(--color-muted));
  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
  text-transform: uppercase;
}

.resource-pill strong {
  min-width: 0;
  color: var(--color-text);
  font-size: clamp(0.98rem, 1vw, 1.16rem);
  font-variant-numeric: tabular-nums;
  font-weight: 950;
  line-height: 1.05;
  white-space: nowrap;
}

.resource-pill em {
  color: var(--color-success);
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.game-user-shell {
  position: relative;
  justify-self: end;
}

.avatar-menu-button {
  position: relative;
  display: grid;
  width: 58px;
  height: 54px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 16%, var(--color-border));
  border-radius: var(--radius-md);
  padding: 0;
  background: rgba(12, 17, 16, 0.52);
  transition:
    border-color 0.16s ease,
    filter 0.16s ease;
}

.avatar-frame,
.identity-avatar {
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--faction) 48%, var(--color-accent));
  border-radius: var(--radius-sm);
  color: var(--color-text);
  background:
    radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--faction) 24%, transparent), transparent 58%),
    linear-gradient(180deg, rgba(255, 241, 190, 0.12), rgba(0, 0, 0, 0.16)),
    color-mix(in srgb, var(--color-surface-soft) 84%, black);
  box-shadow:
    inset 0 1px 0 rgba(255, 241, 190, 0.09),
    0 0 18px color-mix(in srgb, var(--faction) 13%, transparent);
  font-weight: 950;
}

.avatar-frame {
  width: 38px;
  height: 38px;
}

.avatar-head {
  width: 10px;
  height: 10px;
  border: 1px solid color-mix(in srgb, var(--color-accent-strong) 72%, white);
  border-radius: 999px;
  background: color-mix(in srgb, var(--faction) 42%, var(--color-accent-strong));
  box-shadow: 0 0 10px color-mix(in srgb, var(--faction) 28%, transparent);
}

.avatar-shoulders {
  width: 18px;
  height: 9px;
  margin-top: -1px;
  border: 1px solid color-mix(in srgb, var(--color-accent-strong) 48%, transparent);
  border-radius: 9px 9px 3px 3px;
  background: color-mix(in srgb, var(--faction) 28%, var(--color-surface-soft));
}

.avatar-status {
  position: absolute;
  right: -1px;
  bottom: 4px;
  width: 9px;
  height: 9px;
  border: 1px solid #07100c;
  border-radius: 999px;
  background: var(--color-success);
  box-shadow: 0 0 10px color-mix(in srgb, var(--color-success) 48%, transparent);
}

.avatar-menu-button:hover,
.avatar-menu-button[aria-expanded='true'] {
  border-color: color-mix(in srgb, var(--faction) 46%, var(--color-accent));
  filter: brightness(1.08);
}

.game-user-menu {
  position: absolute;
  top: calc(100% + 0.52rem);
  right: 0;
  z-index: 1002;
  display: grid;
  width: min(292px, calc(100vw - 1rem));
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--faction) 28%, var(--color-border));
  border-radius: var(--radius-md);
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--faction) 12%, transparent), transparent 9rem),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 94%, black), #07100c);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.54),
    inset 0 1px 0 rgba(255, 241, 190, 0.06);
}

.game-user-identity {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 0.62rem;
  align-items: center;
  border-bottom: 1px solid color-mix(in srgb, var(--faction) 18%, transparent);
  padding: 0.68rem;
}

.identity-avatar {
  width: 42px;
  height: 42px;
  color: var(--color-accent-strong);
  font-size: 0.82rem;
}

.game-user-identity div {
  display: grid;
  gap: 0.08rem;
  min-width: 0;
}

.game-user-identity strong,
.game-user-identity span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-user-identity strong {
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 950;
}

.game-user-identity span {
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 850;
}

.game-user-actions {
  display: grid;
}

.game-user-action {
  display: block;
  width: 100%;
  min-height: 34px;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--faction) 10%, transparent);
  padding: 0.48rem 0.72rem;
  color: color-mix(in srgb, var(--color-accent-strong) 72%, var(--color-muted));
  background: transparent;
  font-size: 0.78rem;
  font-weight: 900;
  text-align: left;
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    padding-left 0.15s ease;
}

.game-user-action:hover,
.game-user-action:focus-visible {
  color: var(--color-text);
  background: color-mix(in srgb, var(--faction) 10%, transparent);
  outline: none;
  padding-left: 0.92rem;
}

.game-user-action.danger {
  border-bottom: 0;
  color: color-mix(in srgb, var(--color-danger) 58%, var(--color-text));
}

.game-user-action.danger:hover,
.game-user-action.danger:focus-visible {
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: color-mix(in srgb, var(--color-danger) 28%, var(--color-text));
}

@media (max-width: 1220px) {
  .game-header {
    padding: 0.42rem 0.58rem 0.34rem;
  }

  .header-primary {
    grid-template-columns: 190px minmax(0, 1fr) 58px;
    grid-template-rows: auto auto;
    gap: 0.36rem 0.56rem;
  }

  .resource-dock {
    grid-column: 1 / -1;
    grid-row: 2;
    padding-top: 0.34rem;
    border-top: 1px solid color-mix(in srgb, var(--color-accent) 14%, transparent);
  }

  .game-user-shell {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (max-width: 760px) {
  .game-header {
    gap: 0.3rem;
    padding: 0.36rem 0.42rem 0.22rem;
  }

  .header-primary {
    grid-template-columns: 126px minmax(0, 1fr) 42px;
    gap: 0.3rem;
  }

  .brand-block {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 0.34rem;
    width: 126px;
    min-height: 50px;
    padding: 0.24rem 0.32rem;
  }

  .brand-block img {
    width: 36px;
    height: 36px;
  }

  .brand-block strong {
    font-size: 0.82rem;
    line-height: 1;
  }

  .brand-block em {
    display: block;
    font-size: 0.56rem;
  }

  .player-block {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 0.34rem;
    min-height: 50px;
    padding: 0.24rem 0.34rem;
  }

  .player-party-logo {
    width: 34px;
    height: 34px;
  }

  .player-copy {
    gap: 0.1rem;
  }

  .player-copy strong {
    font-size: 0.92rem;
  }

  .player-copy small {
    display: none;
  }

  .world-meta em {
    padding: 0.07rem 0.2rem;
    font-size: 0.55rem;
  }

  .world-meta em:nth-child(2) {
    display: none;
  }

  .avatar-menu-button {
    width: 42px;
    height: 42px;
  }

  .avatar-frame {
    width: 30px;
    height: 30px;
  }

  .avatar-head {
    width: 9px;
    height: 9px;
  }

  .avatar-shoulders {
    width: 16px;
    height: 8px;
  }

  .game-user-menu {
    position: fixed;
    top: calc(var(--game-header-height) + 0.42rem);
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
  }

  .screen-nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .screen-nav-link {
    min-height: 30px;
    padding: 0.28rem 0.28rem;
    font-size: 0.76rem;
  }

  .resource-dock {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .resource-pill {
    grid-template-columns: 20px minmax(0, 1fr);
    min-height: 45px;
    padding: 0.26rem 0.3rem;
    column-gap: 0.3rem;
  }

  .resource-pill img {
    width: 20px;
    height: 20px;
  }

  .resource-pill span {
    font-size: 0.58rem;
  }

  .resource-pill strong {
    font-size: 0.86rem;
  }

  .resource-pill em {
    font-size: 0.58rem;
  }
}

@media (max-width: 430px) {
  .header-primary {
    grid-template-columns: 56px minmax(0, 1fr) 40px;
  }

  .brand-block {
    grid-template-columns: 1fr;
    width: 56px;
    justify-items: center;
  }

  .brand-block img {
    width: 36px;
    height: 36px;
  }

  .brand-copy {
    display: none;
  }

  .player-party-logo,
  .world-meta em:nth-child(4) {
    display: none;
  }

  .player-block {
    grid-template-columns: minmax(0, 1fr);
  }

  .resource-pill {
    grid-template-columns: minmax(0, 1fr);
  }

  .resource-pill img,
  .resource-pill span {
    display: none;
  }

  .resource-pill strong,
  .resource-pill em {
    text-align: center;
  }
}
</style>
