<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import UserSocialMenu from '@/components/layout/UserSocialMenu.vue'
import { useSessionStore } from '@/stores/session'
import { resourceIcon } from '@/utils/resourceIcons'
import { partyLogo } from '@/utils/partyLogos'
import { worldSpeedRatio } from '@/utils/worldSpeed'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()

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
const playerPartyLogo = computed(() => (player.value ? partyLogo(player.value.faction.code) : ''))

const navItems = [
  { name: 'gameCity', label: 'Ciudad' },
  { name: 'gameMap', label: 'Mapa' },
  { name: 'gameTroops', label: 'Tropas' },
  { name: 'gameAttacks', label: 'Ataques' },
  { name: 'gameEspionage', label: 'Espionaje' },
  { name: 'gameAlliance', label: 'Alianza' },
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
  session.logout()
  await router.push({ name: 'access' })
}

function worldRoute(name: string) {
  return { name, params: { worldCode: currentWorldCode.value } }
}

function navRoute(item: (typeof navItems)[number]) {
  return worldRoute(item.name)
}

onMounted(async () => {
  if (!state.value) await session.refresh(currentWorldCode.value)
  poller = window.setInterval(() => {
    void session.refresh(currentWorldCode.value)
  }, 5000)
})

onUnmounted(() => {
  if (poller) window.clearInterval(poller)
})
</script>

<template>
  <header
    v-if="state && player"
    class="game-command-bar game-header"
    :style="{ '--faction': player.faction.color }"
    aria-label="Estado del jugador"
  >
    <div class="header-primary">
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

      <UserSocialMenu class="game-user-shell" @logout="logout" />
    </div>

    <nav class="screen-nav" aria-label="Pantallas de Iberia 2084">
      <RouterLink v-for="item in navItems" :key="item.name" class="screen-nav-link" :to="navRoute(item)">
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </header>
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
  grid-template-columns: minmax(300px, 1fr) minmax(360px, 0.78fr) 54px;
  gap: 0.62rem;
  align-items: center;
  min-height: 58px;
}

.player-block,
.screen-nav-link,
.resource-pill {
  min-width: 0;
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
  gap: 0.24rem;
  min-width: 0;
  padding: 0.08rem;
  overflow: hidden;
  background: transparent;
}

.screen-nav-link {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 34px;
  border: 1px solid rgba(125, 190, 255, 0.16);
  border-radius: 6px;
  padding: 0.34rem 0.5rem;
  color: color-mix(in srgb, var(--color-muted) 82%, #c9e8ff);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 46%),
    linear-gradient(180deg, rgba(16, 35, 56, 0.86), rgba(5, 14, 25, 0.72));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.28);
  font-size: 0.8rem;
  font-weight: 950;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease,
    text-shadow 0.16s ease;
}

.screen-nav-link::after {
  content: '';
  position: absolute;
  right: 12%;
  bottom: 3px;
  left: 12%;
  height: 1px;
  transform: scaleX(0);
  background: linear-gradient(90deg, transparent, var(--header-blue), var(--header-blue-strong), transparent);
  box-shadow: 0 0 10px rgba(90, 167, 232, 0.34);
  transition: transform 0.2s ease;
}

.screen-nav-link:hover,
.screen-nav-link.router-link-active {
  border-color: rgba(155, 214, 255, 0.55);
  color: var(--header-blue-strong);
  background:
    linear-gradient(180deg, rgba(155, 214, 255, 0.16), rgba(90, 167, 232, 0.08)),
    linear-gradient(180deg, rgba(19, 48, 78, 0.92), rgba(7, 19, 34, 0.82));
  text-shadow: 0 0 10px rgba(90, 167, 232, 0.18);
}

.screen-nav-link:hover {
  transform: translateY(-1px);
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

@media (max-width: 1220px) {
  .game-header {
    padding: 0.38rem 0.58rem 0.32rem;
  }

  .header-primary {
    grid-template-columns: minmax(0, 1fr) 54px;
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
    grid-column: 2;
    grid-row: 1;
  }
}

@media (max-width: 760px) {
  .game-header {
    gap: 0.3rem;
    padding: 0.36rem 0.42rem 0.22rem;
  }

  .header-primary {
    grid-template-columns: minmax(0, 1fr) 42px;
    gap: 0.28rem;
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
    grid-template-columns: minmax(0, 1fr) 42px;
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
