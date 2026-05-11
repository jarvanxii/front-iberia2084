<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { resourceIcon } from '@/utils/resourceIcons'

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

const navItems = [
  { name: 'home', label: 'Partidas', worldScoped: false },
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
  session.logout()
  await router.push({ name: 'access' })
}

function worldRoute(name: string) {
  return { name, params: { worldCode: currentWorldCode.value } }
}

function navRoute(item: (typeof navItems)[number]) {
  return item.worldScoped ? worldRoute(item.name) : { name: item.name }
}

onMounted(async () => {
  if (!state.value) await session.refresh()
  poller = window.setInterval(() => {
    void session.refresh()
  }, 5000)
})

onUnmounted(() => {
  if (poller) window.clearInterval(poller)
})
</script>

<template>
  <div v-if="state && player" class="game-command-bar" :style="{ '--faction': player.faction.color }">
    <header class="game-header" aria-label="Estado del jugador">
      <div class="header-primary">
        <RouterLink class="brand-block" :to="{ name: 'home' }" aria-label="Volver a partidas">
          <span>IB</span>
          <strong>2084</strong>
          <em>Iberia</em>
        </RouterLink>

        <section class="player-block" aria-label="Partida activa">
          <span class="world-meta">
            {{ activeWorld?.name ?? 'Partida' }} / {{ activeWorld?.difficultyName ?? 'Normal' }} /
            {{ statusLabel(activeWorld?.status) }}
          </span>
          <strong>{{ player.faction.name }}</strong>
          <small>{{ player.leaderName }} · {{ player.faction.motto }}</small>
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

        <button class="logout-button" @click="logout">Salir</button>
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
  display: grid;
  grid-template-rows: auto auto;
  gap: 0.22rem;
  width: min(1440px, calc(100vw - 24px));
  min-height: var(--game-header-height);
  margin: 0 auto;
  padding: 0.34rem 0 0.22rem;
}

.header-primary {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) minmax(390px, 0.82fr) auto;
  gap: 0.74rem;
  align-items: center;
  min-height: 50px;
}

.brand-block,
.player-block,
.screen-nav-link,
.resource-pill {
  min-width: 0;
}

.brand-block {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  align-items: end;
  width: 108px;
  min-height: 46px;
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
  padding: 0.1rem 0.78rem 0.1rem 0;
  color: var(--color-accent-strong);
  text-decoration: none;
}

.brand-block span {
  align-self: center;
  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brand-block strong {
  color: var(--color-text);
  font-size: 1.38rem;
  line-height: 1;
  letter-spacing: 0;
}

.brand-block em {
  grid-column: 1 / -1;
  justify-self: start;
  align-self: start;
  font-size: 0.62rem;
  font-style: normal;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.player-block {
  display: grid;
  align-content: center;
  gap: 0.06rem;
  min-height: 46px;
  border-left: 3px solid var(--faction);
  padding: 0.18rem 0.18rem 0.18rem 0.62rem;
  background: linear-gradient(90deg, color-mix(in srgb, var(--faction) 12%, transparent), transparent 76%);
}

.player-block strong,
.player-block span,
.player-block small,
.screen-nav-link,
.resource-pill span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-block strong {
  color: var(--color-text);
  font-size: 1.12rem;
  font-weight: 950;
  line-height: 1.05;
}

.world-meta,
.player-block small {
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.player-block small {
  color: var(--color-muted);
  text-transform: none;
}

.screen-nav {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;
  min-width: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.screen-nav-link {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 31px;
  border: 0;
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 12%, transparent);
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

.screen-nav-link:first-child {
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 12%, transparent);
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
  text-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 22%, transparent);
}

.screen-nav-link:hover::after,
.screen-nav-link.router-link-active::after {
  transform: scaleX(1);
}

.resource-dock {
  display: grid;
  grid-template-columns: repeat(3, minmax(118px, 1fr));
  gap: 0;
  align-items: center;
  min-width: 0;
}

.resource-pill {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  column-gap: 0.36rem;
  align-items: center;
  min-height: 44px;
  border: 0;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
  padding: 0.2rem 0.5rem;
  background: transparent;
  box-shadow: none;
}

.resource-pill img {
  grid-row: 1 / 4;
  width: 22px;
  height: 22px;
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
  font-size: 1.02rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
  line-height: 1.05;
  white-space: nowrap;
}

.resource-pill em {
  color: var(--color-success);
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.logout-button {
  position: relative;
  justify-self: end;
  min-width: 64px;
  min-height: 42px;
  border: 0;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 24%, transparent);
  padding: 0.24rem 0 0.24rem 0.78rem;
  color: var(--color-muted);
  background: transparent;
  font-size: 0.78rem;
  font-weight: 950;
  text-transform: uppercase;
  transition:
    color 0.16s ease,
    text-shadow 0.16s ease;
}

.logout-button::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0.28rem;
  left: 0.78rem;
  height: 1px;
  transform: scaleX(0);
  background: var(--color-accent);
  transform-origin: right;
  transition: transform 0.18s ease;
}

.logout-button:hover {
  color: var(--color-accent-strong);
  text-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 24%, transparent);
}

.logout-button:hover::after {
  transform: scaleX(1);
}

@media (max-width: 1220px) {
  .game-header {
    width: 100%;
    padding: 0.38rem 0.55rem 0.42rem;
  }

  .header-primary {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.56rem;
  }

  .resource-dock {
    grid-column: 1 / -1;
    grid-row: 2;
    border-top: 1px solid color-mix(in srgb, var(--color-accent) 14%, transparent);
  }

  .logout-button {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (max-width: 760px) {
  .game-header {
    gap: 0.26rem;
    padding: 0.34rem 0.4rem 0.18rem;
  }

  .header-primary {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.32rem;
  }

  .brand-block {
    width: 70px;
    min-height: 42px;
    padding: 0.12rem 0.5rem 0.12rem 0;
  }

  .brand-block strong {
    font-size: 1rem;
  }

  .brand-block em {
    display: none;
  }

  .player-block {
    min-height: 42px;
    padding-left: 0.46rem;
  }

  .player-block strong {
    font-size: 0.98rem;
  }

  .player-block small {
    display: none;
  }

  .logout-button {
    min-width: 52px;
    min-height: 42px;
    padding: 0.2rem 0 0.2rem 0.5rem;
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
    min-height: 44px;
    padding: 0.28rem;
    column-gap: 0.32rem;
  }

  .resource-pill img {
    width: 20px;
    height: 20px;
  }

  .resource-pill span {
    font-size: 0.58rem;
  }

  .resource-pill strong {
    font-size: 0.82rem;
  }

  .resource-pill em {
    font-size: 0.58rem;
  }
}
</style>
