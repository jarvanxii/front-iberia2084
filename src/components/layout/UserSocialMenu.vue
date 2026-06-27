<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import type { ChatConversationDto, UserRelationDto } from '@/types/game'
import { blockedUserIds } from '@/utils/accountModeration'
import { avatarByKey, DEFAULT_AVATAR } from '@/utils/userAvatars'

const emit = defineEmits<{
  logout: []
}>()

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const menuOpen = ref(false)
const selectedAvatarKey = ref(DEFAULT_AVATAR)
const relations = ref<UserRelationDto[]>([])
const conversations = ref<ChatConversationDto[]>([])
const mutedUsers = ref<number[]>(blockedUserIds())

let refreshTimer: number | undefined

const menuItems = [
  {
    key: 'chat',
    homeName: 'accountChat',
    gameName: 'gameAccountChat',
    label: 'Chat',
    description: 'Mensajes y conversaciones',
  },
  {
    key: 'friends',
    homeName: 'accountFriends',
    gameName: 'gameAccountFriends',
    label: 'Amigos',
    description: 'Solicitudes y usuarios agregados',
  },
  {
    key: 'preferences',
    homeName: 'accountPreferences',
    gameName: 'gameAccountPreferences',
    label: 'Preferencias',
    description: 'Avatar, sonidos y notificaciones',
  },
  {
    key: 'security',
    homeName: 'accountSecurity',
    gameName: 'gameAccountSecurity',
    label: 'Cuenta y seguridad',
    description: 'Perfil, acceso y confirmaciones',
  },
  {
    key: 'payments',
    homeName: 'accountPayments',
    gameName: 'gameAccountPayments',
    label: 'Pagos y domiciliaciones',
    description: 'Facturación en desarrollo',
  },
] as const

const player = computed(() => session.state?.player ?? null)
const displayName = computed(() => session.user?.displayName ?? player.value?.leaderName ?? 'Cuenta de Iberia 2084')
const username = computed(() => session.user?.username ?? 'sesion')
const accountEmail = computed(() => session.user?.email ?? `@${username.value}`)
const currentAvatar = computed(() => avatarByKey(selectedAvatarKey.value))
const pendingIncoming = computed(() =>
  relations.value.filter((relation) => relation.estado === 'pendiente' && relation.pendienteParaMi),
)
const unreadCount = computed(() =>
  conversations.value
    .filter((conversation) => !mutedUsers.value.includes(conversation.idUsuario))
    .reduce((total, conversation) => total + Math.max(0, conversation.mensajesNoLeidos), 0),
)
const badgeCount = computed(() => pendingIncoming.value.length + unreadCount.value)

function openMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) void loadSummary()
}

async function loadSummary() {
  if (!session.token) return
  try {
    const [settings, relationList, conversationList] = await Promise.all([
      api.userSettings(session.token),
      api.userRelations(session.token),
      api.chatConversations(session.token),
    ])
    selectedAvatarKey.value = settings.avatarKey || DEFAULT_AVATAR
    relations.value = relationList
    conversations.value = conversationList
  } catch {
    // The account views surface detailed errors. The header stays quiet.
  }
}

async function goMainMenu() {
  menuOpen.value = false
  await router.push({ name: 'home' })
}

function accountRoute(item: (typeof menuItems)[number]) {
  const worldCode = typeof route.params.worldCode === 'string' ? route.params.worldCode : ''
  if (worldCode) return { name: item.gameName, params: { worldCode } }
  return { name: item.homeName }
}

function requestLogout() {
  menuOpen.value = false
  emit('logout')
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('.user-social')) menuOpen.value = false
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}

function refreshMutedUsers() {
  mutedUsers.value = blockedUserIds()
}

onMounted(() => {
  window.addEventListener('click', closeOnOutsideClick)
  window.addEventListener('keydown', closeOnEscape)
  window.addEventListener('iberia2084:blocked-users-changed', refreshMutedUsers)
  void loadSummary()
  refreshTimer = window.setInterval(() => void loadSummary(), 15000)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeOnOutsideClick)
  window.removeEventListener('keydown', closeOnEscape)
  window.removeEventListener('iberia2084:blocked-users-changed', refreshMutedUsers)
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<template>
  <div class="user-social">
    <button
      type="button"
      class="social-trigger"
      :aria-expanded="menuOpen"
      aria-label="Abrir ajustes de usuario"
      @click.stop="openMenu"
    >
      <span class="avatar-frame">
        <span class="avatar-image">
          <img v-if="currentAvatar" :src="currentAvatar.src" alt="" />
          <span v-else class="avatar-fallback">IB</span>
        </span>
      </span>
      <b v-if="badgeCount > 0" class="social-badge">{{ badgeCount > 9 ? '9+' : badgeCount }}</b>
    </button>

    <section v-if="menuOpen" class="social-dropdown" aria-label="Ajustes de usuario" @click.stop>
      <header class="social-identity">
        <span class="identity-copy">
          <span class="identity-kicker">Usuario activo</span>
          <strong>{{ displayName }}</strong>
          <em>{{ accountEmail }}</em>
        </span>
        <span class="identity-status">Autorizado</span>
      </header>

      <nav class="social-menu" aria-label="Secciones de usuario">
        <RouterLink
          v-for="item in menuItems"
          :key="item.homeName"
          class="dropdown-action"
          :to="accountRoute(item)"
          @click="menuOpen = false"
        >
          <span class="dropdown-accent" :class="`dropdown-accent--${item.key}`" aria-hidden="true"></span>
          <span class="dropdown-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
          <span class="dropdown-arrow" aria-hidden="true"></span>
        </RouterLink>

        <button type="button" class="dropdown-action" @click="goMainMenu">
          <span class="dropdown-accent dropdown-accent--menu" aria-hidden="true"></span>
          <span class="dropdown-copy">
            <strong>Salir al menú principal</strong>
            <small>Volver al inicio</small>
          </span>
          <span class="dropdown-arrow" aria-hidden="true"></span>
        </button>
      </nav>

      <footer class="social-footer">
        <button type="button" class="logout-action" @click="requestLogout">
          <span class="logout-mark" aria-hidden="true"></span>
          <span>cerrar sesión</span>
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.user-social {
  position: relative;
  display: grid;
  justify-items: end;
}

.social-trigger {
  position: relative;
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 0;
  padding: 0;
  background: transparent;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.26));
}

.avatar-frame,
.avatar-image {
  display: grid;
  place-items: center;
  clip-path: polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%);
}

.avatar-frame {
  width: 50px;
  height: 50px;
  padding: 3px;
  background:
    linear-gradient(135deg, rgba(224, 240, 255, 0.96), rgba(82, 156, 224, 0.74) 42%, rgba(17, 43, 70, 0.98) 70%),
    #5aa7e8;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    0 0 0 1px rgba(4, 14, 26, 0.72);
  transition:
    filter 0.16s ease,
    transform 0.16s ease;
}

.avatar-image {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 12%, rgba(120, 188, 245, 0.24), transparent 68%),
    #071321;
}

.avatar-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.social-trigger:hover .avatar-frame,
.social-trigger[aria-expanded='true'] .avatar-frame {
  filter: brightness(1.1) saturate(1.06);
  transform: translateY(-1px);
}

.avatar-fallback {
  color: #dceeff;
  font-weight: 950;
}

.social-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border: 1px solid rgba(5, 16, 31, 0.94);
  border-radius: 999px;
  padding: 0 0.25rem;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4d9ee8);
  font-size: 0.66rem;
  font-weight: 950;
}

.social-dropdown {
  position: absolute;
  top: calc(100% + 0.52rem);
  right: 0;
  z-index: 1100;
  display: grid;
  width: min(430px, calc(100vw - 1rem));
  max-height: calc(100vh - 5rem);
  overflow: auto;
  border: 1px solid rgba(125, 190, 255, 0.18);
  border-top-color: rgba(155, 214, 255, 0.28);
  border-radius: 4px;
  padding: 8px;
  background:
    linear-gradient(145deg, rgba(90, 167, 232, 0.035), transparent 44%),
    linear-gradient(145deg, rgba(15, 28, 45, 0.99), rgba(8, 17, 30, 0.995) 62%, rgba(3, 9, 18, 1));
  box-shadow:
    0 14px 30px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.035);
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 214, 255, 0.34) transparent;
}

.social-identity {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: start;
  border-bottom: 1px solid rgba(125, 190, 255, 0.13);
  padding: 0.46rem 0.58rem 0.9rem;
}

.identity-copy {
  display: grid;
  min-width: 0;
  gap: 0.22rem;
}

.identity-kicker {
  color: #d8ae67;
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.identity-copy strong,
.identity-copy em,
.dropdown-copy strong,
.dropdown-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-copy strong {
  color: #f6fbff;
  font-size: 1.02rem;
  font-weight: 950;
  line-height: 1.12;
}

.identity-copy em {
  color: #a6b8ca;
  font-size: 0.84rem;
  font-style: normal;
  font-weight: 760;
  line-height: 1.2;
}

.identity-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid rgba(158, 230, 192, 0.24);
  border-radius: 999px;
  padding: 0 0.58rem;
  color: #bdebd1;
  background: rgba(158, 230, 192, 0.035);
  font-size: 0.7rem;
  font-weight: 950;
  line-height: 1;
  white-space: nowrap;
}

.social-menu {
  display: grid;
  gap: 3px;
  padding: 0.72rem 0 0.64rem;
}

.dropdown-action {
  display: grid;
  grid-template-columns: 7px minmax(0, 1fr) 14px;
  gap: 0.72rem;
  align-items: center;
  min-height: 58px;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.42rem 0.58rem;
  color: #dceeff;
  background: transparent;
  text-align: left;
  text-decoration: none;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    color 0.16s ease;
}

.dropdown-action:hover,
.dropdown-action:focus-visible,
.dropdown-action.router-link-active {
  border-color: rgba(155, 214, 255, 0.18);
  color: #ffffff;
  background: rgba(90, 167, 232, 0.075);
  outline: none;
}

.dropdown-accent {
  display: block;
  width: 4px;
  height: 32px;
  border-radius: 999px;
  background: rgba(213, 177, 107, 0.78);
}

.dropdown-accent--chat,
.dropdown-accent--preferences {
  background: rgba(137, 176, 202, 0.78);
}

.dropdown-accent--friends,
.dropdown-accent--menu {
  background: rgba(155, 214, 255, 0.72);
}

.dropdown-accent--payments {
  background: rgba(190, 166, 104, 0.78);
}

.dropdown-copy {
  display: grid;
  min-width: 0;
  gap: 0.18rem;
}

.dropdown-copy strong {
  color: currentColor;
  font-size: 0.96rem;
  font-weight: 950;
  line-height: 1.15;
}

.dropdown-copy small {
  color: #a6b8ca;
  font-size: 0.82rem;
  font-weight: 760;
  line-height: 1.28;
}

.dropdown-arrow {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.dropdown-arrow::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-top: 1.5px solid rgba(155, 214, 255, 0.62);
  border-right: 1.5px solid rgba(155, 214, 255, 0.62);
  content: '';
  transform: translate(-62%, -50%) rotate(45deg);
}

.dropdown-action:hover .dropdown-arrow::before,
.dropdown-action:focus-visible .dropdown-arrow::before,
.dropdown-action.router-link-active .dropdown-arrow::before {
  border-color: #dceeff;
}

.social-footer {
  border-top: 1px solid rgba(125, 190, 255, 0.11);
  padding-top: 0.72rem;
}

.logout-action {
  display: inline-flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid rgba(255, 125, 125, 0.24);
  border-radius: 4px;
  background: transparent;
  color: #ffc3c3;
  font: inherit;
  font-size: 0.96rem;
  font-weight: 950;
  text-align: center;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    color 0.16s ease;
}

.logout-action:hover,
.logout-action:focus-visible {
  border-color: rgba(255, 165, 165, 0.42);
  background: rgba(255, 125, 125, 0.07);
  color: #ffd7d7;
  outline: none;
}

.logout-mark {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right: 0;
  border-radius: 2px;
}

.logout-mark::before {
  position: absolute;
  top: 50%;
  left: 7px;
  width: 12px;
  height: 2px;
  background: currentColor;
  content: '';
  transform: translateY(-50%);
}

.logout-mark::after {
  position: absolute;
  top: 50%;
  left: 14px;
  width: 7px;
  height: 7px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  content: '';
  transform: translate(-50%, -50%) rotate(45deg);
}

@media (max-width: 760px) {
  .social-trigger {
    width: 42px;
    height: 42px;
  }

  .avatar-frame {
    width: 40px;
    height: 40px;
    padding: 2px;
  }

  .social-dropdown {
    position: fixed;
    top: calc(var(--game-header-height, var(--home-header-height, 72px)) + 0.5rem);
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
    max-height: calc(100dvh - var(--game-header-height, var(--home-header-height, 72px)) - 1rem);
  }

  .social-identity {
    grid-template-columns: minmax(0, 1fr);
  }

  .identity-status {
    justify-self: start;
  }
}
</style>
