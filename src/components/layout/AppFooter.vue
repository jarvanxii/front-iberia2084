<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'

const props = defineProps<{
  shell: string
}>()

const session = useSessionStore()

const activeWorld = computed(() => {
  const player = session.state?.player
  if (!player) return null
  return session.state?.worlds.find((world) => world.id === player.worldId) ?? null
})

const shellLabel = computed(() => {
  if (props.shell === 'game') return 'Mando provincial'
  if (props.shell === 'home') return 'Preparación'
  if (props.shell === 'auth') return 'Acceso'
  return 'Iberia 2084'
})

const statusLabel = computed(() => {
  if (activeWorld.value) return activeWorld.value.name
  return session.isLoggedIn ? 'Sin partida activa' : 'Fuera de partida'
})
</script>

<template>
  <footer :class="['app-footer', `app-footer--${shell}`]">
    <div class="footer-brand">
      <span class="footer-code">IB</span>
      <div>
        <strong>Iberia 2084</strong>
        <small>Juego de estrategia provincial</small>
      </div>
    </div>

    <div class="footer-status" aria-label="Estado de juego">
      <span>{{ shellLabel }}</span>
      <strong>{{ statusLabel }}</strong>
    </div>

    <nav v-if="session.isLoggedIn" class="footer-links" aria-label="Navegación secundaria">
      <RouterLink :to="{ name: 'home' }">Partidas</RouterLink>
      <RouterLink :to="{ name: 'homeParties' }">Partidos</RouterLink>
      <RouterLink :to="{ name: 'homeTroops' }">Unidades</RouterLink>
      <RouterLink v-if="activeWorld" :to="{ name: 'gameIberopedia', params: { worldCode: activeWorld.code } }">
        Iberopedia
      </RouterLink>
    </nav>

    <p v-else class="footer-note">Partidos ficticios · mapa por provincias · beta jugable</p>
  </footer>
</template>

<style scoped>
.app-footer {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--compact-gap);
  align-items: center;
  margin: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 24%, transparent);
  padding: 0.58rem var(--space-page) 0.48rem;
  color: var(--color-muted);
  background:
    radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 18rem),
    linear-gradient(180deg, #101612 0%, #0a0f0d 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 241, 190, 0.04),
    0 -10px 24px rgba(0, 0, 0, 0.26);
}

.app-footer::before {
  content: '';
  position: absolute;
  top: -1px;
  right: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 58%, transparent),
    color-mix(in srgb, var(--color-accent-strong) 74%, transparent),
    transparent
  );
}

.app-footer--auth {
  margin-top: 0;
}

.footer-brand,
.footer-status,
.footer-links {
  min-width: 0;
}

.footer-brand {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
}

.footer-code {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 26%, transparent);
  border-radius: 0;
  color: var(--color-accent-strong);
  background: transparent;
  font-size: 0.7rem;
  font-weight: 950;
}

.footer-brand strong,
.footer-status strong {
  display: block;
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-brand small,
.footer-status span,
.footer-note {
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.footer-status {
  display: grid;
  gap: 0.08rem;
  justify-items: end;
  max-width: 240px;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 16%, transparent);
  padding-left: var(--space-4);
}

.footer-status span {
  color: var(--color-accent);
  text-transform: uppercase;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  justify-content: end;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 16%, transparent);
  padding-left: var(--space-3);
}

.footer-links a,
.footer-note {
  padding: 0.18rem 0.42rem;
  background: transparent;
}

.footer-links a {
  position: relative;
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 850;
  text-decoration: none;
}

.footer-links a::after {
  content: '';
  position: absolute;
  right: 0.42rem;
  bottom: 0;
  left: 0.42rem;
  height: 1px;
  transform: scaleX(0);
  background: var(--color-accent);
  transform-origin: center;
  transition: transform 0.16s ease;
}

.footer-links a:hover,
.footer-links a.router-link-active {
  color: var(--color-text);
}

.footer-links a:hover::after,
.footer-links a.router-link-active::after {
  transform: scaleX(1);
}

.footer-note {
  margin: 0;
  text-align: right;
}

@media (max-width: 900px) {
  .app-footer {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .footer-status,
  .footer-links,
  .footer-note {
    border-left: 0;
    padding-left: 0;
    justify-items: start;
    justify-content: start;
    text-align: left;
  }
}

@media (max-width: 560px) {
  .app-footer {
    margin-right: 0;
    margin-left: 0;
    border-right: 0;
    border-radius: 0;
  }
}
</style>
