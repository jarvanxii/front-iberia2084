import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '@/views/AuthView.vue'
import AllianceView from '@/views/game/AllianceView.vue'
import CityView from '@/views/game/CityView.vue'
import GameHomeView from '@/views/game/GameHomeView.vue'
import GameShell from '@/views/game/GameShell.vue'
import IberopediaView from '@/views/game/IberopediaView.vue'
import SpainMapView from '@/views/game/SpainMapView.vue'
import TroopsView from '@/views/game/TroopsView.vue'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'access', component: AuthView, meta: { guestOnly: true, shell: 'auth' } },
    { path: '/login', redirect: { name: 'access' } },
    { path: '/inicio', redirect: { name: 'home' } },
    { path: '/partidas', redirect: { name: 'home' } },
    { path: '/ciudad', redirect: { name: 'home' } },
    { path: '/provincia', redirect: { name: 'home' } },
    { path: '/alianza', redirect: { name: 'home' } },
    { path: '/mapa', redirect: { name: 'home' } },
    { path: '/iberipedia', redirect: { name: 'home' } },
    { path: '/iberopedia', redirect: { name: 'home' } },
    {
      path: '/home',
      name: 'home',
      component: GameHomeView,
      meta: { requiresAuth: true, header: 'home', shell: 'home', homeSection: 'partidas' },
    },
    {
      path: '/partidos',
      name: 'homeParties',
      component: GameHomeView,
      meta: { requiresAuth: true, header: 'home', shell: 'home', homeSection: 'partidos' },
    },
    { path: '/tropas', redirect: { name: 'homeTroops' } },
    {
      path: '/unidades',
      name: 'homeTroops',
      component: GameHomeView,
      meta: { requiresAuth: true, header: 'home', shell: 'home', homeSection: 'unidades' },
    },
    {
      path: '/mundo/:worldCode',
      component: GameShell,
      meta: { requiresAuth: true, requiresWorld: true, header: 'game', shell: 'game' },
      children: [
        { path: '', redirect: (to) => ({ name: 'gameCity', params: to.params }) },
        { path: 'ciudad', redirect: (to) => ({ name: 'gameCity', params: to.params }) },
        { path: 'provincia', name: 'gameCity', component: CityView },
        { path: 'tropas', redirect: (to) => ({ name: 'gameTroops', params: to.params }) },
        { path: 'unidades', name: 'gameTroops', component: TroopsView },
        { path: 'alianza', name: 'gameAlliance', component: AllianceView },
        { path: 'mapa', name: 'gameMap', component: SpainMapView },
        { path: 'iberipedia', redirect: (to) => ({ name: 'gameIberopedia', params: to.params }) },
        { path: 'iberopedia', name: 'gameIberopedia', component: IberopediaView },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  if (to.meta.requiresAuth && !session.isLoggedIn) {
    return { name: 'access' }
  }
  if (to.meta.guestOnly && session.isLoggedIn) {
    return { name: 'home', query: to.query }
  }

  if (to.meta.requiresAuth && session.isLoggedIn && !session.state) {
    try {
      await session.refresh()
    } catch {
      session.logout()
      return { name: 'access' }
    }
  }

  if (to.meta.requiresWorld) {
    const worldCode = typeof to.params.worldCode === 'string' ? to.params.worldCode : ''
    const player = session.state?.player ?? null
    const activeWorld = player
      ? session.state?.worlds.find((world) => world.id === player.worldId)
      : null

    if (!player || !activeWorld || activeWorld.code !== worldCode) {
      return { name: 'home' }
    }
  }
})

export default router
