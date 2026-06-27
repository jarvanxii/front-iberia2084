<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import type { ChatConversationDto, ChatMessageDto, UserAutocompleteDto, UserRelationDto } from '@/types/game'

const props = withDefaults(
  defineProps<{
    context?: 'home' | 'game'
    showHomeAction?: boolean
  }>(),
  {
    context: 'home',
    showHomeAction: false,
  },
)

const emit = defineEmits<{
  logout: []
  leaveHome: []
}>()

type Panel = 'avatar' | 'friends' | 'chat'

interface AvatarOption {
  key: string
  label: string
  src: string
}

const avatarModules = import.meta.glob('../../assets/personajes/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const avatars = Object.entries(avatarModules)
  .map(([path, src]) => {
    const rawName = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'avatar'
    return {
      key: slug(rawName),
      label: title(rawName),
      src,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'es'))

const DEFAULT_AVATAR = avatars.find((avatar) => avatar.key === 'abalos')?.key ?? avatars[0]?.key ?? ''

const session = useSessionStore()
const menuOpen = ref(false)
const modalOpen = ref(false)
const activePanel = ref<Panel>('avatar')
const selectedAvatarKey = ref(DEFAULT_AVATAR)
const relations = ref<UserRelationDto[]>([])
const searchResults = ref<UserAutocompleteDto[]>([])
const conversations = ref<ChatConversationDto[]>([])
const messages = ref<ChatMessageDto[]>([])
const selectedConversationId = ref<number | null>(null)
const searchText = ref('')
const manualUsername = ref('')
const chatDraft = ref('')
const loading = ref(false)
const searchLoading = ref(false)
const savingAvatar = ref('')
const sendingRelation = ref('')
const sendingMessage = ref(false)
const errorMessage = ref('')
const noticeMessage = ref('')

let refreshTimer: number | undefined
let searchTimer: number | undefined

const player = computed(() => session.state?.player ?? null)
const displayName = computed(() => session.user?.displayName ?? player.value?.leaderName ?? 'Cuenta de Iberia 2084')
const username = computed(() => session.user?.username ?? 'sesion')
const currentAvatar = computed(() => avatarByKey(selectedAvatarKey.value))
const pendingIncoming = computed(() =>
  relations.value.filter((relation) => relation.estado === 'pendiente' && relation.pendienteParaMi),
)
const pendingOutgoing = computed(() =>
  relations.value.filter((relation) => relation.estado === 'pendiente' && relation.solicitadaPorMi),
)
const friends = computed(() => relations.value.filter((relation) => relation.estado === 'aceptada'))
const unreadCount = computed(() =>
  conversations.value.reduce((total, conversation) => total + Math.max(0, conversation.mensajesNoLeidos), 0),
)
const badgeCount = computed(() => pendingIncoming.value.length + unreadCount.value)
const selectedConversation = computed(() =>
  conversations.value.find((conversation) => conversation.idUsuario === selectedConversationId.value) ?? null,
)

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function title(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function avatarByKey(key: string | null | undefined) {
  return avatars.find((avatar) => avatar.key === key) ?? avatars.find((avatar) => avatar.key === DEFAULT_AVATAR) ?? avatars[0]
}

function avatarSrc(key: string | null | undefined) {
  return avatarByKey(key)?.src ?? ''
}

function tokenOrFail() {
  if (!session.token) throw new Error('Inicia sesión para usar la cuenta.')
  return session.token
}

function openMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) void loadSocial(true)
}

function openPanel(panel: Panel) {
  activePanel.value = panel
  modalOpen.value = true
  menuOpen.value = false
  void loadSocial(true)
  if (panel === 'chat' && selectedConversationId.value) void loadMessages(selectedConversationId.value)
}

function closeModal() {
  modalOpen.value = false
  clearStatus()
}

function clearStatus() {
  errorMessage.value = ''
  noticeMessage.value = ''
}

async function loadSocial(silent = false) {
  if (!session.token) return
  if (!silent) loading.value = true
  errorMessage.value = ''

  try {
    const token = tokenOrFail()
    const [settings, relationList, conversationList] = await Promise.all([
      api.userSettings(token),
      api.userRelations(token),
      api.chatConversations(token),
    ])
    selectedAvatarKey.value = settings.avatarKey || DEFAULT_AVATAR
    relations.value = relationList
    conversations.value = conversationList

    const firstConversation = conversationList[0]
    if (!selectedConversationId.value && firstConversation) {
      selectedConversationId.value = firstConversation.idUsuario
    }
  } catch (error) {
    if (!silent) errorMessage.value = error instanceof Error ? error.message : 'No se pudo cargar la cuenta.'
  } finally {
    loading.value = false
  }
}

async function selectAvatar(avatar: AvatarOption) {
  const previousAvatar = selectedAvatarKey.value
  selectedAvatarKey.value = avatar.key
  savingAvatar.value = avatar.key
  clearStatus()

  try {
    const settings = await api.updateUserSettings(tokenOrFail(), { avatarKey: avatar.key })
    selectedAvatarKey.value = settings.avatarKey || avatar.key
    noticeMessage.value = 'Avatar actualizado.'
  } catch (error) {
    selectedAvatarKey.value = previousAvatar
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo guardar el avatar.'
  } finally {
    savingAvatar.value = ''
  }
}

async function runUserSearch() {
  const text = searchText.value.trim()
  searchResults.value = []
  if (text.length < 2 || !session.token) return

  searchLoading.value = true
  try {
    searchResults.value = await api.searchUsers(session.token, text)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo buscar usuarios.'
  } finally {
    searchLoading.value = false
  }
}

async function addFriend(result?: UserAutocompleteDto) {
  const usernameValue = manualUsername.value.trim() || result?.username || searchText.value.trim()
  if (!result && usernameValue.length < 3) {
    errorMessage.value = 'Escribe un usuario válido.'
    return
  }

  sendingRelation.value = String(result?.idUsuario ?? usernameValue)
  clearStatus()
  try {
    await api.createUserRelation(tokenOrFail(), result ? { idUsuarioDestino: result.idUsuario } : { usernameDestino: usernameValue })
    noticeMessage.value = 'Solicitud enviada.'
    manualUsername.value = ''
    searchText.value = ''
    searchResults.value = []
    await loadSocial(true)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo enviar la solicitud.'
  } finally {
    sendingRelation.value = ''
  }
}

async function acceptRelation(relation: UserRelationDto) {
  await relationAction(() => api.acceptUserRelation(tokenOrFail(), relation.idRelacionUsuario), 'Solicitud aceptada.')
}

async function rejectRelation(relation: UserRelationDto) {
  await relationAction(() => api.rejectUserRelation(tokenOrFail(), relation.idRelacionUsuario), 'Solicitud rechazada.')
}

async function deleteRelation(relation: UserRelationDto) {
  await relationAction(() => api.deleteUserRelation(tokenOrFail(), relation.idRelacionUsuario), 'Relación eliminada.')
}

async function relationAction(action: () => Promise<unknown>, successMessage: string) {
  clearStatus()
  loading.value = true
  try {
    await action()
    noticeMessage.value = successMessage
    await loadSocial(true)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo completar la operación.'
  } finally {
    loading.value = false
  }
}

async function openConversation(userId: number) {
  selectedConversationId.value = userId
  activePanel.value = 'chat'
  await loadMessages(userId)
}

async function loadMessages(userId: number) {
  clearStatus()
  loading.value = true
  try {
    messages.value = await api.chatMessages(tokenOrFail(), userId)
    await loadSocial(true)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar los mensajes.'
  } finally {
    loading.value = false
  }
}

async function sendMessage() {
  const message = chatDraft.value.trim()
  const userId = selectedConversationId.value
  if (!message || !userId) return

  sendingMessage.value = true
  clearStatus()
  try {
    await api.sendChatMessage(tokenOrFail(), userId, { mensaje: message })
    chatDraft.value = ''
    await loadMessages(userId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'
  } finally {
    sendingMessage.value = false
  }
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('.user-social')) menuOpen.value = false
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    menuOpen.value = false
    modalOpen.value = false
  }
}

function requestLogout() {
  menuOpen.value = false
  modalOpen.value = false
  emit('logout')
}

function requestLeaveHome() {
  menuOpen.value = false
  modalOpen.value = false
  emit('leaveHome')
}

watch(searchText, () => {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => void runUserSearch(), 260)
})

watch(selectedConversationId, (userId) => {
  if (modalOpen.value && activePanel.value === 'chat' && userId) void loadMessages(userId)
})

onMounted(() => {
  window.addEventListener('click', closeOnOutsideClick)
  window.addEventListener('keydown', closeOnEscape)
  void loadSocial(true)
  refreshTimer = window.setInterval(() => void loadSocial(true), 15000)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeOnOutsideClick)
  window.removeEventListener('keydown', closeOnEscape)
  if (refreshTimer) window.clearInterval(refreshTimer)
  if (searchTimer) window.clearTimeout(searchTimer)
})
</script>

<template>
  <div class="user-social" :class="`is-${props.context}`">
    <button
      type="button"
      class="social-trigger"
      :aria-expanded="menuOpen"
      aria-label="Abrir cuenta, amigos y chat"
      @click.stop="openMenu"
    >
      <img v-if="currentAvatar" :src="currentAvatar.src" alt="" />
      <span v-else class="avatar-fallback">IB</span>
      <b v-if="badgeCount > 0" class="social-badge">{{ badgeCount > 9 ? '9+' : badgeCount }}</b>
    </button>

    <section v-if="menuOpen" class="social-dropdown" aria-label="Cuenta de usuario" @click.stop>
      <div class="social-identity">
        <img v-if="currentAvatar" :src="currentAvatar.src" alt="" />
        <div>
          <strong>{{ displayName }}</strong>
          <span>@{{ username }}</span>
        </div>
      </div>

      <button type="button" class="dropdown-action" @click="openPanel('avatar')">
        <span>Avatar</span>
        <small>{{ currentAvatar?.label }}</small>
      </button>
      <button type="button" class="dropdown-action" @click="openPanel('friends')">
        <span>Amigos</span>
        <small>{{ friends.length }} activos · {{ pendingIncoming.length }} pendientes</small>
      </button>
      <button type="button" class="dropdown-action" @click="openPanel('chat')">
        <span>Chat</span>
        <small>{{ unreadCount }} sin leer</small>
      </button>
      <button v-if="showHomeAction" type="button" class="dropdown-action" @click="requestLeaveHome">
        <span>Salir al menú principal</span>
      </button>
      <button type="button" class="dropdown-action danger" @click="requestLogout">
        <span>Cerrar sesión</span>
      </button>
    </section>

    <Teleport to="body">
      <div v-if="modalOpen" class="social-overlay" @click.self="closeModal">
        <section class="social-modal" aria-label="Panel social de Iberia 2084">
          <header class="social-modal-header">
            <div class="social-modal-title">
              <img v-if="currentAvatar" :src="currentAvatar.src" alt="" />
              <div>
                <strong>{{ displayName }}</strong>
                <span>Cuenta, amistades y mensajes</span>
              </div>
            </div>
            <button type="button" class="icon-close" aria-label="Cerrar" @click="closeModal">×</button>
          </header>

          <nav class="social-tabs" aria-label="Secciones sociales">
            <button type="button" :class="{ active: activePanel === 'avatar' }" @click="activePanel = 'avatar'">Avatar</button>
            <button type="button" :class="{ active: activePanel === 'friends' }" @click="activePanel = 'friends'">
              Amigos
              <b v-if="pendingIncoming.length">{{ pendingIncoming.length }}</b>
            </button>
            <button type="button" :class="{ active: activePanel === 'chat' }" @click="activePanel = 'chat'">
              Chat
              <b v-if="unreadCount">{{ unreadCount }}</b>
            </button>
          </nav>

          <p v-if="errorMessage" class="social-alert error">{{ errorMessage }}</p>
          <p v-else-if="noticeMessage" class="social-alert ok">{{ noticeMessage }}</p>

          <div v-if="activePanel === 'avatar'" class="avatar-panel">
            <button
              v-for="avatar in avatars"
              :key="avatar.key"
              type="button"
              class="avatar-choice"
              :class="{ active: avatar.key === selectedAvatarKey }"
              :disabled="savingAvatar === avatar.key"
              @click="selectAvatar(avatar)"
            >
              <img :src="avatar.src" :alt="avatar.label" />
              <span>{{ avatar.label }}</span>
            </button>
          </div>

          <div v-else-if="activePanel === 'friends'" class="friends-panel">
            <form class="friend-form" @submit.prevent="addFriend()">
              <label>
                <span>Buscar usuario</span>
                <input v-model="searchText" type="search" autocomplete="off" placeholder="Nombre o usuario" />
              </label>
              <label>
                <span>Agregar por usuario</span>
                <input v-model="manualUsername" type="text" autocomplete="off" placeholder="usuario" />
              </label>
              <button type="submit" :disabled="Boolean(sendingRelation)">Enviar solicitud</button>
            </form>

            <div v-if="searchText.trim().length >= 2" class="result-list">
              <p v-if="searchLoading" class="empty-state">Buscando usuarios...</p>
              <button
                v-for="result in searchResults"
                v-else
                :key="result.idUsuario"
                type="button"
                class="user-row"
                :disabled="sendingRelation === String(result.idUsuario)"
                @click="addFriend(result)"
              >
                <img :src="avatarSrc(result.avatarKey)" alt="" />
                <span>
                  <strong>{{ result.nombreUsuario }}</strong>
                  <small>@{{ result.username }}</small>
                </span>
                <em>Agregar</em>
              </button>
            </div>

            <section v-if="pendingIncoming.length" class="social-section">
              <h3>Solicitudes</h3>
              <article v-for="relation in pendingIncoming" :key="relation.idRelacionUsuario" class="relation-card">
                <img :src="avatarSrc(relation.avatarKeyOtroUsuario)" alt="" />
                <div>
                  <strong>{{ relation.nombreOtroUsuario }}</strong>
                  <span>@{{ relation.usernameOtroUsuario }}</span>
                </div>
                <button type="button" @click="acceptRelation(relation)">Aceptar</button>
                <button type="button" class="ghost" @click="rejectRelation(relation)">Rechazar</button>
              </article>
            </section>

            <section class="social-section">
              <h3>Amigos</h3>
              <p v-if="!friends.length" class="empty-state">Aún no hay amistades aceptadas.</p>
              <article v-for="relation in friends" :key="relation.idRelacionUsuario" class="relation-card">
                <img :src="avatarSrc(relation.avatarKeyOtroUsuario)" alt="" />
                <div>
                  <strong>{{ relation.nombreOtroUsuario }}</strong>
                  <span>@{{ relation.usernameOtroUsuario }}</span>
                </div>
                <button type="button" @click="openConversation(relation.idOtroUsuario)">Chat</button>
                <button type="button" class="ghost" @click="deleteRelation(relation)">Quitar</button>
              </article>
            </section>

            <section v-if="pendingOutgoing.length" class="social-section">
              <h3>Enviadas</h3>
              <article v-for="relation in pendingOutgoing" :key="relation.idRelacionUsuario" class="relation-card compact">
                <img :src="avatarSrc(relation.avatarKeyOtroUsuario)" alt="" />
                <div>
                  <strong>{{ relation.nombreOtroUsuario }}</strong>
                  <span>Pendiente</span>
                </div>
                <button type="button" class="ghost" @click="deleteRelation(relation)">Cancelar</button>
              </article>
            </section>
          </div>

          <div v-else class="chat-panel">
            <aside class="conversation-list">
              <p v-if="!conversations.length" class="empty-state">Acepta amistades para abrir conversaciones.</p>
              <button
                v-for="conversation in conversations"
                :key="conversation.idUsuario"
                type="button"
                class="conversation-row"
                :class="{ active: selectedConversationId === conversation.idUsuario }"
                @click="openConversation(conversation.idUsuario)"
              >
                <img :src="avatarSrc(conversation.avatarKey)" alt="" />
                <span>
                  <strong>{{ conversation.nombreUsuario }}</strong>
                  <small>{{ conversation.ultimoMensaje || 'Sin mensajes todavía' }}</small>
                </span>
                <b v-if="conversation.mensajesNoLeidos">{{ conversation.mensajesNoLeidos }}</b>
              </button>
            </aside>

            <section class="message-panel">
              <header v-if="selectedConversation" class="message-header">
                <img :src="avatarSrc(selectedConversation.avatarKey)" alt="" />
                <div>
                  <strong>{{ selectedConversation.nombreUsuario }}</strong>
                  <span>@{{ selectedConversation.username }}</span>
                </div>
              </header>
              <div class="message-list">
                <p v-if="loading && selectedConversationId" class="empty-state">Cargando mensajes...</p>
                <p v-else-if="!selectedConversationId" class="empty-state">Elige una conversación.</p>
                <p v-else-if="!messages.length" class="empty-state">Todavía no hay mensajes.</p>
                <article v-for="message in messages" :key="message.idMensaje" class="message-bubble" :class="{ mine: message.mio }">
                  <p>{{ message.mensaje }}</p>
                </article>
              </div>
              <form class="message-form" @submit.prevent="sendMessage">
                <input
                  v-model="chatDraft"
                  type="text"
                  autocomplete="off"
                  placeholder="Escribe un mensaje"
                  :disabled="!selectedConversationId"
                />
                <button type="submit" :disabled="!chatDraft.trim() || !selectedConversationId || sendingMessage">Enviar</button>
              </form>
            </section>
          </div>
        </section>
      </div>
    </Teleport>
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
  width: 50px;
  height: 50px;
  place-items: center;
  overflow: visible;
  border: 1px solid rgba(125, 190, 255, 0.2);
  border-radius: var(--radius-lg, 8px);
  padding: 0;
  background:
    radial-gradient(circle at 50% 12%, rgba(114, 190, 255, 0.18), transparent 64%),
    rgba(3, 10, 18, 0.36);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition:
    border-color 0.16s ease,
    filter 0.16s ease,
    transform 0.16s ease;
}

.social-trigger:hover,
.social-trigger[aria-expanded='true'] {
  border-color: rgba(155, 214, 255, 0.58);
  filter: brightness(1.08);
}

.social-trigger img,
.social-identity img,
.social-modal-title img,
.relation-card img,
.conversation-row img,
.message-header img,
.user-row img,
.avatar-choice img {
  display: block;
  object-fit: contain;
}

.social-trigger img {
  width: 39px;
  height: 39px;
  filter: drop-shadow(0 0 10px rgba(90, 167, 232, 0.24));
}

.avatar-fallback {
  color: #9bd6ff;
  font-weight: 950;
}

.social-badge,
.social-tabs b,
.conversation-row b {
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4d9ee8);
  font-weight: 950;
}

.social-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 19px;
  height: 19px;
  border: 1px solid rgba(5, 16, 31, 0.94);
  padding: 0 0.25rem;
  font-size: 0.66rem;
}

.social-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 1100;
  display: grid;
  width: min(330px, calc(100vw - 1rem));
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.26);
  border-radius: var(--radius-md, 8px);
  background:
    radial-gradient(circle at 20% 0%, rgba(90, 167, 232, 0.18), transparent 10rem),
    linear-gradient(180deg, rgba(13, 27, 43, 0.98), rgba(4, 12, 23, 0.98));
  box-shadow:
    0 22px 42px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

.social-identity {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 0.72rem;
  align-items: center;
  border-bottom: 1px solid rgba(125, 190, 255, 0.16);
  padding: 0.72rem;
}

.social-identity img {
  width: 46px;
  height: 46px;
}

.social-identity div,
.social-modal-title div,
.user-row span,
.relation-card div,
.conversation-row span,
.message-header div {
  display: grid;
  min-width: 0;
}

.social-identity strong,
.social-identity span,
.dropdown-action span,
.dropdown-action small,
.relation-card strong,
.relation-card span,
.conversation-row strong,
.conversation-row small,
.message-header strong,
.message-header span,
.user-row strong,
.user-row small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.social-identity strong,
.social-modal-title strong {
  color: #f6fbff;
  font-size: 0.98rem;
  font-weight: 950;
}

.social-identity span,
.social-modal-title span {
  color: #94aec8;
  font-size: 0.75rem;
  font-weight: 800;
}

.dropdown-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  min-height: 42px;
  border: 0;
  border-bottom: 1px solid rgba(125, 190, 255, 0.1);
  padding: 0.56rem 0.72rem;
  color: #dceeff;
  background: transparent;
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.dropdown-action:hover,
.dropdown-action:focus-visible {
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

.social-overlay {
  position: fixed;
  z-index: 2200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.7rem, 2vw, 1.4rem);
  background: rgba(1, 7, 14, 0.72);
  backdrop-filter: blur(9px);
}

.social-modal {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  width: min(960px, 100%);
  max-height: min(760px, calc(100vh - 1.4rem));
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.26);
  border-radius: 8px;
  background:
    radial-gradient(circle at 0 0, rgba(83, 154, 227, 0.16), transparent 18rem),
    linear-gradient(180deg, #102236, #061220);
  box-shadow:
    0 28px 70px rgba(0, 0, 0, 0.58),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.social-modal-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(125, 190, 255, 0.16);
  padding: 0.9rem;
}

.social-modal-title {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.social-modal-title img {
  width: 52px;
  height: 52px;
}

.icon-close {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(125, 190, 255, 0.22);
  border-radius: 7px;
  color: #dceeff;
  background: rgba(3, 10, 18, 0.28);
  font-size: 1.38rem;
  line-height: 1;
}

.social-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.22rem;
  border-bottom: 1px solid rgba(125, 190, 255, 0.12);
  padding: 0.52rem;
}

.social-tabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border: 1px solid rgba(125, 190, 255, 0.16);
  border-radius: 7px;
  color: #a9bed2;
  background: rgba(3, 10, 18, 0.24);
  font-weight: 950;
}

.social-tabs button.active {
  color: #071321;
  border-color: rgba(155, 214, 255, 0.72);
  background: linear-gradient(180deg, #9bd6ff, #4f9fe7);
}

.social-tabs b {
  min-width: 18px;
  height: 18px;
  margin-left: 0.35rem;
  font-size: 0.64rem;
}

.social-alert {
  margin: 0.52rem 0.7rem 0;
  border-left: 3px solid;
  padding: 0.58rem 0.68rem;
  font-weight: 850;
}

.social-alert.error {
  border-color: #ff9c9c;
  color: #ffd5d5;
  background: rgba(95, 27, 27, 0.22);
}

.social-alert.ok {
  border-color: #8fdcc9;
  color: #d6fff6;
  background: rgba(37, 108, 91, 0.2);
}

.avatar-panel,
.friends-panel,
.chat-panel {
  min-height: 0;
  overflow: auto;
  padding: 0.7rem;
}

.avatar-panel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(98px, 1fr));
  gap: 0.52rem;
}

.avatar-choice {
  display: grid;
  gap: 0.42rem;
  min-height: 118px;
  justify-items: center;
  align-content: center;
  border: 1px solid rgba(125, 190, 255, 0.15);
  border-radius: 8px;
  padding: 0.62rem;
  color: #c8d9e8;
  background: rgba(3, 10, 18, 0.26);
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    transform 0.16s ease;
}

.avatar-choice:hover,
.avatar-choice.active {
  border-color: rgba(155, 214, 255, 0.68);
  background: rgba(90, 167, 232, 0.13);
}

.avatar-choice.active {
  transform: translateY(-1px);
}

.avatar-choice img {
  width: 58px;
  height: 58px;
}

.avatar-choice span {
  width: 100%;
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 900;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friends-panel {
  display: grid;
  gap: 0.72rem;
}

.friend-form {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr) auto;
  gap: 0.5rem;
  align-items: end;
}

.friend-form label {
  display: grid;
  gap: 0.26rem;
}

.friend-form span,
.social-section h3 {
  color: #9bd6ff;
  font-size: 0.74rem;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.friend-form input,
.message-form input {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(125, 190, 255, 0.22);
  border-radius: 7px;
  padding: 0.58rem 0.68rem;
  color: #eef8ff;
  background: rgba(1, 8, 16, 0.58);
  font: inherit;
}

.friend-form button,
.relation-card button,
.message-form button {
  min-height: 42px;
  border: 1px solid rgba(155, 214, 255, 0.48);
  border-radius: 7px;
  padding: 0.5rem 0.72rem;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4b9de8);
  font-weight: 950;
}

.relation-card button.ghost {
  color: #d9ebfb;
  border-color: rgba(125, 190, 255, 0.18);
  background: rgba(3, 10, 18, 0.28);
}

.friend-form button:disabled,
.relation-card button:disabled,
.message-form button:disabled,
.avatar-choice:disabled,
.user-row:disabled {
  cursor: default;
  filter: grayscale(0.45) opacity(0.7);
}

.result-list,
.social-section {
  display: grid;
  gap: 0.42rem;
}

.social-section {
  border-top: 1px solid rgba(125, 190, 255, 0.12);
  padding-top: 0.68rem;
}

.user-row,
.relation-card,
.conversation-row,
.message-header {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 0.62rem;
  align-items: center;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.55rem;
  background: rgba(3, 10, 18, 0.24);
}

.relation-card {
  grid-template-columns: 42px minmax(0, 1fr) auto auto;
}

.relation-card.compact {
  grid-template-columns: 42px minmax(0, 1fr) auto;
}

.user-row {
  width: 100%;
  color: #dceeff;
  text-align: left;
}

.user-row img,
.relation-card img,
.conversation-row img,
.message-header img {
  width: 42px;
  height: 42px;
}

.user-row strong,
.relation-card strong,
.conversation-row strong,
.message-header strong {
  color: #f4fbff;
  font-size: 0.88rem;
  font-weight: 950;
}

.user-row small,
.relation-card span,
.conversation-row small,
.message-header span {
  color: #8da9c4;
  font-size: 0.72rem;
  font-weight: 800;
}

.user-row em {
  color: #9bd6ff;
  font-style: normal;
  font-weight: 950;
}

.empty-state {
  margin: 0;
  border: 1px solid rgba(125, 190, 255, 0.12);
  border-radius: 8px;
  padding: 0.85rem;
  color: #9fb6cc;
  background: rgba(3, 10, 18, 0.22);
  font-weight: 850;
  text-align: center;
}

.chat-panel {
  display: grid;
  grid-template-columns: minmax(220px, 0.45fr) minmax(0, 1fr);
  gap: 0.7rem;
}

.conversation-list {
  display: grid;
  align-content: start;
  gap: 0.42rem;
  min-height: 0;
  overflow: auto;
}

.conversation-row {
  width: 100%;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  color: #dceeff;
  text-align: left;
}

.conversation-row.active {
  border-color: rgba(155, 214, 255, 0.62);
  background: rgba(90, 167, 232, 0.13);
}

.conversation-row b {
  min-width: 22px;
  height: 22px;
  font-size: 0.7rem;
}

.message-panel {
  display: grid;
  grid-template-rows: auto minmax(260px, 1fr) auto;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  background: rgba(1, 8, 16, 0.32);
}

.message-header {
  border-width: 0 0 1px;
  border-radius: 0;
}

.message-list {
  display: grid;
  align-content: start;
  gap: 0.45rem;
  min-height: 0;
  overflow: auto;
  padding: 0.7rem;
}

.message-bubble {
  max-width: min(78%, 520px);
  border: 1px solid rgba(125, 190, 255, 0.15);
  border-radius: 8px 8px 8px 2px;
  padding: 0.58rem 0.68rem;
  color: #dceeff;
  background: rgba(18, 34, 53, 0.82);
}

.message-bubble.mine {
  justify-self: end;
  border-color: rgba(155, 214, 255, 0.34);
  border-radius: 8px 8px 2px;
  color: #071321;
  background: linear-gradient(180deg, #a9dcff, #60abea);
}

.message-bubble p {
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 750;
}

.message-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  border-top: 1px solid rgba(125, 190, 255, 0.12);
  padding: 0.6rem;
}

@media (max-width: 760px) {
  .social-trigger {
    width: 40px;
    height: 40px;
    border-radius: 7px;
  }

  .social-trigger img {
    width: 31px;
    height: 31px;
  }

  .social-dropdown {
    position: fixed;
    top: calc(var(--game-header-height, var(--home-header-height, 72px)) + 0.5rem);
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
  }

  .social-overlay {
    padding: 0.45rem;
  }

  .social-modal {
    max-height: calc(100vh - 0.9rem);
  }

  .social-modal-header {
    padding: 0.72rem;
  }

  .social-modal-title {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .social-modal-title img {
    width: 42px;
    height: 42px;
  }

  .avatar-panel {
    grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
    gap: 0.42rem;
    padding: 0.52rem;
  }

  .avatar-choice {
    min-height: 98px;
    padding: 0.45rem;
  }

  .avatar-choice img {
    width: 48px;
    height: 48px;
  }

  .friend-form,
  .chat-panel,
  .message-form {
    grid-template-columns: 1fr;
  }

  .conversation-list {
    max-height: 210px;
  }

  .message-panel {
    grid-template-rows: auto minmax(240px, 1fr) auto;
  }

  .relation-card {
    grid-template-columns: 38px minmax(0, 1fr) auto;
  }

  .relation-card button.ghost {
    grid-column: 2 / -1;
    width: 100%;
  }
}
</style>
