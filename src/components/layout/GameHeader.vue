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
  --header-blue: #5aa7e8;
  --header-blue-strong: #9bd6ff;
  --header-surface: rgba(7, 15, 26, 0.91);
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  left: 0;
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
  background:
    radial-gradient(circle at 7% 0%, rgba(90, 167, 232, 0.14), transparent 20rem),
    radial-gradient(circle at 92% 0%, rgba(155, 214, 255, 0.08), transparent 18rem),
    linear-gradient(180deg, rgba(10, 22, 36, 0.96), var(--header-surface));
  backdrop-filter: blur(14px);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.055);
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
    rgba(90, 167, 232, 0.44),
    rgba(155, 214, 255, 0.66),
    rgba(90, 167, 232, 0.4),
    transparent
  );
}

.game-header {
  --header-gutter: clamp(0.52rem, 1.1vw, 0.95rem);
  display: grid;
  grid-template-rows: auto auto;
  gap: 0.24rem;
  width: 100%;
  min-height: var(--game-header-height);
  margin: 0;
  padding: 0.4rem var(--header-gutter) 0.3rem;
}

.header-primary {
  display: grid;
  grid-template-columns: 164px minmax(270px, 1fr) minmax(360px, 0.72fr) 50px;
  gap: 0.62rem;
  align-items: center;
  min-height: 58px;
}

.brand-block,
.player-block,
.screen-nav-link,
.resource-pill {
  min-width: 0;
}

.brand-block {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 0.48rem;
  align-items: center;
  width: 164px;
  min-height: 54px;
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: var(--radius-lg);
  padding: 0.28rem 0.44rem;
  color: var(--header-blue-strong);
  background:
    linear-gradient(135deg, rgba(90, 167, 232, 0.08), transparent 58%),
    rgba(3, 10, 18, 0.24);
  text-decoration: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
}

.brand-block img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(90, 167, 232, 0.2));
}

.brand-copy {
  display: grid;
  min-width: 0;
  gap: 0.12rem;
}

.brand-block strong {
  color: var(--color-text);
  overflow: hidden;
  font-size: 0.98rem;
  line-height: 0.88;
  letter-spacing: 0;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.brand-block em {
  color: color-mix(in srgb, var(--header-blue-strong) 82%, var(--color-muted));
  font-size: 0.64rem;
  font-style: normal;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.player-block {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  align-content: center;
  gap: 0.48rem;
  min-height: 54px;
  border-left: 2px solid var(--faction);
  padding: 0.24rem 0.12rem 0.24rem 0.48rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--faction) 10%, transparent), transparent 80%),
    transparent;
}

.player-party-logo {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  align-self: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--faction) 54%, var(--color-border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-surface) 80%, #071324);
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
  border: 0;
  border-right: 1px solid color-mix(in srgb, var(--faction) 24%, transparent);
  border-radius: 0;
  padding: 0.04rem 0.3rem 0.04rem 0;
  color: var(--color-muted);
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
  color: var(--header-blue-strong);
}

.world-meta em:last-child {
  border-right: 0;
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
  gap: 0.18rem;
  min-width: 0;
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: var(--radius-lg);
  padding: 0.18rem;
  overflow: hidden;
  background: rgba(3, 10, 18, 0.28);
}

.screen-nav-link {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 30px;
  border: 0;
  border-radius: var(--radius-sm);
  padding: 0.28rem 0.42rem;
  color: color-mix(in srgb, var(--color-muted) 86%, #b8dfff);
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
  bottom: 4px;
  left: 15%;
  height: 2px;
  transform: scaleX(0);
  background: linear-gradient(90deg, transparent, var(--header-blue), var(--header-blue-strong), transparent);
  box-shadow: 0 0 10px rgba(90, 167, 232, 0.34);
  transition: transform 0.2s ease;
}

.screen-nav-link:hover,
.screen-nav-link.router-link-active {
  color: var(--header-blue-strong);
  background: rgba(90, 167, 232, 0.09);
  text-shadow: 0 0 10px rgba(90, 167, 232, 0.18);
}

.screen-nav-link:hover::after,
.screen-nav-link.router-link-active::after {
  transform: scaleX(1);
}

.resource-dock {
  display: grid;
  grid-template-columns: repeat(3, minmax(136px, 1fr));
  gap: 0.28rem;
  align-items: center;
  min-width: 0;
}

.resource-pill {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  column-gap: 0.42rem;
  align-items: center;
  min-height: 50px;
  border: 1px solid rgba(125, 190, 255, 0.11);
  border-radius: var(--radius-lg);
  padding: 0.3rem 0.44rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.032), transparent 80%),
    rgba(3, 10, 18, 0.26);
  box-shadow: none;
}

.resource-pill img {
  grid-row: 1 / 4;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.resource-pill span {
  color: color-mix(in srgb, var(--header-blue-strong) 82%, var(--color-muted));
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
  width: 50px;
  height: 50px;
  place-items: center;
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: var(--radius-lg);
  padding: 0;
  background: rgba(3, 10, 18, 0.26);
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.16)),
    color-mix(in srgb, var(--color-surface-soft) 84%, black);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
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
  border: 1px solid #05101f;
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
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 90%, #071324), #050f1d);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.055);
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
    padding: 0.38rem 0.58rem 0.32rem;
  }

  .header-primary {
    grid-template-columns: 164px minmax(0, 1fr) 50px;
    grid-template-rows: auto auto;
    gap: 0.34rem 0.52rem;
  }

  .resource-dock {
    grid-column: 1 / -1;
    grid-row: 2;
    padding-top: 0.3rem;
    border-top: 1px solid rgba(125, 190, 255, 0.1);
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
    grid-template-columns: 118px minmax(0, 1fr) 40px;
    gap: 0.28rem;
  }

  .brand-block {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 0.3rem;
    width: 118px;
    min-height: 46px;
    padding: 0.22rem 0.3rem;
  }

  .brand-block img {
    width: 34px;
    height: 34px;
  }

  .brand-block strong {
    font-size: 0.82rem;
    line-height: 1;
  }

  .brand-block em {
    display: block;
    font-size: 0.54rem;
  }

  .player-block {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 0.3rem;
    min-height: 46px;
    padding: 0.22rem 0.3rem;
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
    width: 40px;
    height: 40px;
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
    min-height: 29px;
    padding: 0.28rem 0.28rem;
    font-size: 0.76rem;
  }

  .resource-dock {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .resource-pill {
    grid-template-columns: 20px minmax(0, 1fr);
    min-height: 43px;
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
