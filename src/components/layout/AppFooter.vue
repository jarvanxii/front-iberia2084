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
    <div class="footer-command">
      <section class="footer-identity" aria-label="Iberia 2084">
        <span class="footer-mark" aria-hidden="true">
          <span>IB</span>
          <strong>2084</strong>
        </span>
        <div class="footer-copy">
          <strong>Iberia 2084</strong>
          <small>Simulación estratégica por provincias</small>
        </div>
      </section>

      <section class="footer-status" aria-label="Estado actual">
        <span class="footer-eyebrow">{{ shellLabel }}</span>
        <strong>{{ statusLabel }}</strong>
      </section>

      <nav v-if="session.isLoggedIn" class="footer-nav" aria-label="Navegación secundaria">
        <span class="footer-eyebrow">Accesos</span>
        <div class="footer-nav-links">
          <RouterLink :to="{ name: 'home' }">Inicio</RouterLink>
          <RouterLink :to="{ name: 'homeGames' }">Partidas</RouterLink>
          <RouterLink :to="{ name: 'homeParties' }">Partidos</RouterLink>
          <RouterLink :to="{ name: 'homeTroops' }">Unidades</RouterLink>
          <RouterLink :to="{ name: 'homeBuildings' }">Edificios</RouterLink>
          <RouterLink :to="{ name: 'homeEvents' }">Eventos</RouterLink>
          <RouterLink :to="{ name: 'homeResearch' }">Investigaciones</RouterLink>
        </div>
      </nav>

      <p v-else class="footer-note">Partidos ficticios · mapa por provincias · beta jugable</p>
    </div>

    <div class="footer-bottom">
      <p class="footer-legal">
        <strong>Aviso legal</strong>
        <span>
          Iberia 2084 es una obra de ficción y sátira. Sus partidos, instituciones, territorios, personajes y
          situaciones son ficticios y no representan a entidades, cargos ni personas reales.
        </span>
      </p>
      <span class="footer-classification">Beta estratégica · 3 recursos principales</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: relative;
  display: grid;
  margin: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 42%, var(--color-border));
  color: var(--color-muted);
  background:
    linear-gradient(90deg, rgba(69, 45, 28, 0.34), transparent 24rem),
    linear-gradient(180deg, #151710 0%, #0e1210 55%, #080a09 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 241, 190, 0.06),
    0 -12px 26px rgba(0, 0, 0, 0.28);
}

.app-footer::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 72%, transparent) 18%,
    color-mix(in srgb, var(--color-info) 38%, transparent) 50%,
    color-mix(in srgb, var(--color-accent) 72%, transparent) 82%,
    transparent
  );
}

.app-footer--auth {
  margin-top: 0;
}

.footer-command {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(190px, 0.55fr) minmax(360px, 1.2fr);
  gap: clamp(0.8rem, 2vw, 2rem);
  align-items: center;
  min-width: 0;
  padding: 0.82rem var(--space-page) 0.72rem;
}

.footer-identity,
.footer-status,
.footer-nav {
  min-width: 0;
}

.footer-identity {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
}

.footer-mark {
  display: grid;
  width: 54px;
  min-height: 48px;
  align-content: center;
  justify-items: center;
  border-left: 2px solid var(--color-accent);
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 24%, transparent);
  color: var(--color-accent-strong);
  background:
    linear-gradient(180deg, rgba(210, 173, 84, 0.14), rgba(210, 173, 84, 0.02)),
    rgba(8, 10, 9, 0.45);
  line-height: 1;
}

.footer-mark span {
  font-size: 0.64rem;
  font-weight: 950;
}

.footer-mark strong {
  margin-top: 0.12rem;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 950;
  letter-spacing: 0;
}

.footer-copy {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.footer-copy strong,
.footer-status strong {
  display: block;
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 950;
  line-height: 1.08;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-copy small,
.footer-note {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 780;
}

.footer-eyebrow {
  color: color-mix(in srgb, var(--color-accent-strong) 76%, var(--color-muted));
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
  text-transform: uppercase;
}

.footer-status {
  display: grid;
  gap: 0.2rem;
  align-content: center;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 26%, transparent);
  padding-left: var(--space-4);
}

.footer-nav {
  display: grid;
  gap: 0.34rem;
  align-content: center;
  justify-items: end;
}

.footer-nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  justify-content: end;
  min-width: 0;
}

.footer-nav-links a {
  position: relative;
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  border-right: 1px solid color-mix(in srgb, var(--color-border) 68%, transparent);
  padding: 0 0.52rem;
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 880;
  line-height: 1;
  text-decoration: none;
}

.footer-nav-links a:first-child {
  border-left: 1px solid color-mix(in srgb, var(--color-border) 68%, transparent);
}

.footer-nav-links a::after {
  content: '';
  position: absolute;
  right: 0.52rem;
  bottom: 0;
  left: 0.52rem;
  height: 1px;
  transform: scaleX(0);
  background: var(--color-accent-strong);
  transform-origin: center;
  transition: transform 0.16s ease;
}

.footer-nav-links a:hover,
.footer-nav-links a.router-link-active {
  color: var(--color-text);
}

.footer-nav-links a:hover::after,
.footer-nav-links a.router-link-active::after {
  transform: scaleX(1);
}

.footer-note {
  justify-self: end;
  margin: 0;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 26%, transparent);
  padding-left: var(--space-4);
  text-align: right;
}

.footer-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap);
  align-items: center;
  min-width: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
  padding: 0.48rem var(--space-page) 0.56rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 36rem),
    rgba(4, 5, 5, 0.36);
}

.footer-legal {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.5rem;
  align-items: baseline;
  min-width: 0;
  margin: 0;
  color: color-mix(in srgb, var(--color-muted) 82%, var(--color-text));
  font-size: 0.68rem;
  font-weight: 760;
  line-height: 1.34;
}

.footer-legal strong {
  color: var(--color-accent-strong);
  font-size: 0.66rem;
  font-weight: 950;
  text-transform: uppercase;
  white-space: nowrap;
}

.footer-legal span {
  min-width: min(100%, 30ch);
  overflow-wrap: anywhere;
}

.footer-classification {
  color: color-mix(in srgb, var(--color-info) 58%, var(--color-muted));
  font-size: 0.66rem;
  font-weight: 900;
  text-align: right;
  text-transform: uppercase;
  white-space: nowrap;
}

@media (max-width: 1040px) {
  .footer-command {
    grid-template-columns: minmax(220px, 1fr) minmax(170px, auto);
  }

  .footer-nav,
  .footer-note {
    grid-column: 1 / -1;
    justify-self: stretch;
    justify-items: start;
    border-top: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
    padding-top: var(--space-3);
  }

  .footer-nav-links {
    justify-content: start;
  }
}

@media (max-width: 720px) {
  .footer-command,
  .footer-bottom {
    grid-template-columns: 1fr;
  }

  .footer-command {
    gap: var(--space-4);
    padding-top: 0.7rem;
  }

  .footer-status,
  .footer-note {
    border-left: 0;
    padding-left: 0;
    text-align: left;
  }

  .footer-nav {
    justify-items: start;
  }

  .footer-classification {
    text-align: left;
    white-space: normal;
  }
}

@media (max-width: 460px) {
  .footer-identity {
    grid-template-columns: 46px minmax(0, 1fr);
  }

  .footer-mark {
    width: 46px;
    min-height: 44px;
  }

  .footer-nav-links a,
  .footer-nav-links a:first-child {
    border-right: 0;
    border-left: 0;
    padding: 0.16rem 0.5rem 0.16rem 0;
  }
}
</style>
