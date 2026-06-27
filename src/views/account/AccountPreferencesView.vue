<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppDropdown from '@/components/ui/AppDropdown.vue'
import { notificationSounds } from '@/data/notificationSounds'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { avatars, DEFAULT_AVATAR, type AvatarOption } from '@/utils/userAvatars'

interface NotificationPreferences {
  volume: number
  soundKey: string
  constructionQueue: boolean
  troopQueue: boolean
  attacks: boolean
  crisis: boolean
  alliance: boolean
}

const PREFERENCES_KEY = 'iberia2084.notificationPreferences'

const defaultPreferences: NotificationPreferences = {
  volume: 70,
  soundKey: notificationSounds[0]?.key ?? '',
  constructionQueue: true,
  troopQueue: true,
  attacks: true,
  crisis: true,
  alliance: false,
}

const session = useSessionStore()
const selectedAvatarKey = ref(DEFAULT_AVATAR)
const savingAvatar = ref('')
const preferences = ref<NotificationPreferences>(loadPreferences())
const savingPreferences = ref(false)
const errorMessage = ref('')
const noticeMessage = ref('')

const selectedAvatar = computed(
  () => avatars.find((avatar) => avatar.key === selectedAvatarKey.value) ?? avatars[0] ?? null,
)
const selectedSound = computed(
  () => notificationSounds.find((sound) => sound.key === preferences.value.soundKey) ?? notificationSounds[0],
)
const soundOptions = computed(() =>
  notificationSounds.map((sound) => ({
    value: sound.key,
    label: sound.label,
    meta: 'Sonido de notificación',
    badge: sound.key === preferences.value.soundKey ? 'Activo' : undefined,
  })),
)

function loadPreferences(): NotificationPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? 'null') as Partial<NotificationPreferences> | null
    return { ...defaultPreferences, ...stored }
  } catch {
    return { ...defaultPreferences }
  }
}

function savePreferences() {
  savingPreferences.value = true
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences.value))
  window.setTimeout(() => {
    savingPreferences.value = false
    noticeMessage.value = 'Preferencias guardadas.'
  }, 180)
}

function tokenOrFail() {
  if (!session.token) throw new Error('Inicia sesión para guardar preferencias.')
  return session.token
}

function clearStatus() {
  errorMessage.value = ''
  noticeMessage.value = ''
}

async function loadUserSettings() {
  clearStatus()
  try {
    const settings = await api.userSettings(tokenOrFail())
    selectedAvatarKey.value = settings.avatarKey || DEFAULT_AVATAR
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo cargar tu avatar.'
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

function setSoundKey(value: string | number) {
  preferences.value.soundKey = String(value)
  savePreferences()
}

async function previewSound() {
  const sound = selectedSound.value
  if (!sound) return
  clearStatus()
  try {
    const audio = new Audio(sound.src)
    audio.volume = Math.max(0, Math.min(1, preferences.value.volume / 100))
    await audio.play()
  } catch {
    errorMessage.value = 'El navegador no ha permitido reproducir el sonido todavía.'
  }
}

onMounted(() => {
  void loadUserSettings()
})
</script>

<template>
  <section class="account-view preferences-view">
    <header class="account-hero">
      <span>preferencias</span>
      <h1>Cuenta y avisos</h1>
      <p>Ajusta tu avatar público y los avisos sonoros que quieres recibir durante la partida.</p>
    </header>

    <p v-if="errorMessage" class="account-alert error">{{ errorMessage }}</p>
    <p v-else-if="noticeMessage" class="account-alert ok">{{ noticeMessage }}</p>

    <section class="preferences-board">
      <article class="settings-card avatar-card">
        <header class="section-heading">
          <div>
            <span>avatar</span>
            <strong>Personaje visible</strong>
          </div>
          <small>{{ avatars.length }} disponibles</small>
        </header>

        <section class="avatar-current" aria-label="Avatar actual">
          <span class="avatar-portrait avatar-portrait--current">
            <img v-if="selectedAvatar" :src="selectedAvatar.src" :alt="selectedAvatar.label" />
          </span>
          <div>
            <strong>{{ selectedAvatar?.label ?? 'Avatar' }}</strong>
            <small>Se mostrará en chat, amigos y ajustes de usuario.</small>
          </div>
        </section>

        <section class="avatar-scroll" aria-label="Avatares disponibles">
          <button
            v-for="avatar in avatars"
            :key="avatar.key"
            type="button"
            class="avatar-choice"
            :class="{ active: avatar.key === selectedAvatarKey }"
            :disabled="savingAvatar === avatar.key"
            :title="avatar.label"
            @click="selectAvatar(avatar)"
          >
            <span class="avatar-portrait"><img :src="avatar.src" :alt="avatar.label" /></span>
            <span class="avatar-name">{{ avatar.label }}</span>
            <em v-if="avatar.key === selectedAvatarKey">Actual</em>
          </button>
        </section>
      </article>

      <article class="settings-card notification-card">
        <header class="section-heading">
          <div>
            <span>notificaciones</span>
            <strong>Sonido y eventos</strong>
          </div>
          <small>{{ selectedSound?.label ?? 'Sin sonido' }}</small>
        </header>

        <section class="sound-panel" aria-label="Sonido de notificación">
          <label class="sound-field">
            <span>Sonido</span>
            <AppDropdown
              :model-value="preferences.soundKey"
              :options="soundOptions"
              aria-label="Seleccionar sonido de notificación"
              placeholder="Elige sonido"
              @update:model-value="setSoundKey"
            />
          </label>

          <button type="button" class="preview-button" @click="previewSound">Probar</button>

          <label class="volume-control">
            <span>Volumen</span>
            <input
              v-model.number="preferences.volume"
              type="range"
              min="0"
              max="100"
              step="5"
              @change="savePreferences"
            />
            <strong>{{ preferences.volume }}%</strong>
          </label>
        </section>

        <section class="toggle-panel" aria-label="Tipos de aviso">
          <label>
            <input v-model="preferences.constructionQueue" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Cola de construcción</strong>
              <small>Mejoras de edificio terminadas.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.troopQueue" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Cola de tropas</strong>
              <small>Entrenamientos completados.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.attacks" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Ataques</strong>
              <small>Ofensivas y resultados militares.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.crisis" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Crisis y eventos</strong>
              <small>Aparición o vencimiento de crisis.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.alliance" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Alianza</strong>
              <small>Mensajes y movimientos aliados.</small>
            </span>
          </label>
        </section>

        <p class="save-state">{{ savingPreferences ? 'Guardando...' : 'Preferencias guardadas en este dispositivo.' }}</p>
      </article>
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

.account-hero,
.section-heading {
  border-bottom: 1px solid var(--color-border);
}

.account-hero {
  display: grid;
  gap: 0.22rem;
  padding-bottom: 0.68rem;
}

.account-hero span,
.section-heading span,
.sound-field > span,
.volume-control span {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.account-hero h1,
.account-hero p,
.save-state {
  margin: 0;
}

.account-hero h1 {
  font-size: clamp(1.35rem, 2.2vw, 1.95rem);
  line-height: 1.04;
}

.account-hero p,
.section-heading small,
.save-state {
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

.account-alert.ok {
  border-color: #8fdcc9;
  color: #d6fff6;
  background: rgba(37, 108, 91, 0.2);
}

.preferences-board {
  display: grid;
  grid-template-columns: minmax(300px, 0.82fr) minmax(380px, 1fr);
  gap: var(--compact-gap);
  align-items: start;
}

.settings-card {
  display: grid;
  gap: 0.72rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.78rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent 36%),
    var(--color-surface);
}

.section-heading {
  display: flex;
  gap: 0.7rem;
  align-items: end;
  justify-content: space-between;
  padding-bottom: 0.58rem;
}

.section-heading div {
  display: grid;
  gap: 0.18rem;
}

.section-heading strong {
  font-size: 0.95rem;
  font-weight: 950;
  text-transform: uppercase;
}

.section-heading small {
  font-size: 0.74rem;
  text-align: right;
}

.avatar-current {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  align-items: center;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.62rem;
  background: rgba(3, 10, 18, 0.24);
}

.avatar-current div {
  display: grid;
  min-width: 0;
  gap: 0.16rem;
}

.avatar-current strong,
.avatar-current small,
.avatar-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-current strong {
  font-weight: 950;
}

.avatar-current small {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 780;
}

.avatar-scroll {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 0.46rem;
  max-height: 264px;
  overflow-y: auto;
  padding: 0.12rem 0.24rem 0.12rem 0;
}

.avatar-scroll::-webkit-scrollbar {
  width: 9px;
}

.avatar-scroll::-webkit-scrollbar-thumb {
  border: 2px solid var(--color-surface);
  border-radius: 8px;
  background: var(--color-border-strong);
}

.avatar-choice {
  position: relative;
  display: grid;
  gap: 0.38rem;
  min-height: 112px;
  justify-items: center;
  align-content: center;
  border: 1px solid rgba(125, 190, 255, 0.13);
  border-radius: 8px;
  padding: 0.48rem 0.42rem;
  color: #c8d9e8;
  background: rgba(3, 10, 18, 0.2);
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

.avatar-choice em {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  border-radius: 5px;
  padding: 0.12rem 0.28rem;
  color: var(--color-on-accent);
  background: var(--color-accent);
  font-size: 0.58rem;
  font-style: normal;
  font-weight: 950;
  text-transform: uppercase;
}

.avatar-choice:disabled {
  cursor: progress;
  opacity: 0.72;
}

.avatar-portrait {
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  overflow: hidden;
  clip-path: polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%);
  background:
    linear-gradient(135deg, rgba(224, 240, 255, 0.96), rgba(82, 156, 224, 0.74) 42%, rgba(17, 43, 70, 0.98) 70%),
    #5aa7e8;
}

.avatar-portrait--current {
  width: 72px;
  height: 72px;
}

.avatar-portrait img {
  display: block;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  object-fit: contain;
  clip-path: inherit;
  background: #071321;
}

.avatar-name {
  width: 100%;
  font-size: 0.68rem;
  font-weight: 900;
  text-align: center;
}

.sound-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.62rem;
  align-items: end;
}

.sound-field,
.volume-control {
  display: grid;
  gap: 0.34rem;
  min-width: 0;
}

.sound-field {
  grid-column: 1;
}

.sound-field :deep(.dropdown-trigger) {
  min-height: 44px;
}

.preview-button {
  min-height: 44px;
  border: 1px solid rgba(155, 214, 255, 0.48);
  border-radius: 7px;
  padding: 0.5rem 0.92rem;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4b9de8);
  font-weight: 950;
}

.preview-button:hover {
  filter: brightness(1.04);
}

.volume-control {
  grid-column: 1 / -1;
  grid-template-columns: auto minmax(0, 1fr) 56px;
  align-items: center;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.62rem;
  background: rgba(3, 10, 18, 0.24);
}

.volume-control input {
  width: 100%;
}

.volume-control strong {
  color: var(--color-text);
  font-size: 0.98rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
  text-align: right;
}

.toggle-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.54rem;
  min-width: 0;
}

.toggle-panel label {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 0.58rem;
  align-items: start;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.62rem;
  background: rgba(3, 10, 18, 0.24);
}

.toggle-panel input {
  width: 18px;
  height: 18px;
  accent-color: #7dc7ff;
}

.toggle-panel span {
  display: grid;
  min-width: 0;
  gap: 0.1rem;
}

.toggle-panel strong,
.toggle-panel small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-panel strong {
  font-weight: 950;
}

.toggle-panel small {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 780;
}

@media (max-width: 980px) {
  .preferences-board {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .account-view {
    padding: var(--space-page) 0;
  }

  .account-hero,
  .preferences-board {
    margin-inline: var(--space-page);
  }

  .section-heading {
    display: grid;
  }

  .section-heading small {
    text-align: left;
  }

  .avatar-scroll {
    grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
    max-height: 232px;
  }

  .avatar-choice {
    min-height: 104px;
  }

  .avatar-portrait {
    width: 56px;
    height: 56px;
  }

  .avatar-portrait--current {
    width: 66px;
    height: 66px;
  }

  .sound-panel,
  .volume-control,
  .toggle-panel {
    grid-template-columns: 1fr;
  }

  .sound-field {
    grid-column: auto;
  }

  .toggle-panel strong,
  .toggle-panel small,
  .avatar-current small {
    white-space: normal;
  }
}
</style>
