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
    <div class="home-header-inner">
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
    </div>
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
  border-bottom: 1px solid rgba(125, 190, 255, 0.2);
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

.home-header-inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.62rem;
  align-items: center;
  width: 100%;
  min-height: var(--home-header-height);
  margin: 0;
  padding: 0 0.7rem;
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
  grid-template-columns: repeat(3, minmax(110px, 1fr));
  gap: 0.24rem;
  justify-content: center;
  justify-self: center;
  width: min(520px, 100%);
  min-width: 0;
  padding: 0.22rem;
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.032), transparent 82%),
    rgba(3, 10, 18, 0.28);
}

.home-section-link {
  position: relative;
  display: grid;
  min-height: 36px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 0.38rem 0.72rem;
  color: color-mix(in srgb, var(--color-muted) 84%, #b8dfff);
  font-size: 0.84rem;
  font-weight: 900;
  text-decoration: none;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    text-shadow 0.16s ease;
}

.home-section-link::after {
  content: '';
  position: absolute;
  right: 20%;
  bottom: 5px;
  left: 20%;
  height: 2px;
  transform: scaleX(0);
  background: linear-gradient(90deg, transparent, var(--header-blue), var(--header-blue-strong), transparent);
  box-shadow: 0 0 10px rgba(90, 167, 232, 0.34);
  transition: transform 0.18s ease;
}

.home-section-link:hover,
.home-section-link.active {
  border-color: rgba(125, 190, 255, 0.22);
  color: var(--header-blue-strong);
  background:
    linear-gradient(180deg, rgba(155, 214, 255, 0.13), rgba(90, 167, 232, 0.07)),
    rgba(90, 167, 232, 0.08);
  text-shadow: 0 0 10px rgba(90, 167, 232, 0.18);
}

.home-section-link:hover::after,
.home-section-link.active::after {
  transform: scaleX(1);
}

.home-user {
  position: relative;
  justify-self: end;
}

@media (max-width: 980px) {
  .home-header-inner {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.6rem;
  }

  .home-section-nav {
    width: 100%;
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
  }

  .home-section-link {
    flex: 0 0 auto;
    min-height: 30px;
    min-width: 86px;
    padding: 0.26rem 0.4rem;
    text-align: center;
  }

}
</style>
