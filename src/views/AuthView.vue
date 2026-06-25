<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import authArt from '@/assets/iberia-key-art.png'
import { useSessionStore } from '@/stores/session'
import type { AuthProviderDto } from '@/types/game'

type AuthMode = 'login' | 'signup' | 'recovery'
type SignupStep = 'request' | 'confirm'
type RecoveryStep = 'request' | 'reset'

const COOKIE_NOTICE_KEY = 'iberia2084.cookieConsent.v1'
const EXTERNAL_OAUTH_ENABLED = false

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const cookieModalPrimary = ref<HTMLButtonElement | null>(null)

const authMode = ref<AuthMode>('login')
const signupStep = ref<SignupStep>('request')
const recoveryStep = ref<RecoveryStep>('request')
const showPassword = ref(false)
const formError = ref<string | null>(null)
const feedbackMessage = ref<string | null>(null)
const showCookieNotice = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const signupForm = reactive({
  username: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  code: '',
})

const recoveryForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  resetId: '',
  token: '',
})

const providerFallbacks: AuthProviderDto[] = [
  { id: 'google', label: 'Google', description: 'Cuenta Google o Google Workspace', configured: false },
]

const socialProviders = computed(() =>
  providerFallbacks.map((fallback) => {
    const remote = session.authProviders.find((provider) => provider.id === fallback.id)
    return {
      ...fallback,
      ...remote,
      configured: EXTERNAL_OAUTH_ENABLED && remote?.configured === true,
      disabledReason: `${fallback.label} estará disponible cuando activemos OAuth`,
    }
  }),
)

const pageTitle = computed(() => {
  if (authMode.value === 'signup') return signupStep.value === 'confirm' ? 'Confirma tu cuenta' : 'Crear cuenta'
  if (authMode.value === 'recovery') return recoveryStep.value === 'reset' ? 'Nueva contraseña' : 'Recuperar acceso'
  return 'Inicio de sesión'
})

onMounted(async () => {
  applyRecoveryQuery()
  await session.loadAuthProviders().catch(() => undefined)
  loadCookieNoticeConsent()
})

watch(
  () => route.query,
  () => applyRecoveryQuery(),
)

function setAuthMode(nextMode: AuthMode) {
  authMode.value = nextMode
  formError.value = null
  feedbackMessage.value = null
  if (nextMode !== 'signup') signupStep.value = 'request'
  if (nextMode === 'recovery' && !hasRecoveryQuery()) recoveryStep.value = 'request'
}

function loadCookieNoticeConsent() {
  try {
    showCookieNotice.value = window.localStorage.getItem(COOKIE_NOTICE_KEY) !== 'accepted'
  } catch {
    showCookieNotice.value = true
  }

  focusCookieNotice()
}

function focusCookieNotice() {
  if (!showCookieNotice.value) return
  nextTick(() => cookieModalPrimary.value?.focus())
}

function acceptCookieNotice() {
  showCookieNotice.value = false
  try {
    window.localStorage.setItem(COOKIE_NOTICE_KEY, 'accepted')
  } catch {
    // El aviso se cerrará para esta sesión aunque el navegador bloquee localStorage.
  }
}

function applyRecoveryQuery() {
  const resetId = queryString('resetId') || queryString('reset_id')
  const token = queryString('token')
  const email = queryString('email')
  if (!resetId || !token || !email) return

  authMode.value = 'recovery'
  recoveryStep.value = 'reset'
  recoveryForm.resetId = resetId
  recoveryForm.token = token
  recoveryForm.email = email
  feedbackMessage.value = 'Enlace de recuperación detectado.'
}

function hasRecoveryQuery() {
  return Boolean((queryString('resetId') || queryString('reset_id')) && queryString('token') && queryString('email'))
}

function queryString(key: string) {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

function passwordIsValid(value: string) {
  return value.length >= 8 && /[\d\W_]/.test(value)
}

function providerTitle(provider: AuthProviderDto & { disabledReason?: string }) {
  return provider.configured ? provider.description : provider.disabledReason || `${provider.label} pendiente de configuración OAuth`
}

function startSocialLogin(provider: AuthProviderDto & { disabledReason?: string }) {
  if (!provider.configured) {
    feedbackMessage.value = 'El acceso con Google está pendiente de activar.'
  }
}

function validateSignupRequest() {
  if (signupForm.username.trim().length < 3) {
    formError.value = 'El usuario necesita al menos 3 caracteres.'
    return false
  }
  if (!signupForm.email.trim()) {
    formError.value = 'Introduce un correo electrónico.'
    return false
  }
  if (!passwordIsValid(signupForm.password)) {
    formError.value = 'La contraseña debe tener al menos 8 caracteres e incluir un número o un símbolo.'
    return false
  }
  if (signupForm.password !== signupForm.confirmPassword) {
    formError.value = 'Las contraseñas no coinciden.'
    return false
  }
  return true
}

function validateRecoveryPassword() {
  if (!passwordIsValid(recoveryForm.password)) {
    formError.value = 'La contraseña debe tener al menos 8 caracteres e incluir un número o un símbolo.'
    return false
  }
  if (recoveryForm.password !== recoveryForm.confirmPassword) {
    formError.value = 'Las contraseñas no coinciden.'
    return false
  }
  return true
}

async function submitLogin() {
  formError.value = null
  feedbackMessage.value = null
  try {
    await session.login(loginForm.username, loginForm.password)
    await goToGame()
  } catch (unknownError) {
    formError.value = unknownError instanceof Error ? unknownError.message : 'No se pudo iniciar sesión.'
  }
}

async function submitSignup() {
  formError.value = null
  feedbackMessage.value = null
  try {
    if (signupStep.value === 'request') {
      if (!validateSignupRequest()) return
      const response = await session.requestSignup({
        username: signupForm.username.trim(),
        displayName: signupForm.displayName.trim() || signupForm.username.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
      })
      signupStep.value = 'confirm'
      feedbackMessage.value = response.message || 'Código enviado por email.'
      return
    }

    if (!/^\d{6}$/.test(signupForm.code.trim())) {
      formError.value = 'Introduce el código de 6 dígitos.'
      return
    }
    await session.confirmSignup(signupForm.email.trim(), signupForm.code.trim())
    await goToGame()
  } catch (unknownError) {
    formError.value = unknownError instanceof Error ? unknownError.message : 'No se pudo completar el registro.'
  }
}

async function submitRecovery() {
  formError.value = null
  feedbackMessage.value = null
  try {
    if (recoveryStep.value === 'request') {
      if (!recoveryForm.email.trim()) {
        formError.value = 'Introduce el correo de tu cuenta.'
        return
      }
      const response = await session.requestPasswordRecovery(recoveryForm.email.trim())
      feedbackMessage.value = response.message || 'Te hemos enviado un enlace de recuperación.'
      return
    }

    if (!recoveryForm.resetId || !recoveryForm.token || !recoveryForm.email) {
      formError.value = 'El enlace de recuperación no está completo.'
      return
    }
    if (!validateRecoveryPassword()) return
    await session.confirmPasswordRecovery({
      resetId: recoveryForm.resetId,
      email: recoveryForm.email.trim(),
      token: recoveryForm.token,
      password: recoveryForm.password,
    })
    await goToGame()
  } catch (unknownError) {
    formError.value = unknownError instanceof Error ? unknownError.message : 'No se pudo recuperar el acceso.'
  }
}

async function goToGame() {
  const query = invitationQuery()
  await router.push({ name: query ? 'homeGames' : 'home', query })
}

function invitationQuery() {
  const mundo = typeof route.query.mundo === 'string' ? route.query.mundo : ''
  const provincia = typeof route.query.provincia === 'string' ? route.query.provincia : ''
  return mundo || provincia ? { mundo, provincia } : undefined
}
</script>

<template>
  <main class="login-page">
    <section class="login-layout">
      <section class="login-visual" aria-label="Mapa estratégico de Iberia 2084">
        <img class="login-banner" :src="authArt" alt="Mapa estratégico de Iberia 2084" />
      </section>

      <section class="login-card" aria-labelledby="login-title">
        <header class="login-card-header">
          <span class="section-kicker">Acceso</span>
          <h1 id="login-title">{{ pageTitle }}</h1>
        </header>

        <section class="auth-mode-switch" aria-label="Tipo de acceso">
          <button type="button" :class="{ 'is-active': authMode === 'login' }" @click="setAuthMode('login')">
            Acceso
          </button>
          <button type="button" :class="{ 'is-active': authMode === 'signup' }" @click="setAuthMode('signup')">
            Registro
          </button>
          <button type="button" :class="{ 'is-active': authMode === 'recovery' }" @click="setAuthMode('recovery')">
            Recuperar
          </button>
        </section>

        <section v-if="authMode === 'login'" class="social-login-panel" aria-label="Acceso con proveedores externos">
          <button
            v-for="provider in socialProviders"
            :key="provider.id"
            class="social-login-button is-unavailable"
            type="button"
            :disabled="!provider.configured"
            :aria-label="`Continuar con ${provider.label}`"
            :title="providerTitle(provider)"
            @click="startSocialLogin(provider)"
          >
            <span class="google-mark" aria-hidden="true">G</span>
            <span>{{ provider.label }}</span>
          </button>
        </section>

        <div v-if="authMode === 'login'" class="login-divider" aria-hidden="true">
          <span>o usa credenciales</span>
        </div>

        <form v-if="authMode === 'login'" class="login-form" @submit.prevent="submitLogin">
          <label class="login-field" for="login-username">
            <span>Usuario o correo</span>
            <input
              id="login-username"
              v-model.trim="loginForm.username"
              autocomplete="username"
              placeholder="gandalf o correo@dominio.es"
              required
            />
          </label>

          <label class="login-field" for="login-password">
            <span>Contraseña</span>
            <div class="password-control">
              <input
                id="login-password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Introduce tu contraseña"
                required
              />
              <button
                type="button"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              </button>
            </div>
          </label>

          <button class="login-submit" type="submit" :disabled="session.loading">
            <span>Iniciar sesión</span>
          </button>

          <button class="recover-link as-button" type="button" @click="setAuthMode('recovery')">
            Recuperar acceso
          </button>
        </form>

        <form v-else-if="authMode === 'signup'" class="login-form" @submit.prevent="submitSignup">
          <template v-if="signupStep === 'request'">
            <label class="login-field" for="signup-username">
              <span>Usuario</span>
              <input id="signup-username" v-model.trim="signupForm.username" autocomplete="username" placeholder="usuario" required />
            </label>

            <label class="login-field" for="signup-display-name">
              <span>Nombre visible</span>
              <input id="signup-display-name" v-model.trim="signupForm.displayName" autocomplete="name" placeholder="Nombre público" />
            </label>

            <label class="login-field" for="signup-email">
              <span>Email</span>
              <input id="signup-email" v-model.trim="signupForm.email" autocomplete="email" inputmode="email" placeholder="tu@email.com" required type="email" />
            </label>

            <label class="login-field" for="signup-password">
              <span>Contraseña</span>
              <div class="password-control">
                <input
                  id="signup-password"
                  v-model="signupForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                </button>
              </div>
            </label>

            <label class="login-field" for="signup-confirm-password">
              <span>Repetir contraseña</span>
              <div class="password-control">
                <input
                  id="signup-confirm-password"
                  v-model="signupForm.confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Vuelve a introducirla"
                  required
                />
                <button
                  type="button"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                </button>
              </div>
            </label>
          </template>

          <template v-else>
            <label class="login-field" for="signup-code">
              <span>Código</span>
              <input
                id="signup-code"
                v-model.trim="signupForm.code"
                autocomplete="one-time-code"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                required
                type="text"
              />
            </label>

            <button class="recover-link as-button" type="button" @click="signupStep = 'request'">
              Cambiar email
            </button>
          </template>

          <button class="login-submit" type="submit" :disabled="session.loading">
            <span>{{ signupStep === 'request' ? 'Enviar código' : 'Confirmar cuenta' }}</span>
          </button>
        </form>

        <form v-else class="login-form" @submit.prevent="submitRecovery">
          <template v-if="recoveryStep === 'request'">
            <label class="login-field" for="recovery-email">
              <span>Email</span>
              <input id="recovery-email" v-model.trim="recoveryForm.email" autocomplete="email" inputmode="email" placeholder="tu@email.com" required type="email" />
            </label>

            <button class="login-submit" type="submit" :disabled="session.loading">
              <span>Enviar enlace</span>
            </button>

            <button class="recover-link as-button" type="button" @click="setAuthMode('login')">
              Volver al acceso
            </button>
          </template>

          <template v-else>
            <label class="login-field" for="recovery-password">
              <span>Nueva contraseña</span>
              <div class="password-control">
                <input
                  id="recovery-password"
                  v-model="recoveryForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                </button>
              </div>
            </label>

            <label class="login-field" for="recovery-confirm-password">
              <span>Repetir contraseña</span>
              <div class="password-control">
                <input
                  id="recovery-confirm-password"
                  v-model="recoveryForm.confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Vuelve a introducirla"
                  required
                />
                <button
                  type="button"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                </button>
              </div>
            </label>

            <button class="login-submit" type="submit" :disabled="session.loading">
              <span>Guardar contraseña</span>
            </button>
          </template>
        </form>

        <p v-if="formError || session.error" class="login-feedback is-error" role="alert">
          {{ formError || session.error }}
        </p>
        <p v-if="feedbackMessage" class="login-feedback" role="status">{{ feedbackMessage }}</p>

        <footer class="login-legal-links" aria-label="Información legal">
          <RouterLink :to="{ name: 'privacy' }">Privacidad</RouterLink>
          <span aria-hidden="true">/</span>
          <RouterLink :to="{ name: 'terms' }">Términos y condiciones</RouterLink>
          <span aria-hidden="true">/</span>
          <RouterLink :to="{ name: 'contact' }">Contacto</RouterLink>
        </footer>
      </section>
    </section>

    <section
      v-if="showCookieNotice"
      class="cookie-modal-backdrop"
      aria-labelledby="cookie-modal-title"
      aria-modal="true"
      role="dialog"
    >
      <article class="cookie-modal">
        <header class="cookie-modal-header">
          <span class="section-kicker">Privacidad y cookies</span>
          <small>Uso técnico</small>
        </header>

        <div class="cookie-modal-body">
          <h2 id="cookie-modal-title">Cookies en Iberia 2084</h2>
          <p>
            Usamos cookies técnicas para mantener la sesión, proteger el acceso y recordar esta
            aceptación en este navegador. No usamos cookies publicitarias.
          </p>
        </div>

        <footer class="cookie-modal-actions">
          <RouterLink :to="{ name: 'privacy' }">Consultar privacidad</RouterLink>
          <button ref="cookieModalPrimary" class="cookie-modal-primary" type="button" @click="acceptCookieNotice">
            Aceptar y continuar
          </button>
        </footer>
      </article>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  overflow: hidden;
  height: 100vh;
  height: 100svh;
  min-height: 100vh;
  min-height: 100svh;
  color: var(--color-text);
  background:
    linear-gradient(180deg, rgba(210, 173, 84, 0.05), rgba(12, 17, 16, 0.48)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    var(--color-bg);
  background-size: auto, 48px 48px, auto;
}

.login-page,
.login-page * {
  box-sizing: border-box;
  letter-spacing: 0;
}

.login-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(440px, 500px);
  width: 100%;
  height: 100vh;
  height: 100svh;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
}

.login-visual {
  position: relative;
  display: grid;
  min-width: 0;
  height: 100%;
  min-height: 100vh;
  min-height: 100svh;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(210, 173, 84, 0.16), transparent 34rem),
    linear-gradient(90deg, rgba(105, 182, 159, 0.1) 1px, transparent 1px),
    linear-gradient(180deg, rgba(210, 173, 84, 0.08) 1px, transparent 1px),
    #070907;
  background-size: auto, 88px 88px, 88px 88px, auto;
}

.login-visual::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(7, 9, 7, 0.18), transparent 34%, rgba(7, 9, 7, 0.58)),
    linear-gradient(180deg, rgba(7, 9, 7, 0.18), transparent 45%, rgba(7, 9, 7, 0.58));
  content: '';
  pointer-events: none;
}

.login-banner {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border: 0;
  border-radius: 0;
  object-fit: contain;
  object-position: center;
  filter: saturate(1.08) contrast(1.08) brightness(0.94);
}

.login-card,
.login-card-header,
.login-form {
  display: grid;
}

.login-card {
  position: relative;
  align-content: center;
  justify-items: center;
  width: 100%;
  height: 100%;
  gap: 14px;
  min-height: 100vh;
  min-height: 100svh;
  overflow-x: hidden;
  overflow-y: auto;
  padding: clamp(24px, 3.5vw, 44px);
  padding-left: clamp(32px, 4vw, 70px);
  padding-right: clamp(24px, 3vw, 52px);
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
  background:
    radial-gradient(circle at 90% 12%, rgba(229, 198, 109, 0.13), transparent 13rem),
    linear-gradient(90deg, rgba(210, 173, 84, 0.055) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.055), transparent 8rem),
    color-mix(in srgb, var(--color-surface) 92%, black);
  background-size: auto, 44px 44px, auto, auto;
  box-shadow:
    -20px 0 54px rgba(5, 9, 8, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.login-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: linear-gradient(180deg, transparent, var(--color-accent) 32%, var(--color-accent-strong) 50%, var(--color-accent) 68%, transparent);
  content: '';
}

.login-card-header,
.auth-mode-switch,
.social-login-panel,
.login-divider,
.login-form,
.login-legal-links {
  width: min(100%, 380px);
}

.login-card-header {
  gap: 7px;
  text-align: center;
}

.section-kicker {
  justify-self: center;
  color: var(--color-accent-strong);
  font-size: 0.76rem;
  font-weight: 850;
  text-transform: uppercase;
}

.login-card-header h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.85rem, 2.7vw, 2.25rem);
  font-weight: 850;
  line-height: 1;
}

.auth-mode-switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, var(--color-accent));
  border-radius: 4px;
  background: rgba(8, 12, 10, 0.64);
}

.auth-mode-switch button {
  min-height: 34px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 900;
}

.auth-mode-switch button.is-active {
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
  color: var(--color-on-accent);
}

.social-login-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.social-login-button,
.login-submit {
  min-height: 42px;
  border-radius: 4px;
  font-weight: 900;
}

.social-login-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  background: rgba(148, 163, 184, 0.2);
  color: #9ca8b7;
  box-shadow: none;
  cursor: not-allowed;
}

.google-mark {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  color: #4285f4;
  background: #fff;
  font-size: 0.82rem;
  font-weight: 950;
}

.login-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  color: var(--color-subtle);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
}

.login-divider::before,
.login-divider::after {
  height: 1px;
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
  content: '';
}

.login-form {
  gap: 10px;
}

.login-field {
  position: relative;
  display: grid;
  gap: 7px;
}

.login-field span {
  color: #dce3eb;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
}

.login-field input {
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--color-border) 74%, var(--color-accent));
  border-radius: 4px;
  background: rgba(8, 12, 10, 0.78);
  color: var(--color-text);
  outline: none;
}

.login-field input::placeholder {
  color: #72859a;
}

.login-field input:focus {
  border-color: color-mix(in srgb, var(--color-accent) 78%, white);
  box-shadow: 0 0 0 3px rgba(210, 173, 84, 0.15);
}

.password-control {
  position: relative;
}

.password-control input {
  padding-right: 52px;
}

.password-control button {
  position: absolute;
  top: 50%;
  right: 8px;
  display: grid;
  width: 34px;
  height: 32px;
  place-items: center;
  border: 1px solid rgba(176, 184, 194, 0.22);
  border-radius: 4px;
  background: var(--color-surface-soft);
  color: #cfd6de;
  transform: translateY(-50%);
}

.password-control svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.login-submit {
  border: 1px solid color-mix(in srgb, var(--color-accent) 78%, white);
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
  color: var(--color-on-accent);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.24);
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.login-submit:disabled {
  cursor: progress;
  opacity: 0.72;
}

.login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.recover-link {
  width: fit-content;
  justify-self: center;
  color: var(--color-accent-strong);
  font-size: 0.82rem;
  font-weight: 850;
  text-decoration: none;
}

.recover-link:hover {
  color: #f7d98a;
}

.recover-link.as-button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.login-feedback {
  width: min(100%, 380px);
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgba(105, 182, 159, 0.28);
  border-left: 3px solid var(--color-success);
  border-radius: 4px;
  background: rgba(105, 182, 159, 0.1);
  color: #bff1df;
  font-size: 0.82rem;
  font-weight: 780;
  line-height: 1.35;
}

.login-feedback.is-error {
  border-color: rgba(201, 111, 95, 0.28);
  border-left-color: var(--color-danger);
  background: rgba(201, 111, 95, 0.12);
  color: #ffd1c9;
}

.login-legal-links {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #72859a;
  font-size: 0.78rem;
  font-weight: 760;
}

.login-legal-links a {
  color: #aab7c7;
  text-decoration: none;
}

.login-legal-links a:hover {
  color: var(--color-accent-strong);
}

.cookie-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(120deg, rgba(210, 173, 84, 0.08), transparent 34%),
    rgba(3, 6, 10, 0.74);
  backdrop-filter: blur(10px);
}

.cookie-modal {
  display: grid;
  width: min(100%, 520px);
  overflow: hidden;
  border: 1px solid rgba(176, 184, 194, 0.24);
  border-radius: 6px;
  background:
    linear-gradient(145deg, rgba(210, 173, 84, 0.035), transparent 46%),
    var(--color-surface);
  box-shadow:
    0 18px 48px rgba(5, 9, 8, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.cookie-modal-header,
.cookie-modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cookie-modal-header {
  padding: 20px 22px 0;
}

.cookie-modal-header small {
  padding: 4px 8px;
  border: 1px solid rgba(176, 184, 194, 0.18);
  border-radius: 999px;
  color: #9fb0c3;
  font-size: 0.68rem;
  font-weight: 820;
  white-space: nowrap;
}

.cookie-modal-body {
  display: grid;
  gap: 14px;
  padding: 18px 22px 20px;
}

.cookie-modal-body h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.35rem, 2.4vw, 1.72rem);
  font-weight: 900;
  line-height: 1.14;
}

.cookie-modal-body > p {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.93rem;
  line-height: 1.58;
}

.cookie-modal-actions {
  justify-content: flex-end;
  padding: 16px 22px 20px;
  border-top: 1px solid rgba(176, 184, 194, 0.16);
  background: rgba(3, 6, 10, 0.2);
}

.cookie-modal-actions a {
  color: #aab7c7;
  font-size: 0.8rem;
  font-weight: 780;
  text-decoration: none;
}

.cookie-modal-actions a:hover {
  color: var(--color-accent-strong);
}

.cookie-modal-primary {
  min-height: 42px;
  min-width: 158px;
  padding: 0 20px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 78%, white);
  border-radius: 4px;
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
  color: var(--color-on-accent);
  font-weight: 900;
}

@media (max-width: 980px) {
  .login-page {
    --login-mobile-visual-height: min(300px, calc(100vw * 0.5628));
  }

  .login-layout {
    position: relative;
    display: block;
    min-height: 100vh;
    min-height: 100svh;
    padding-top: var(--login-mobile-visual-height);
  }

  .login-visual {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 0;
    height: var(--login-mobile-visual-height);
    min-height: 0;
    background: #050706;
  }

  .login-banner {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: top center;
  }

  .login-card {
    position: relative;
    z-index: 1;
    height: calc(100svh - var(--login-mobile-visual-height));
    min-height: calc(100svh - var(--login-mobile-visual-height));
    justify-items: center;
    gap: 11px;
    padding: clamp(18px, 3.2vw, 28px);
    overflow-x: hidden;
    overflow-y: auto;
    border-top: 1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
    border-left: 0;
    box-shadow: 0 -16px 42px rgba(5, 9, 8, 0.3);
  }

  .login-card::before {
    inset: 0 0 auto;
    width: auto;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--color-accent) 32%, var(--color-accent-strong) 50%, var(--color-accent) 68%, transparent);
  }
}

@media (max-width: 620px) {
  .login-page {
    --login-mobile-visual-height: min(288px, calc(100vw * 0.5628));
  }

  .login-card {
    gap: 9px;
    padding: 16px 18px 18px;
  }

  .cookie-modal-backdrop {
    padding: 14px;
  }

  .cookie-modal-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    padding: 18px 18px 0;
  }

  .cookie-modal-body {
    padding: 16px 18px;
  }

  .cookie-modal-actions {
    align-items: stretch;
    flex-direction: column-reverse;
    gap: 10px;
    padding: 14px 18px 18px;
  }

  .cookie-modal-primary {
    width: 100%;
  }
}

@media (max-width: 360px) {
  .social-login-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 760px) {
  .login-page {
    --login-mobile-visual-height: min(250px, calc(100vw * 0.5628));
  }

  .login-card {
    gap: 7px;
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .login-card-header {
    gap: 4px;
  }

  .login-card-header h1 {
    font-size: clamp(1.55rem, 2.2vw, 1.95rem);
  }

  .login-divider {
    gap: 8px;
    font-size: 0.66rem;
  }

  .login-submit,
  .social-login-button,
  .login-field input {
    min-height: 36px;
  }

  .login-form {
    gap: 7px;
  }

  .password-control button {
    width: 30px;
    height: 30px;
  }
}
</style>
