<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import googleIcon from '@/assets/auth/google.svg'
import authArt from '@/assets/banner-iberia.png'
import { apiUrl } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import type { AuthProviderDto } from '@/types/game'

type AuthMode = 'login' | 'signup' | 'recovery'
type SignupStep = 'request' | 'confirm'
type RecoveryStep = 'request' | 'reset'

const COOKIE_NOTICE_KEY = 'iberia2084.cookieConsent.v1'

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
      configured: remote?.configured === true,
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
  applyOAuthQuery()
  await session.loadAuthProviders().catch(() => undefined)
  loadCookieNoticeConsent()
})

watch(
  () => route.query,
  () => {
    applyRecoveryQuery()
    applyOAuthQuery()
  },
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

function applyOAuthQuery() {
  const oauthStatus = queryString('oauth')
  if (!oauthStatus) return

  authMode.value = 'login'
  if (oauthStatus === 'error' || oauthStatus === 'provider_not_configured') {
    formError.value = queryString('message') || 'No se pudo completar el acceso con Google.'
  }
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
    return
  }

  formError.value = null
  feedbackMessage.value = null
  const returnTo = `${window.location.origin}${router.resolve({ name: 'home' }).href}`
  const params = new URLSearchParams({ return_to: returnTo })
  window.location.assign(`${apiUrl(`/api/auth/oauth/${provider.id}`)}?${params.toString()}`)
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
  <main :class="['login-page', `login-page--${authMode}`]">
    <section class="login-layout">
      <section class="login-visual" aria-label="Banner de Iberia 2084" :style="{ '--login-art': `url(${authArt})` }">
        <picture>
          <source media="(max-width: 980px)" :srcset="authArt" />
          <img class="login-banner" :src="authArt" alt="Banner de Iberia 2084" />
        </picture>
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
            class="social-login-button"
            :class="{ 'is-unavailable': !provider.configured }"
            type="button"
            :disabled="!provider.configured"
            :aria-label="`Continuar con ${provider.label}`"
            :title="providerTitle(provider)"
            @click="startSocialLogin(provider)"
          >
            <img
              v-if="provider.id === 'google'"
              class="social-provider-icon"
              :src="googleIcon"
              alt=""
              aria-hidden="true"
            />
            <span v-else class="provider-initial" aria-hidden="true">{{ provider.label.charAt(0) }}</span>
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
  --color-bg: #06111f;
  --color-surface: #0b1726;
  --color-surface-soft: #122236;
  --color-surface-raised: #172c43;
  --color-border: #2d4a64;
  --color-border-strong: #5d7f9c;
  --color-text: #f4f8fd;
  --color-muted: #aec1d4;
  --color-subtle: #758ba2;
  --color-accent: #367fc6;
  --color-accent-strong: #8bd0ff;
  --color-on-accent: #04101d;
  --color-success: #6fcfff;
  --color-info: #9bc3ff;
  overflow: hidden;
  height: 100vh;
  height: 100svh;
  min-height: 100vh;
  min-height: 100svh;
  color: var(--color-text);
  background:
    radial-gradient(circle at 18% 12%, rgba(80, 160, 235, 0.16), transparent 23rem),
    radial-gradient(circle at 88% 74%, rgba(30, 88, 146, 0.24), transparent 24rem),
    linear-gradient(145deg, rgba(255, 255, 255, 0.026), transparent 38%),
    linear-gradient(135deg, rgba(137, 198, 255, 0.024) 1px, transparent 1px),
    linear-gradient(45deg, rgba(137, 198, 255, 0.018) 1px, transparent 1px),
    var(--color-bg);
  background-size: auto, auto, auto, 54px 54px, 54px 54px, auto;
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
    radial-gradient(circle at 50% 42%, rgba(89, 168, 235, 0.14), transparent 34rem),
    linear-gradient(120deg, rgba(127, 197, 255, 0.06) 1px, transparent 1px),
    linear-gradient(180deg, rgba(127, 197, 255, 0.052) 1px, transparent 1px),
    #040b15;
  background-size: auto, 88px 88px, 88px 88px, auto;
}

.login-visual::before,
.login-visual::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.login-visual::before {
  z-index: 0;
  inset: -32px;
  background:
    linear-gradient(180deg, rgba(3, 10, 18, 0.26), rgba(3, 10, 18, 0.2)),
    var(--login-art) center / cover no-repeat;
  filter: blur(14px) saturate(1.04) brightness(0.58);
  opacity: 0.88;
  transform: scale(1.04);
}

.login-visual::after {
  z-index: 2;
  background:
    radial-gradient(circle at 52% 45%, transparent 0 32%, rgba(4, 12, 22, 0.24) 66%, rgba(4, 12, 22, 0.62) 100%),
    linear-gradient(90deg, rgba(4, 12, 22, 0.2), transparent 34%, rgba(4, 12, 22, 0.58)),
    linear-gradient(180deg, rgba(4, 12, 22, 0.18), transparent 45%, rgba(4, 12, 22, 0.5));
}

.login-banner {
  position: absolute;
  inset: 0;
  z-index: 1;
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

.login-visual picture {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
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
    radial-gradient(circle at 90% 12%, rgba(104, 181, 249, 0.15), transparent 13rem),
    linear-gradient(145deg, rgba(151, 205, 255, 0.075), transparent 36%),
    linear-gradient(135deg, transparent 0 18px, rgba(125, 190, 255, 0.048) 18px 19px, transparent 19px 52px),
    linear-gradient(45deg, transparent 0 31px, rgba(125, 190, 255, 0.038) 31px 32px, transparent 32px 64px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.052), transparent 8rem),
    color-mix(in srgb, var(--color-surface) 92%, black);
  background-size: auto, auto, auto, auto, auto, auto;
  box-shadow:
    -20px 0 54px rgba(2, 9, 18, 0.38),
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
  background: rgba(4, 12, 22, 0.72);
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  background: rgba(248, 250, 252, 0.94);
  color: #0d141f;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.social-login-button:only-child {
  grid-column: 1 / -1;
}

.social-login-button.is-unavailable {
  cursor: not-allowed;
  background: rgba(148, 163, 184, 0.2);
  color: #9ca8b7;
  box-shadow: none;
}

.social-login-button:disabled {
  opacity: 0.68;
}

.social-login-button:not(.is-unavailable):hover {
  border-color: rgba(236, 194, 119, 0.66);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.22);
  transform: translateY(-1px);
}

.social-provider-icon {
  display: block;
  width: 21px;
  height: 21px;
  object-fit: contain;
  flex: 0 0 auto;
}

.provider-initial {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
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
  background: rgba(4, 12, 22, 0.82);
  color: var(--color-text);
  outline: none;
}

.login-field input::placeholder {
  color: #72859a;
}

.login-field input:focus {
  border-color: color-mix(in srgb, var(--color-accent) 78%, white);
  box-shadow: 0 0 0 3px rgba(85, 166, 232, 0.22);
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
  color: #d8f0ff;
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
  border: 1px solid rgba(111, 207, 255, 0.3);
  border-left: 3px solid var(--color-success);
  border-radius: 4px;
  background: rgba(63, 145, 204, 0.13);
  color: #ccefff;
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
  margin-top: clamp(12px, 3.4vh, 32px);
  padding-top: clamp(10px, 2vh, 16px);
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
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

@media (min-width: 981px) {
  .login-page--login .login-legal-links,
  .login-page--recovery .login-legal-links {
    position: absolute;
    bottom: clamp(34px, 6vh, 68px);
    left: 50%;
    margin-top: 0;
    transform: translateX(-50%);
  }
}

.cookie-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(120deg, rgba(86, 159, 225, 0.11), transparent 34%),
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
    linear-gradient(145deg, rgba(86, 159, 225, 0.055), transparent 46%),
    var(--color-surface);
  box-shadow:
    0 18px 48px rgba(2, 9, 18, 0.38),
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
    --login-mobile-card-lift: 22px;
    --login-mobile-visual-height: clamp(190px, 54vw, 330px);
    height: auto;
    min-height: 100vh;
    min-height: 100svh;
    overflow-x: hidden;
    overflow-y: auto;
    background:
      radial-gradient(circle at 18% 4%, rgba(89, 168, 235, 0.16), transparent 15rem),
      linear-gradient(180deg, rgba(3, 9, 17, 0.08), rgba(3, 9, 17, 0.68) 46%, rgba(3, 9, 17, 0.98)),
      linear-gradient(135deg, rgba(137, 198, 255, 0.024) 1px, transparent 1px),
      linear-gradient(45deg, rgba(137, 198, 255, 0.016) 1px, transparent 1px),
      var(--color-bg);
    background-size: auto, auto, 42px 42px, 42px 42px, auto;
  }

  .login-page--signup {
    --login-mobile-card-lift: 14px;
    --login-mobile-visual-height: clamp(174px, 48vw, 280px);
  }

  .login-page--recovery {
    --login-mobile-card-lift: 20px;
    --login-mobile-visual-height: clamp(186px, 52vw, 310px);
  }

  .login-layout {
    position: relative;
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    min-height: 100svh;
    overflow: visible;
    padding-top: 0;
  }

  .login-visual {
    position: relative;
    display: block;
    flex: 0 0 auto;
    z-index: 0;
    width: 100%;
    height: auto;
    min-height: 0;
    aspect-ratio: 1774 / 887;
    padding: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 16% 0%, rgba(104, 181, 249, 0.22), transparent 12rem),
      radial-gradient(circle at 88% 18%, rgba(43, 111, 184, 0.2), transparent 11rem),
      linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0)),
      #030a14;
  }

  .login-visual::before {
    display: none;
  }

  .login-visual::after {
    z-index: 3;
    background:
      linear-gradient(180deg, rgba(3, 10, 18, 0.02), transparent 58%, rgba(3, 10, 18, 0.64));
  }

  .login-banner {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 0;
    background: transparent;
    object-fit: contain;
    object-position: center;
    box-shadow: none;
  }

  .login-visual picture {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: block;
    width: 100%;
    height: 100%;
    max-height: none;
    aspect-ratio: 1774 / 887;
  }

  .login-card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    width: 100%;
    height: auto;
    min-height: 0;
    align-content: start;
    justify-items: center;
    gap: 12px;
    padding: clamp(18px, 3.2vw, 28px);
    padding-top: clamp(20px, 3.6svh, 32px);
    padding-bottom: calc(env(safe-area-inset-bottom) + 2px);
    overflow: visible;
    border-top: 1px solid color-mix(in srgb, var(--color-accent) 32%, var(--color-border));
    border-left: 0;
    border-radius: 0;
    background:
      radial-gradient(circle at 94% 6%, rgba(104, 181, 249, 0.16), transparent 9rem),
      linear-gradient(145deg, rgba(151, 205, 255, 0.07), transparent 35%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.062), transparent 7rem),
      color-mix(in srgb, var(--color-surface) 94%, black);
    box-shadow:
      0 -18px 42px rgba(2, 9, 18, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .login-card-header,
  .auth-mode-switch,
  .social-login-panel,
  .login-divider,
  .login-form,
  .login-feedback,
  .login-legal-links {
    width: min(100%, 420px);
  }

  .login-card-header {
    justify-self: stretch;
    text-align: left;
  }

  .section-kicker {
    justify-self: start;
  }

  .login-card-header h1 {
    font-size: clamp(1.72rem, 7vw, 2.05rem);
  }

  .auth-mode-switch {
    gap: 3px;
    padding: 3px;
  }

  .auth-mode-switch button {
    min-height: 38px;
    font-size: clamp(0.76rem, 3.3vw, 0.8rem);
  }

  .social-login-button,
  .login-submit {
    min-height: 44px;
  }

  .login-field input {
    min-height: 44px;
  }

  .login-legal-links {
    margin-top: auto;
    flex-wrap: wrap;
    line-height: 1.35;
  }

  .login-page--recovery .login-card {
    align-content: start;
  }

  .login-page--signup .login-card {
    gap: 8px;
    padding-top: 14px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 2px);
  }

  .login-page--signup .login-form {
    gap: 8px;
  }

  .login-page--signup .login-field {
    gap: 5px;
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
    --login-mobile-card-lift: 20px;
    --login-mobile-visual-height: clamp(174px, 56vw, 246px);
  }

  .login-page--signup {
    --login-mobile-card-lift: 12px;
    --login-mobile-visual-height: clamp(160px, 51vw, 224px);
  }

  .login-page--recovery {
    --login-mobile-card-lift: 18px;
    --login-mobile-visual-height: clamp(168px, 54vw, 236px);
  }

  .login-card {
    gap: 10px;
    padding: 18px 16px calc(env(safe-area-inset-bottom) + 2px);
  }

  .login-visual {
    padding: 0;
  }

  .login-legal-links {
    margin-top: auto;
    padding-top: 8px;
    gap: 6px;
    font-size: 0.75rem;
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

  .auth-mode-switch button {
    font-size: 0.74rem;
  }

  .social-login-button {
    gap: 8px;
  }
}

@media (max-height: 760px) {
  .login-page {
    --login-mobile-card-lift: 18px;
    --login-mobile-visual-height: clamp(152px, 28svh, 202px);
  }

  .login-page--signup {
    --login-mobile-card-lift: 10px;
    --login-mobile-visual-height: clamp(138px, 25svh, 180px);
  }

  .login-page--recovery {
    --login-mobile-card-lift: 16px;
    --login-mobile-visual-height: clamp(146px, 27svh, 194px);
  }

  .login-card {
    gap: 8px;
    padding-top: 16px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 2px);
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
    min-height: 40px;
  }

  .login-form {
    gap: 7px;
  }

  .password-control button {
    width: 30px;
    height: 30px;
  }
}

@media (max-width: 620px) and (max-height: 680px) {
  .login-page--login {
    --login-mobile-card-lift: 8px;
    --login-mobile-visual-height: clamp(128px, 24svh, 156px);
    overflow-x: hidden;
    overflow-y: auto;
  }

  .login-page--login .login-layout {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 100svh;
    padding-top: 0;
    overflow: visible;
  }

  .login-page--login .login-card {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    gap: 6px;
    padding: 10px 14px calc(env(safe-area-inset-bottom) + 2px);
    overflow: visible;
  }

  .login-page--login .login-visual {
    padding: 0;
  }

  .login-page--login .login-card-header {
    gap: 2px;
  }

  .login-page--login .section-kicker,
  .login-page--login .login-field span {
    font-size: 0.68rem;
  }

  .login-page--login .login-card-header h1 {
    font-size: clamp(1.42rem, 7vw, 1.68rem);
  }

  .login-page--login .auth-mode-switch button {
    min-height: 32px;
    font-size: 0.72rem;
  }

  .login-page--login .social-login-button,
  .login-page--login .login-submit,
  .login-page--login .login-field input {
    min-height: 34px;
  }

  .login-page--login .login-form {
    gap: 6px;
  }

  .login-page--login .login-field {
    gap: 4px;
  }

  .login-page--login .login-divider {
    gap: 7px;
    font-size: 0.62rem;
  }

  .login-page--login .recover-link {
    font-size: 0.76rem;
  }

  .login-page--login .login-legal-links {
    margin-top: auto;
    padding-top: 7px;
    gap: 5px;
    font-size: 0.68rem;
  }
}
</style>
