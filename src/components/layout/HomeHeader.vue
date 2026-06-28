<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import UserSocialMenu from '@/components/layout/UserSocialMenu.vue'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const appLogoUrl = '/logo-iberia84.png'

const navItems = [
  { to: { name: 'home' }, routeName: 'home', label: 'Inicio' },
  { to: { name: 'homeGames' }, routeName: 'homeGames', label: 'Partidas' },
  { to: { name: 'homeIberopedia' }, routeName: 'homeIberopedia', label: 'Iberopedia' },
]

function isActiveRoute(routeName: string) {
  return route.name === routeName
}

async function logout() {
  session.logout()
  await router.push({ name: 'access' })
}
</script>

<template>
  <header class="home-header" aria-label="Cabecera de Home">
    <RouterLink class="home-brand" :to="{ name: 'home' }">
      <img class="home-brand-logo" :src="appLogoUrl" alt="" />
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

    <UserSocialMenu class="home-user" @logout="logout" />
  </header>
</template>

<style scoped>
.home-header {
  --header-blue: #5aa7e8;
  --header-blue-strong: #9bd6ff;
  --header-surface: rgba(7, 15, 26, 0.9);
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  left: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.62rem;
  align-items: stretch;
  width: 100%;
  height: var(--home-header-height);
  min-height: var(--home-header-height);
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
  padding: 0 0.7rem;
  background:
    radial-gradient(circle at 8% 0%, rgba(90, 167, 232, 0.14), transparent 18rem),
    linear-gradient(180deg, rgba(10, 22, 36, 0.96), var(--header-surface));
  backdrop-filter: blur(14px);
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.055);
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
    rgba(90, 167, 232, 0.42),
    rgba(155, 214, 255, 0.62),
    transparent
  );
}

.home-brand,
.home-section-link {
  min-width: 0;
}

.home-brand {
  display: grid;
  grid-template-columns: 38px minmax(0, auto);
  gap: 0.44rem;
  align-items: center;
  align-self: center;
  justify-self: start;
  color: var(--header-blue-strong);
  text-decoration: none;
}

.home-brand-logo {
  display: block;
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(90, 167, 232, 0.24));
}

.home-brand strong {
  font-size: 1.02rem;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-section-nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(88px, 1fr));
  gap: 0;
  justify-content: center;
  justify-self: center;
  align-self: stretch;
  width: min(520px, 100%);
  min-width: 0;
  height: 100%;
  border: 0;
  border-right: 1px solid rgba(125, 190, 255, 0.18);
  border-left: 1px solid rgba(125, 190, 255, 0.18);
  border-radius: 0;
  padding: 0;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(155, 214, 255, 0.075), transparent 58%), rgba(3, 10, 18, 0.46);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    inset 0 -1px 0 rgba(0, 0, 0, 0.32);
}

.home-section-link {
  position: relative;
  display: grid;
  height: 100%;
  min-height: 0;
  place-items: center;
  border: 0;
  border-right: 1px solid rgba(125, 190, 255, 0.16);
  border-radius: 0;
  padding: 0 0.46rem;
  color: color-mix(in srgb, var(--color-muted) 82%, #c9e8ff);
  background: transparent;
  box-shadow: none;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    text-shadow 0.16s ease;
}

.home-section-link:last-child {
  border-right: 0;
}

.home-section-link::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 0;
  opacity: 0;
  transform: scaleX(0);
  background: linear-gradient(
    90deg,
    transparent,
    var(--header-blue),
    var(--header-blue-strong),
    transparent
  );
  box-shadow: 0 0 10px rgba(90, 167, 232, 0.34);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.home-section-link:hover,
.home-section-link.active {
  color: var(--header-blue-strong);
  background:
    radial-gradient(circle at 50% 0%, rgba(155, 214, 255, 0.16), transparent 72%),
    linear-gradient(180deg, rgba(90, 167, 232, 0.18), rgba(90, 167, 232, 0.045));
  text-shadow: 0 0 10px rgba(90, 167, 232, 0.18);
}

.home-section-link:hover::after,
.home-section-link.active::after {
  opacity: 1;
  transform: scaleX(1);
}

.home-user {
  position: relative;
  align-self: center;
  justify-self: end;
}

@media (max-width: 980px) {
  .home-header {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.6rem;
  }

  .home-section-nav {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .home-header {
    grid-template-columns: auto 1fr auto;
    grid-template-rows: minmax(0, 1fr) 32px;
    gap: 0;
    align-items: stretch;
    height: var(--home-header-height);
    min-height: var(--home-header-height);
    padding: 0 0.38rem;
  }

  .home-brand strong {
    font-size: 0.98rem;
  }

  .home-brand {
    grid-template-columns: 32px minmax(0, auto);
    gap: 0.4rem;
  }

  .home-brand-logo {
    width: 32px;
    height: 32px;
  }

  .home-section-nav {
    grid-column: 1 / -1;
    grid-row: 2;
    align-self: stretch;
    height: 32px;
    width: min(360px, 100%);
  }

  .home-section-link {
    flex: 0 0 auto;
    min-height: 0;
    min-width: 0;
    padding: 0 0.28rem;
    font-size: 0.66rem;
    text-align: center;
  }
}
</style>
