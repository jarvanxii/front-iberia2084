<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import type { UserAutocompleteDto, UserRelationDto } from '@/types/game'
import { blockUser, blockedUserIds, unblockUser } from '@/utils/accountModeration'
import { avatarSrc } from '@/utils/userAvatars'

const session = useSessionStore()
const relations = ref<UserRelationDto[]>([])
const searchText = ref('')
const manualUsername = ref('')
const searchResults = ref<UserAutocompleteDto[]>([])
const mutedUsers = ref<number[]>(blockedUserIds())
const loading = ref(false)
const searchLoading = ref(false)
const actionKey = ref('')
const errorMessage = ref('')
const noticeMessage = ref('')

let searchTimer: number | undefined

const incomingRequests = computed(() =>
  relations.value.filter((relation) => relation.estado === 'pendiente' && relation.pendienteParaMi),
)
const outgoingRequests = computed(() =>
  relations.value.filter((relation) => relation.estado === 'pendiente' && relation.solicitadaPorMi),
)
const friends = computed(() =>
  relations.value
    .filter((relation) => relation.estado === 'aceptada')
    .map((relation) => ({
      ...relation,
      muted: mutedUsers.value.includes(relation.idOtroUsuario),
    })),
)
const mutedFriends = computed(() => friends.value.filter((friend) => friend.muted))

function tokenOrFail() {
  if (!session.token) throw new Error('Inicia sesión para gestionar amigos.')
  return session.token
}

function clearStatus() {
  errorMessage.value = ''
  noticeMessage.value = ''
}

async function loadRelations() {
  loading.value = true
  clearStatus()
  try {
    relations.value = await api.userRelations(tokenOrFail())
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar los amigos.'
  } finally {
    loading.value = false
  }
}

async function runUserSearch() {
  const text = searchText.value.trim()
  searchResults.value = []
  if (text.length < 2 || !session.token) return

  searchLoading.value = true
  clearStatus()
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

  actionKey.value = `add:${result?.idUsuario ?? usernameValue}`
  clearStatus()
  try {
    await api.createUserRelation(tokenOrFail(), result ? { idUsuarioDestino: result.idUsuario } : { usernameDestino: usernameValue })
    noticeMessage.value = 'Solicitud enviada.'
    manualUsername.value = ''
    searchText.value = ''
    searchResults.value = []
    await loadRelations()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo enviar la solicitud.'
  } finally {
    actionKey.value = ''
  }
}

async function relationAction(
  relation: UserRelationDto,
  action: () => Promise<unknown>,
  successMessage: string,
) {
  actionKey.value = String(relation.idRelacionUsuario)
  clearStatus()
  try {
    await action()
    noticeMessage.value = successMessage
    await loadRelations()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo completar la operación.'
  } finally {
    actionKey.value = ''
  }
}

function acceptRelation(relation: UserRelationDto) {
  void relationAction(relation, () => api.acceptUserRelation(tokenOrFail(), relation.idRelacionUsuario), 'Solicitud aceptada.')
}

function rejectRelation(relation: UserRelationDto) {
  void relationAction(relation, () => api.rejectUserRelation(tokenOrFail(), relation.idRelacionUsuario), 'Solicitud rechazada.')
}

function deleteRelation(relation: UserRelationDto) {
  void relationAction(relation, () => api.deleteUserRelation(tokenOrFail(), relation.idRelacionUsuario), 'Usuario eliminado.')
}

function muteFriend(relation: UserRelationDto) {
  blockUser(relation.idOtroUsuario)
  mutedUsers.value = blockedUserIds()
  noticeMessage.value = `${relation.nombreOtroUsuario} queda silenciado.`
}

function unmuteFriend(relation: UserRelationDto) {
  unblockUser(relation.idOtroUsuario)
  mutedUsers.value = blockedUserIds()
  noticeMessage.value = `${relation.nombreOtroUsuario} vuelve a estar activo.`
}

function relativeDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

watch(searchText, () => {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => void runUserSearch(), 260)
})

onMounted(() => {
  void loadRelations()
})

onBeforeUnmount(() => {
  if (searchTimer) window.clearTimeout(searchTimer)
})
</script>

<template>
  <section class="account-view friends-view">
    <header class="account-hero">
      <span>amigos</span>
      <h1>Contactos, invitaciones y silencios</h1>
      <p>Gestiona tu red de jugadores sin mezclar solicitudes, chats y bloqueos en el header.</p>
    </header>

    <section class="friend-stats" aria-label="Resumen de amigos">
      <article>
        <span>Agregados</span>
        <strong>{{ friends.length }}</strong>
      </article>
      <article>
        <span>Recibidas</span>
        <strong>{{ incomingRequests.length }}</strong>
      </article>
      <article>
        <span>Enviadas</span>
        <strong>{{ outgoingRequests.length }}</strong>
      </article>
      <article>
        <span>Silenciados</span>
        <strong>{{ mutedFriends.length }}</strong>
      </article>
    </section>

    <p v-if="errorMessage" class="account-alert error">{{ errorMessage }}</p>
    <p v-else-if="noticeMessage" class="account-alert ok">{{ noticeMessage }}</p>

    <section class="friends-shell">
      <main class="discovery-panel">
        <header class="panel-heading">
          <span>buscar jugadores</span>
          <strong>Descubrimiento</strong>
        </header>

        <form class="friend-search" @submit.prevent="addFriend()">
          <label>
            <span>Nombre o usuario</span>
            <input v-model="searchText" type="search" autocomplete="off" placeholder="Buscar en Iberia 2084" />
          </label>
          <label>
            <span>Invitar por usuario</span>
            <input v-model="manualUsername" type="text" autocomplete="off" placeholder="usuario exacto" />
          </label>
          <button type="submit" :disabled="Boolean(actionKey)">Enviar invitación</button>
        </form>

        <section class="search-results" aria-label="Resultados de búsqueda">
          <p v-if="searchLoading" class="empty-state">Buscando usuarios...</p>
          <p v-else-if="searchText.trim().length >= 2 && !searchResults.length" class="empty-state">No hay resultados con ese texto.</p>
          <article v-for="result in searchResults" :key="result.idUsuario" class="user-result">
            <img :src="avatarSrc(result.avatarKey)" alt="" />
            <span>
              <strong>{{ result.nombreUsuario }}</strong>
              <small>@{{ result.username }}</small>
            </span>
            <button
              type="button"
              :disabled="actionKey === `add:${result.idUsuario}`"
              @click="addFriend(result)"
            >
              Invitar
            </button>
          </article>
        </section>
      </main>

      <aside class="request-panel">
        <section>
          <header class="panel-heading compact">
            <span>recibidas</span>
            <strong>Solicitudes</strong>
          </header>
          <p v-if="!incomingRequests.length" class="empty-state">No hay invitaciones pendientes.</p>
          <article v-for="relation in incomingRequests" :key="relation.idRelacionUsuario" class="relation-row">
            <img :src="avatarSrc(relation.avatarKeyOtroUsuario)" alt="" />
            <span>
              <strong>{{ relation.nombreOtroUsuario }}</strong>
              <small>@{{ relation.usernameOtroUsuario }} · {{ relativeDate(relation.dateTime) }}</small>
            </span>
            <button type="button" :disabled="actionKey === String(relation.idRelacionUsuario)" @click="acceptRelation(relation)">
              Aceptar
            </button>
            <button
              type="button"
              class="ghost"
              :disabled="actionKey === String(relation.idRelacionUsuario)"
              @click="rejectRelation(relation)"
            >
              Rechazar
            </button>
          </article>
        </section>

        <section>
          <header class="panel-heading compact">
            <span>enviadas</span>
            <strong>Seguimiento</strong>
          </header>
          <p v-if="!outgoingRequests.length" class="empty-state">No hay invitaciones enviadas.</p>
          <article v-for="relation in outgoingRequests" :key="relation.idRelacionUsuario" class="relation-row compact-row">
            <img :src="avatarSrc(relation.avatarKeyOtroUsuario)" alt="" />
            <span>
              <strong>{{ relation.nombreOtroUsuario }}</strong>
              <small>Pendiente desde {{ relativeDate(relation.dateTime) }}</small>
            </span>
            <button
              type="button"
              class="ghost"
              :disabled="actionKey === String(relation.idRelacionUsuario)"
              @click="deleteRelation(relation)"
            >
              Cancelar
            </button>
          </article>
        </section>
      </aside>
    </section>

    <section class="roster-panel" aria-label="Lista de amigos">
      <header class="panel-heading">
        <span>agregados</span>
        <strong>Amigos activos</strong>
      </header>

      <p v-if="loading" class="empty-state">Cargando relaciones...</p>
      <p v-else-if="!friends.length" class="empty-state">Aún no tienes amigos agregados.</p>

      <div v-else class="friend-grid">
        <article v-for="relation in friends" :key="relation.idRelacionUsuario" class="friend-card" :class="{ muted: relation.muted }">
          <img :src="avatarSrc(relation.avatarKeyOtroUsuario)" alt="" />
          <header>
            <strong>{{ relation.nombreOtroUsuario }}</strong>
            <span>@{{ relation.usernameOtroUsuario }}</span>
          </header>
          <p>{{ relation.muted ? 'Silenciado: sin avisos ni mensajes destacados.' : 'Disponible para chat e invitaciones de partida.' }}</p>
          <footer>
            <RouterLink v-if="!relation.muted" :to="{ name: 'accountChat' }">Chat</RouterLink>
            <button v-if="relation.muted" type="button" @click="unmuteFriend(relation)">Reactivar</button>
            <button v-else type="button" class="ghost" @click="muteFriend(relation)">Silenciar</button>
            <button
              type="button"
              class="danger"
              :disabled="actionKey === String(relation.idRelacionUsuario)"
              @click="deleteRelation(relation)"
            >
              Eliminar
            </button>
          </footer>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.account-view {
  display: grid;
  gap: var(--compact-gap);
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
.friend-search span,
.friend-stats span {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.account-hero h1,
.account-hero p,
.friend-card p {
  margin: 0;
}

.account-hero h1 {
  font-size: clamp(1.55rem, 3vw, 2.35rem);
  line-height: 1.02;
}

.account-hero p,
.friend-card p {
  color: var(--color-muted);
  font-weight: 760;
}

.friend-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.friend-stats article {
  display: grid;
  gap: 0.18rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.72rem;
  background: var(--color-surface);
}

.friend-stats strong {
  font-size: 1.6rem;
  line-height: 1;
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

.account-alert.ok {
  border-color: #8fdcc9;
  color: #d6fff6;
  background: rgba(37, 108, 91, 0.2);
}

.friends-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.44fr);
  gap: var(--compact-gap);
  align-items: start;
}

.discovery-panel,
.request-panel,
.roster-panel {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.72rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent 36%),
    var(--color-surface);
}

.request-panel {
  gap: 1rem;
}

.request-panel section {
  display: grid;
  gap: 0.5rem;
}

.panel-heading {
  display: flex;
  gap: 0.5rem;
  align-items: end;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.52rem;
}

.panel-heading.compact {
  padding-bottom: 0.4rem;
}

.panel-heading strong {
  font-size: 0.95rem;
  font-weight: 950;
  text-transform: uppercase;
}

.friend-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.88fr) auto;
  gap: 0.58rem;
  align-items: end;
}

.friend-search label {
  display: grid;
  gap: 0.28rem;
}

.friend-search input {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(125, 190, 255, 0.22);
  border-radius: 7px;
  padding: 0.58rem 0.68rem;
  color: #eef8ff;
  background: rgba(1, 8, 16, 0.58);
}

.friend-search button,
.user-result button,
.relation-row button,
.friend-card button,
.friend-card a {
  display: grid;
  min-height: 40px;
  place-items: center;
  border: 1px solid rgba(155, 214, 255, 0.48);
  border-radius: 7px;
  padding: 0.48rem 0.72rem;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4b9de8);
  font-weight: 950;
  text-decoration: none;
}

.relation-row button.ghost,
.friend-card button.ghost,
.friend-card button.danger {
  color: #d9ebfb;
  border-color: rgba(125, 190, 255, 0.18);
  background: rgba(3, 10, 18, 0.28);
}

.friend-card button.danger {
  color: #ffb9b9;
}

.search-results {
  display: grid;
  gap: 0.44rem;
}

.user-result,
.relation-row {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  gap: 0.62rem;
  align-items: center;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.55rem;
  background: rgba(3, 10, 18, 0.24);
}

.relation-row {
  grid-template-columns: 46px minmax(0, 1fr) auto auto;
}

.relation-row.compact-row {
  grid-template-columns: 46px minmax(0, 1fr) auto;
}

.user-result img,
.relation-row img,
.friend-card img {
  display: block;
  object-fit: contain;
}

.user-result img,
.relation-row img {
  width: 46px;
  height: 46px;
}

.user-result span,
.relation-row span,
.friend-card header {
  display: grid;
  min-width: 0;
}

.user-result strong,
.user-result small,
.relation-row strong,
.relation-row small,
.friend-card strong,
.friend-card span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-result strong,
.relation-row strong,
.friend-card strong {
  color: var(--color-text);
  font-weight: 950;
}

.user-result small,
.relation-row small,
.friend-card span {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 780;
}

.friend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.62rem;
}

.friend-card {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 0.64rem;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.64rem;
  background: rgba(3, 10, 18, 0.24);
}

.friend-card.muted {
  opacity: 0.76;
}

.friend-card img {
  grid-row: 1 / span 3;
  width: 64px;
  height: 64px;
}

.friend-card p,
.friend-card footer {
  grid-column: 2;
}

.friend-card footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
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

@media (max-width: 980px) {
  .friends-shell,
  .friend-search {
    grid-template-columns: 1fr;
  }

  .friend-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .account-view {
    padding: var(--space-page) 0;
  }

  .account-hero,
  .friend-stats,
  .friends-shell,
  .roster-panel {
    margin-inline: var(--space-page);
  }

  .friend-stats {
    grid-template-columns: 1fr 1fr;
  }

  .relation-row,
  .relation-row.compact-row {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .relation-row button {
    grid-column: 2;
  }

  .friend-card {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .friend-card img {
    width: 54px;
    height: 54px;
  }
}
</style>
