import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '@/views/AuthView.vue'
import LegalView from '@/views/LegalView.vue'
import AccountChatView from '@/views/account/AccountChatView.vue'
import AccountFriendsView from '@/views/account/AccountFriendsView.vue'
import AccountPaymentsView from '@/views/account/AccountPaymentsView.vue'
import AccountPreferencesView from '@/views/account/AccountPreferencesView.vue'
import AccountSecurityView from '@/views/account/AccountSecurityView.vue'
import AttacksView from '@/views/game/AttacksView.vue'
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
    { path: '/login', redirect: (to) => ({ name: 'access', query: to.query }) },
    { path: '/privacidad', name: 'privacy', component: LegalView, meta: { shell: 'auth' } },
    { path: '/terminos', name: 'terms', component: LegalView, meta: { shell: 'auth' } },
    { path: '/contacto', name: 'contact', component: LegalView, meta: { shell: 'auth' } },
    { path: '/inicio', redirect: { name: 'home' } },
    { path: '/ciudad', redirect: { name: 'home' } },
    { path: '/provincia', redirect: { name: 'home' } },
    { path: '/alianza', redirect: { name: 'home' } },
    { path: '/mapa', redirect: { name: 'home' } },
    { path: '/iberipedia', redirect: { name: 'homeIberopedia' } },
    {
      path: '/home',
      name: 'home',
      component: GameHomeView,
      meta: { requiresAuth: true, header: 'home', shell: 'home', homeSection: 'inicio' },
    },
    {
      path: '/partidas',
      name: 'homeGames',
      component: GameHomeView,
      meta: { requiresAuth: true, header: 'home', shell: 'home', homeSection: 'partidas' },
    },
    {
      path: '/iberopedia',
      name: 'homeIberopedia',
      component: IberopediaView,
      meta: { requiresAuth: true, header: 'home', shell: 'home' },
    },
    {
      path: '/partidos',
      name: 'homeParties',
      redirect: { name: 'homeIberopedia', query: { tema: 'partidos' } },
    },
    { path: '/tropas', redirect: { name: 'homeIberopedia', query: { tema: 'unidades' } } },
    {
      path: '/unidades',
      name: 'homeTroops',
      redirect: { name: 'homeIberopedia', query: { tema: 'unidades' } },
    },
    {
      path: '/edificios',
      name: 'homeBuildings',
      redirect: { name: 'homeIberopedia', query: { tema: 'edificios' } },
    },
    {
      path: '/eventos',
      name: 'homeEvents',
      redirect: { name: 'homeIberopedia', query: { tema: 'eventos' } },
    },
    {
      path: '/investigaciones',
      name: 'homeResearch',
      redirect: { name: 'homeIberopedia', query: { tema: 'investigaciones' } },
    },
    {
      path: '/chat',
      name: 'accountChat',
      component: AccountChatView,
      meta: { requiresAuth: true, header: 'home', shell: 'home' },
    },
    {
      path: '/amigos',
      name: 'accountFriends',
      component: AccountFriendsView,
      meta: { requiresAuth: true, header: 'home', shell: 'home' },
    },
    {
      path: '/preferencias',
      name: 'accountPreferences',
      component: AccountPreferencesView,
      meta: { requiresAuth: true, header: 'home', shell: 'home' },
    },
    {
      path: '/cuenta-seguridad',
      name: 'accountSecurity',
      component: AccountSecurityView,
      meta: { requiresAuth: true, header: 'home', shell: 'home' },
    },
    {
      path: '/pagos-domiciliaciones',
      name: 'accountPayments',
      component: AccountPaymentsView,
      meta: { requiresAuth: true, header: 'home', shell: 'home' },
    },
    {
      path: '/mundo/:worldCode',
      component: GameShell,
      meta: { requiresAuth: true, requiresWorld: true, header: 'game', shell: 'game' },
      children: [
        { path: '', redirect: (to) => ({ name: 'gameCity', params: to.params }) },
        { path: 'ciudad', redirect: (to) => ({ name: 'gameCity', params: to.params }) },
        { path: 'provincia', name: 'gameCity', component: CityView },
        { path: 'mapa', name: 'gameMap', component: SpainMapView },
        { path: 'unidades', redirect: (to) => ({ name: 'gameTroops', params: to.params }) },
        { path: 'tropas', name: 'gameTroops', component: TroopsView },
        { path: 'ataques', name: 'gameAttacks', component: AttacksView },
        { path: 'alianza', name: 'gameAlliance', component: AllianceView },
        { path: 'iberipedia', redirect: (to) => ({ name: 'gameIberopedia', params: to.params }) },
        { path: 'iberopedia', name: 'gameIberopedia', component: IberopediaView },
        { path: 'cuenta/chat', name: 'gameAccountChat', component: AccountChatView },
        { path: 'cuenta/amigos', name: 'gameAccountFriends', component: AccountFriendsView },
        { path: 'cuenta/preferencias', name: 'gameAccountPreferences', component: AccountPreferencesView },
        { path: 'cuenta/seguridad', name: 'gameAccountSecurity', component: AccountSecurityView },
        { path: 'cuenta/pagos', name: 'gameAccountPayments', component: AccountPaymentsView },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  const oauthHandoff = typeof to.query.handoff === 'string' ? to.query.handoff : ''
  if (oauthHandoff) {
    try {
      await session.completeOAuthHandoff(oauthHandoff)
      const cleanedQuery = { ...to.query }
      delete cleanedQuery.handoff
      delete cleanedQuery.oauth
      delete cleanedQuery.provider
      delete cleanedQuery.message
      const targetName = to.meta.guestOnly || typeof to.name !== 'string' ? 'home' : to.name
      return { name: targetName, params: to.params, query: cleanedQuery, replace: true }
    } catch {
      session.logout()
      return { name: 'access', query: { oauth: 'error' }, replace: true }
    }
  }

  if (to.meta.requiresAuth && !session.isLoggedIn) {
    return { name: 'access' }
  }
  if (to.meta.guestOnly && session.isLoggedIn) {
    const hasInvitation = typeof to.query.mundo === 'string' || typeof to.query.provincia === 'string'
    return { name: hasInvitation ? 'homeGames' : 'home', query: to.query }
  }

  if (to.meta.requiresAuth && session.isLoggedIn && !session.state) {
    try {
      const worldCode = typeof to.params.worldCode === 'string' ? to.params.worldCode : undefined
      await session.refresh(worldCode)
    } catch {
      session.logout()
      return { name: 'access' }
    }
  }

  if (to.meta.requiresWorld) {
    const worldCode = typeof to.params.worldCode === 'string' ? to.params.worldCode : ''
    if (worldCode && session.state?.player) {
      const currentWorld = session.state.worlds.find((world) => world.id === session.state?.player?.worldId)
      if (currentWorld?.code !== worldCode) {
        await session.refresh(worldCode)
      }
    }
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
