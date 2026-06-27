<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import type { ChatConversationDto, UserRelationDto } from '@/types/game'
import { blockedUserIds } from '@/utils/accountModeration'
import { avatarByKey, avatarSrc, DEFAULT_AVATAR } from '@/utils/userAvatars'

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

const player = computed(() => session.state?.player ?? null)
const displayName = computed(() => session.user?.displayName ?? player.value?.leaderName ?? 'Cuenta de Iberia 2084')
const username = computed(() => session.user?.username ?? 'sesion')
const currentAvatar = computed(() => avatarByKey(selectedAvatarKey.value))
const pendingIncoming = computed(() =>
  relations.value.filter((relation) => relation.estado === 'pendiente' && relation.pendienteParaMi),
)
const friends = computed(() => relations.value.filter((relation) => relation.estado === 'aceptada'))
const unreadCount = computed(() =>
  conversations.value
    .filter((conversation) => !mutedUsers.value.includes(conversation.idUsuario))
    .reduce((total, conversation) => total + Math.max(0, conversation.mensajesNoLeidos), 0),
)
const badgeCount = computed(() => pendingIncoming.value.length + unreadCount.value)

const menuItems = computed(() => [
  {
    homeName: 'accountChat',
    gameName: 'gameAccountChat',
    label: 'chat',
    meta: unreadCount.value ? `${unreadCount.value} sin leer` : 'sin novedades',
  },
  {
    homeName: 'accountFriends',
    gameName: 'gameAccountFriends',
    label: 'amigos',
    meta: `${friends.value.length} agregados · ${pendingIncoming.value.length} pendientes`,
  },
  {
    homeName: 'accountPreferences',
    gameName: 'gameAccountPreferences',
    label: 'preferencias',
    meta: currentAvatar.value?.label ?? 'avatar',
  },
  { homeName: 'accountSecurity', gameName: 'gameAccountSecurity', label: 'cuenta y seguridad', meta: 'perfil y acceso' },
  { homeName: 'accountPayments', gameName: 'gameAccountPayments', label: 'pagos y domiciliaciones', meta: 'en desarrollo' },
])

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

function accountRoute(item: (typeof menuItems.value)[number]) {
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
        <span class="identity-avatar">
          <img :src="avatarSrc(selectedAvatarKey)" alt="" />
        </span>
        <span class="identity-copy">
          <strong>{{ displayName }}</strong>
          <em>@{{ username }}</em>
        </span>
      </header>

      <nav class="social-menu" aria-label="Secciones de usuario">
        <RouterLink
          v-for="item in menuItems"
          :key="item.homeName"
          class="dropdown-action"
          :to="accountRoute(item)"
          @click="menuOpen = false"
        >
          <span>{{ item.label }}</span>
          <small>{{ item.meta }}</small>
        </RouterLink>
        <button type="button" class="dropdown-action" @click="goMainMenu">
          <span>salir al menú principal</span>
          <small>volver al inicio</small>
        </button>
        <button type="button" class="dropdown-action danger" @click="requestLogout">
          <span>cerrar sesión</span>
          <small>finalizar acceso</small>
        </button>
      </nav>
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
.avatar-image,
.identity-avatar {
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

.avatar-image img,
.identity-avatar img {
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
  width: min(340px, calc(100vw - 1rem));
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.24);
  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 0%, rgba(90, 167, 232, 0.18), transparent 10rem),
    linear-gradient(180deg, rgba(13, 27, 43, 0.99), rgba(4, 12, 23, 0.99));
  box-shadow:
    0 22px 42px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

.social-identity {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 0.72rem;
  align-items: center;
  border-bottom: 1px solid rgba(125, 190, 255, 0.16);
  padding: 0.72rem;
}

.identity-avatar {
  width: 48px;
  height: 48px;
  border: 2px solid rgba(155, 214, 255, 0.5);
  background: rgba(3, 10, 18, 0.72);
}

.identity-copy {
  display: grid;
  min-width: 0;
  gap: 0.08rem;
}

.identity-copy strong,
.identity-copy em,
.dropdown-action span,
.dropdown-action small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-copy strong {
  color: #f6fbff;
  font-size: 0.98rem;
  font-weight: 950;
}

.identity-copy em {
  color: #94aec8;
  font-size: 0.75rem;
  font-style: normal;
  font-weight: 800;
}

.social-menu {
  display: grid;
}

.dropdown-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  min-height: 42px;
  border: 0;
  border-bottom: 1px solid rgba(125, 190, 255, 0.1);
  padding: 0.58rem 0.72rem;
  color: #dceeff;
  background: transparent;
  text-align: left;
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.dropdown-action:hover,
.dropdown-action:focus-visible,
.dropdown-action.router-link-active {
  color: #ffffff;
  background: rgba(90, 167, 232, 0.11);
  outline: none;
}

.dropdown-action span {
  font-weight: 950;
}

.dropdown-action small {
  color: #8da9c4;
  font-size: 0.72rem;
  font-weight: 850;
}

.dropdown-action.danger {
  border-bottom: 0;
  color: #ffb9b9;
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
  }
}
</style>
