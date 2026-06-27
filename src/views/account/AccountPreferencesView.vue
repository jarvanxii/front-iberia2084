<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { notificationSounds } from '@/data/notificationSounds'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import type { NotificationSoundOption } from '@/data/notificationSounds'
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

const selectedSound = computed(
  () => notificationSounds.find((sound) => sound.key === preferences.value.soundKey) ?? notificationSounds[0],
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

function setSound(sound: NotificationSoundOption) {
  preferences.value.soundKey = sound.key
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
      <h1>Avatar y notificaciones</h1>
      <p>Configura cómo se verá tu cuenta y qué avisos sonarán durante la partida.</p>
    </header>

    <p v-if="errorMessage" class="account-alert error">{{ errorMessage }}</p>
    <p v-else-if="noticeMessage" class="account-alert ok">{{ noticeMessage }}</p>

    <section class="avatar-section">
      <header class="section-heading">
        <span>avatar</span>
        <strong>Escoge personaje</strong>
      </header>

      <div class="avatar-grid">
        <button
          v-for="avatar in avatars"
          :key="avatar.key"
          type="button"
          class="avatar-choice"
          :class="{ active: avatar.key === selectedAvatarKey }"
          :disabled="savingAvatar === avatar.key"
          @click="selectAvatar(avatar)"
        >
          <span class="avatar-portrait"><img :src="avatar.src" :alt="avatar.label" /></span>
          <span>{{ avatar.label }}</span>
        </button>
      </div>
    </section>

    <section class="notification-section">
      <header class="section-heading">
        <span>notificaciones</span>
        <strong>Sonido y avisos</strong>
      </header>

      <div class="notification-layout">
        <section class="sound-panel">
          <label class="volume-control">
            <span>Volumen</span>
            <input v-model.number="preferences.volume" type="range" min="0" max="100" step="5" @change="savePreferences" />
            <strong>{{ preferences.volume }}%</strong>
          </label>

          <div class="sound-list" role="list" aria-label="Sonidos de notificación">
            <button
              v-for="sound in notificationSounds"
              :key="sound.key"
              type="button"
              class="sound-option"
              :class="{ active: preferences.soundKey === sound.key }"
              @click="setSound(sound)"
            >
              <span>{{ sound.label }}</span>
              <em>{{ preferences.soundKey === sound.key ? 'Seleccionado' : 'Disponible' }}</em>
            </button>
          </div>

          <button type="button" class="preview-button" @click="previewSound">Probar sonido</button>
        </section>

        <section class="toggle-panel">
          <label>
            <input v-model="preferences.constructionQueue" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Cola de construcción</strong>
              <small>Cuando termine una mejora de edificio.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.troopQueue" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Cola de tropas</strong>
              <small>Cuando acabe el entrenamiento de unidades.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.attacks" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Ataques</strong>
              <small>Cuando haya ofensivas o resultados militares.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.crisis" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Crisis y eventos</strong>
              <small>Cuando aparezca una crisis o venza su cuenta atrás.</small>
            </span>
          </label>
          <label>
            <input v-model="preferences.alliance" type="checkbox" @change="savePreferences" />
            <span>
              <strong>Alianza</strong>
              <small>Cuando haya mensajes o movimientos de aliados.</small>
            </span>
          </label>
        </section>
      </div>

      <p class="save-state">{{ savingPreferences ? 'Guardando...' : 'Preferencias guardadas en este dispositivo.' }}</p>
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
  display: grid;
  gap: 0.22rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.72rem;
}

.account-hero span,
.section-heading span,
.volume-control span,
.sound-option em {
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
  font-size: clamp(1.55rem, 3vw, 2.35rem);
  line-height: 1.02;
}

.account-hero p,
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

.avatar-section,
.notification-section {
  display: grid;
  gap: 0.78rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.78rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent 36%),
    var(--color-surface);
}

.section-heading strong {
  font-size: 1rem;
  font-weight: 950;
  text-transform: uppercase;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 0.58rem;
}

.avatar-choice {
  display: grid;
  gap: 0.5rem;
  min-height: 150px;
  justify-items: center;
  align-content: center;
  border: 1px solid rgba(125, 190, 255, 0.15);
  border-radius: 8px;
  padding: 0.68rem;
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

.avatar-portrait {
  display: grid;
  width: 82px;
  height: 82px;
  place-items: center;
  overflow: hidden;
  clip-path: polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%);
  background:
    linear-gradient(135deg, rgba(224, 240, 255, 0.96), rgba(82, 156, 224, 0.74) 42%, rgba(17, 43, 70, 0.98) 70%),
    #5aa7e8;
}

.avatar-portrait img {
  display: block;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  object-fit: contain;
  clip-path: inherit;
  background: #071321;
}

.avatar-choice > span:last-child {
  width: 100%;
  overflow: hidden;
  font-size: 0.74rem;
  font-weight: 900;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.4fr) minmax(0, 1fr);
  gap: var(--compact-gap);
  align-items: start;
}

.sound-panel,
.toggle-panel {
  display: grid;
  gap: 0.62rem;
  min-width: 0;
}

.volume-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.4rem 0.8rem;
  align-items: center;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.72rem;
  background: rgba(3, 10, 18, 0.24);
}

.volume-control span,
.volume-control input {
  grid-column: 1;
}

.volume-control strong {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 1.15rem;
}

.volume-control input {
  width: 100%;
}

.sound-list {
  display: grid;
  gap: 0.4rem;
}

.sound-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: center;
  min-height: 42px;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.55rem 0.62rem;
  color: var(--color-text);
  background: rgba(3, 10, 18, 0.24);
  text-align: left;
}

.sound-option.active,
.sound-option:hover {
  border-color: rgba(155, 214, 255, 0.56);
  background: rgba(90, 167, 232, 0.12);
}

.sound-option span {
  overflow: hidden;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-button {
  min-height: 42px;
  border: 1px solid rgba(155, 214, 255, 0.48);
  border-radius: 7px;
  padding: 0.5rem 0.92rem;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4b9de8);
  font-weight: 950;
}

.toggle-panel label {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 0.62rem;
  align-items: start;
  border: 1px solid rgba(125, 190, 255, 0.14);
  border-radius: 8px;
  padding: 0.68rem;
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

@media (max-width: 860px) {
  .notification-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .account-view {
    padding: var(--space-page) 0;
  }

  .account-hero,
  .avatar-section,
  .notification-section {
    margin-inline: var(--space-page);
  }

  .avatar-grid {
    grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  }

  .avatar-choice {
    min-height: 126px;
  }

  .avatar-portrait {
    width: 66px;
    height: 66px;
  }

  .sound-option,
  .volume-control {
    grid-template-columns: 1fr;
  }

  .volume-control strong {
    grid-column: 1;
    grid-row: auto;
  }

  .toggle-panel strong,
  .toggle-panel small {
    white-space: normal;
  }
}
</style>
