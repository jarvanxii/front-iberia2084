<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import type { ChatConversationDto, ChatMessageDto } from '@/types/game'
import { blockedUserIds } from '@/utils/accountModeration'
import { avatarSrc } from '@/utils/userAvatars'

const session = useSessionStore()
const conversations = ref<ChatConversationDto[]>([])
const messages = ref<ChatMessageDto[]>([])
const selectedUserId = ref<number | null>(null)
const draft = ref('')
const loading = ref(false)
const sending = ref(false)
const errorMessage = ref('')
const mutedUsers = ref<number[]>(blockedUserIds())

let refreshTimer: number | undefined

const selectedConversation = computed(
  () => conversations.value.find((conversation) => conversation.idUsuario === selectedUserId.value) ?? null,
)
const selectedUserMuted = computed(() => (selectedUserId.value ? mutedUsers.value.includes(selectedUserId.value) : false))
const visibleConversations = computed(() =>
  conversations.value.map((conversation) => ({
    ...conversation,
    muted: mutedUsers.value.includes(conversation.idUsuario),
  })),
)
const canSend = computed(
  () => Boolean(selectedUserId.value && draft.value.trim()) && !selectedUserMuted.value,
)

function tokenOrFail() {
  if (!session.token) throw new Error('Inicia sesión para usar el chat.')
  return session.token
}

async function loadConversations(keepSelection = true) {
  try {
    conversations.value = await api.chatConversations(tokenOrFail())
    if (!keepSelection || !selectedUserId.value) {
      selectedUserId.value = conversations.value[0]?.idUsuario ?? null
    }
    if (selectedUserId.value && !conversations.value.some((conversation) => conversation.idUsuario === selectedUserId.value)) {
      selectedUserId.value = conversations.value[0]?.idUsuario ?? null
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo cargar el chat.'
  }
}

async function openConversation(userId: number) {
  selectedUserId.value = userId
  await loadMessages(userId)
}

async function loadMessages(userId: number) {
  loading.value = true
  errorMessage.value = ''
  try {
    messages.value = await api.chatMessages(tokenOrFail(), userId)
    await loadConversations(true)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar los mensajes.'
  } finally {
    loading.value = false
  }
}

async function sendMessage() {
  const text = draft.value.trim()
  const userId = selectedUserId.value
  if (!text || !userId || mutedUsers.value.includes(userId)) return

  sending.value = true
  errorMessage.value = ''
  try {
    await api.sendChatMessage(tokenOrFail(), userId, { mensaje: text })
    draft.value = ''
    await loadMessages(userId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'
  } finally {
    sending.value = false
  }
}

function refreshMutedUsers() {
  mutedUsers.value = blockedUserIds()
}

function relativeDate(value: string | null) {
  if (!value) return 'Sin mensajes'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(async () => {
  window.addEventListener('iberia2084:blocked-users-changed', refreshMutedUsers)
  await loadConversations(false)
  if (selectedUserId.value) await loadMessages(selectedUserId.value)
  refreshTimer = window.setInterval(() => {
    void loadConversations(true)
  }, 15000)
})

onBeforeUnmount(() => {
  window.removeEventListener('iberia2084:blocked-users-changed', refreshMutedUsers)
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<template>
  <section class="account-view chat-view">
    <header class="account-hero">
      <span>chat</span>
      <h1>Mensajes de tus contactos</h1>
      <p>Conversaciones privadas con usuarios agregados en Iberia 2084.</p>
    </header>

    <p v-if="errorMessage" class="account-alert error">{{ errorMessage }}</p>

    <section class="chat-shell">
      <aside class="conversation-panel" aria-label="Conversaciones">
        <header class="panel-heading">
          <strong>Conversaciones</strong>
          <span>{{ conversations.length }}</span>
        </header>

        <p v-if="!visibleConversations.length" class="empty-state">Agrega usuarios como amigos para abrir conversaciones.</p>
        <button
          v-for="conversation in visibleConversations"
          :key="conversation.idUsuario"
          type="button"
          class="conversation-row"
          :class="{ active: selectedUserId === conversation.idUsuario, muted: conversation.muted }"
          @click="openConversation(conversation.idUsuario)"
        >
          <img :src="avatarSrc(conversation.avatarKey)" alt="" />
          <span>
            <strong>{{ conversation.nombreUsuario }}</strong>
            <small>{{ conversation.muted ? 'Silenciado' : conversation.ultimoMensaje || 'Sin mensajes todavía' }}</small>
          </span>
          <em>{{ relativeDate(conversation.ultimoMensajeEn) }}</em>
          <b v-if="conversation.mensajesNoLeidos && !conversation.muted">{{ conversation.mensajesNoLeidos }}</b>
        </button>
      </aside>

      <main class="message-panel">
        <header v-if="selectedConversation" class="message-header">
          <img :src="avatarSrc(selectedConversation.avatarKey)" alt="" />
          <span>
            <strong>{{ selectedConversation.nombreUsuario }}</strong>
            <small>@{{ selectedConversation.username }}</small>
          </span>
          <em v-if="mutedUsers.includes(selectedConversation.idUsuario)">Silenciado</em>
        </header>

        <div class="message-list" aria-live="polite">
          <p v-if="loading && selectedUserId" class="empty-state">Cargando mensajes...</p>
          <p v-else-if="!selectedUserId" class="empty-state">Elige una conversación.</p>
          <p v-else-if="!messages.length" class="empty-state">Todavía no hay mensajes en esta conversación.</p>
          <article v-for="message in messages" :key="message.idMensaje" class="message-bubble" :class="{ mine: message.mio }">
            <p>{{ message.mensaje }}</p>
            <time>{{ relativeDate(message.dateTime) }}</time>
          </article>
        </div>

        <form class="message-form" @submit.prevent="sendMessage">
          <input
            v-model="draft"
            type="text"
            autocomplete="off"
            placeholder="Escribe un mensaje"
            :disabled="!selectedUserId || selectedUserMuted"
          />
          <button type="submit" :disabled="!canSend || sending">Enviar</button>
        </form>
      </main>
    </section>
  </section>
</template>

<style scoped>
.account-view {
  display: grid;
  gap: var(--compact-gap);
  min-height: calc(100vh - var(--home-header-height));
  padding: var(--space-page);
  color: var(--color-text);
}

.account-hero {
  display: grid;
  gap: 0.22rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.2rem 0 0.78rem;
}

.account-hero span,
.panel-heading span,
.message-header em {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.account-hero h1,
.account-hero p {
  margin: 0;
}

.account-hero h1 {
  font-size: clamp(1.55rem, 3vw, 2.35rem);
  line-height: 1.02;
}

.account-hero p {
  color: var(--color-muted);
  font-weight: 760;
}

.account-alert {
  margin: 0;
  border-left: 3px solid;
  padding: 0.64rem 0.76rem;
  font-weight: 850;
}

.account-alert.error {
  border-color: #ff9c9c;
  color: #ffd5d5;
  background: rgba(95, 27, 27, 0.22);
}

.chat-shell {
  display: grid;
  grid-template-columns: minmax(260px, 0.34fr) minmax(0, 1fr);
  gap: var(--compact-gap);
  min-height: min(680px, calc(100vh - var(--home-header-height) - 8rem));
}

.conversation-panel,
.message-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent 36%),
    var(--color-surface);
}

.conversation-panel {
  display: grid;
  align-content: start;
  gap: 0.36rem;
  overflow: auto;
  padding: 0.58rem;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  padding: 0.1rem 0.08rem 0.54rem;
}

.panel-heading strong {
  font-size: 0.9rem;
  font-weight: 950;
  text-transform: uppercase;
}

.conversation-row {
  position: relative;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  gap: 0.62rem;
  align-items: center;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.52rem;
  color: var(--color-text);
  background: rgba(3, 10, 18, 0.24);
  text-align: left;
}

.conversation-row:hover,
.conversation-row.active {
  border-color: rgba(155, 214, 255, 0.5);
  background: rgba(90, 167, 232, 0.1);
}

.conversation-row.muted {
  opacity: 0.72;
}

.conversation-row img,
.message-header img {
  display: block;
  width: 46px;
  height: 46px;
  object-fit: contain;
}

.conversation-row span,
.message-header span {
  display: grid;
  min-width: 0;
}

.conversation-row strong,
.conversation-row small,
.conversation-row em,
.message-header strong,
.message-header small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-row strong,
.message-header strong {
  font-weight: 950;
}

.conversation-row small,
.message-header small,
.conversation-row em {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 780;
}

.conversation-row b {
  position: absolute;
  top: 0.34rem;
  right: 0.34rem;
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 999px;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4d9ee8);
  font-size: 0.66rem;
  font-weight: 950;
}

.message-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.message-header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 0.68rem;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 0.68rem;
}

.message-list {
  display: grid;
  align-content: start;
  gap: 0.48rem;
  min-height: 0;
  overflow: auto;
  padding: 0.72rem;
}

.message-bubble {
  display: grid;
  gap: 0.28rem;
  width: fit-content;
  max-width: min(76%, 620px);
  border: 1px solid rgba(125, 190, 255, 0.15);
  border-radius: 8px 8px 8px 2px;
  padding: 0.62rem 0.72rem;
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
  font-weight: 760;
}

.message-bubble time {
  color: inherit;
  font-size: 0.66rem;
  font-weight: 860;
  opacity: 0.72;
}

.message-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  border-top: 1px solid var(--color-border);
  padding: 0.62rem;
}

.message-form input {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(125, 190, 255, 0.22);
  border-radius: 7px;
  padding: 0.58rem 0.68rem;
  color: #eef8ff;
  background: rgba(1, 8, 16, 0.58);
}

.message-form button {
  min-height: 42px;
  border: 1px solid rgba(155, 214, 255, 0.48);
  border-radius: 7px;
  padding: 0.5rem 0.92rem;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4b9de8);
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

@media (max-width: 860px) {
  .chat-shell {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .conversation-panel {
    max-height: 320px;
  }

  .message-panel {
    min-height: 520px;
  }
}

@media (max-width: 560px) {
  .account-view {
    padding: var(--space-page) 0;
  }

  .account-hero,
  .chat-shell {
    padding-inline: var(--space-page);
  }

  .message-form,
  .message-header,
  .conversation-row {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .conversation-row em,
  .message-header em {
    grid-column: 2;
  }

  .message-form {
    grid-template-columns: 1fr;
  }

  .message-bubble {
    max-width: 92%;
  }
}
</style>
