<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const menuOpen = ref(false)

const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)
const worlds = computed(() => state.value?.worlds ?? session.worlds)
const activeWorld = computed(() => {
  if (!player.value) return null
  return worlds.value.find((world) => world.id === player.value?.worldId) ?? null
})
const playerInitials = computed(() => {
  const source = player.value?.leaderName || 'IB'
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})
const userDisplayName = computed(() => player.value?.leaderName ?? 'Sesión activa')
const partyLabel = computed(() => player.value?.faction.shortName ?? 'Sin partido')
const worldLabel = computed(() => activeWorld.value?.name ?? 'Sin partida')

const navItems = [
  { to: { name: 'home' }, routeName: 'home', label: 'Partidas' },
  { to: { name: 'homeParties' }, routeName: 'homeParties', label: 'Partidos' },
  { to: { name: 'homeTroops' }, routeName: 'homeTroops', label: 'Unidades' },
]

function isActiveRoute(routeName: string) {
  return route.name === routeName
}

async function logout() {
  menuOpen.value = false
  session.logout()
  await router.push({ name: 'access' })
}

function enterActiveWorld() {
  if (!activeWorld.value) return { name: 'home' }
  return { name: 'gameCity', params: { worldCode: activeWorld.value.code } }
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('.home-user')) menuOpen.value = false
}

onMounted(() => {
  window.addEventListener('click', closeOnOutsideClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeOnOutsideClick)
})
</script>

<template>
  <header class="home-header" aria-label="Cabecera de Home">
    <div class="home-header-inner">
      <RouterLink class="home-brand" :to="{ name: 'home' }">
        <strong>Iberia 2084</strong>
      </RouterLink>

      <nav class="home-section-nav" aria-label="Secciones de Home">
        <RouterLink
          v-for="item in navItems"
          :key="item.routeName"
          class="home-section-link"
          :class="{ active: isActiveRoute(item.routeName) }"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="home-user">
        <button
          type="button"
          class="home-user-button"
          :aria-expanded="menuOpen"
          aria-label="Abrir menú de usuario"
          @click.stop="menuOpen = !menuOpen"
        >
          <span class="home-user-avatar">{{ playerInitials }}</span>
          <span class="home-user-copy">
            <strong>{{ userDisplayName }}</strong>
            <small>{{ partyLabel }} · {{ worldLabel }}</small>
          </span>
        </button>

        <section v-if="menuOpen" class="home-user-menu" aria-label="Menú de usuario" @click.stop>
          <div class="menu-user-summary">
            <strong>{{ userDisplayName }}</strong>
            <span>{{ partyLabel }} · {{ worldLabel }}</span>
          </div>

          <RouterLink class="home-menu-action primary" :to="enterActiveWorld()" @click="menuOpen = false">
            {{ activeWorld ? 'Entrar en partida' : 'Elegir partida' }}
          </RouterLink>
          <button type="button" class="home-menu-action" @click="logout">Cerrar sesión</button>
        </section>
      </div>
    </div>
  </header>
</template>

<style scoped>
.home-header {
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  left: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 32%, transparent);
  background:
    radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--color-accent) 11%, transparent), transparent 18rem),
    linear-gradient(180deg, #151b18 0%, #0f1512 58%, #080d0b 100%);
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 241, 190, 0.05);
}

.home-header::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 56%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 76%, transparent),
    transparent
  );
}

.home-header-inner {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) auto minmax(190px, 1fr);
  gap: 0.74rem;
  align-items: center;
  width: min(1440px, 100%);
  min-height: var(--home-header-height);
  margin: 0 auto;
  padding: 0 0.7rem;
}

.home-brand,
.home-section-link,
.home-user-button {
  min-width: 0;
}

.home-brand {
  color: var(--color-accent-strong);
  text-decoration: none;
}

.home-brand strong {
  font-size: 1.12rem;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-section-nav {
  display: flex;
  gap: 0;
  justify-content: center;
  min-width: 0;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.home-section-link {
  position: relative;
  display: grid;
  min-height: var(--home-header-height);
  place-items: center;
  border: 0;
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 12%, transparent);
  padding: 0.42rem 0.72rem;
  color: var(--color-muted);
  font-size: 0.88rem;
  font-weight: 900;
  text-decoration: none;
  transition:
    color 0.16s ease,
    text-shadow 0.16s ease;
}

.home-section-link::after {
  content: '';
  position: absolute;
  right: 16%;
  bottom: 0;
  left: 16%;
  height: 2px;
  transform: scaleX(0);
  background: linear-gradient(90deg, transparent, var(--color-accent), var(--color-accent-strong), transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 40%, transparent);
  transition: transform 0.18s ease;
}

.home-section-link:hover,
.home-section-link.active {
  color: var(--color-accent-strong);
  text-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.home-section-link:hover::after,
.home-section-link.active::after {
  transform: scaleX(1);
}

.home-user {
  position: relative;
  justify-self: end;
}

.home-user-button {
  display: grid;
  grid-template-columns: 32px minmax(0, 150px);
  gap: 0.44rem;
  align-items: center;
  border: 0;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
  padding: 0.18rem 0 0.18rem 0.64rem;
  color: var(--color-text);
  background: transparent;
}

.home-user-avatar {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 44%, transparent);
  border-radius: var(--radius-sm);
  color: var(--color-accent-strong);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  font-size: 0.78rem;
  font-weight: 900;
}

.home-user-copy {
  display: grid;
  min-width: 0;
  text-align: left;
}

.home-user-copy strong,
.home-user-copy small,
.menu-user-summary strong,
.menu-user-summary span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-user-copy strong {
  font-size: 0.86rem;
}

.home-user-copy small,
.menu-user-summary span {
  color: var(--color-muted);
  font-size: 0.72rem;
}

.home-user-menu {
  position: absolute;
  top: calc(100% + 0.45rem);
  right: 0;
  display: grid;
  width: min(320px, calc(100vw - 1rem));
  gap: 0;
  border: 1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
  border-radius: var(--radius-md);
  padding: 0.52rem;
  background:
    radial-gradient(circle at 0 0, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 12rem),
    var(--color-surface);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.42);
}

.menu-user-summary {
  display: grid;
  gap: 0.12rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 14%, transparent);
  padding-bottom: 0.45rem;
}

.home-menu-action {
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 10%, transparent);
  padding: 0.5rem 0;
  color: var(--color-muted);
  background: transparent;
  font-weight: 800;
  text-align: left;
  text-decoration: none;
}

.home-menu-action.primary {
  color: var(--color-accent-strong);
}

.home-menu-action:hover {
  color: var(--color-text);
}

@media (max-width: 980px) {
  .home-header-inner {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.6rem;
  }

  .home-section-nav {
    overflow-x: auto;
    justify-content: flex-start;
    scrollbar-width: none;
  }

  .home-section-nav::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 760px) {
  .home-header-inner {
    grid-template-columns: auto 1fr auto;
    min-height: var(--home-header-height);
    padding: 0.38rem;
  }

  .home-brand strong {
    font-size: 0.98rem;
  }

  .home-section-nav {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .home-section-link {
    flex: 1 0 0;
    min-height: 30px;
    padding: 0.26rem 0.4rem;
    text-align: center;
  }

  .home-user-button {
    grid-template-columns: 32px;
    padding: 0.2rem;
  }

  .home-user-copy {
    display: none;
  }

  .home-user-menu {
    position: fixed;
    top: calc(var(--home-header-height) + 0.5rem);
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
  }
}
</style>
