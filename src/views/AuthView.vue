<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import authArt from '@/assets/iberia-key-art.png'
import { useSessionStore } from '@/stores/session'
import type { AuthProviderDto } from '@/types/game'

type AuthMode = 'login' | 'signup' | 'recovery'
type SignupStep = 'request' | 'confirm'
type RecoveryStep = 'request' | 'reset'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()

const mode = ref<AuthMode>('login')
const signupStep = ref<SignupStep>('request')
const recoveryStep = ref<RecoveryStep>('request')
const showPassword = ref(false)
const formError = ref<string | null>(null)
const feedbackMessage = ref<string | null>(null)

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
  { id: 'google', label: 'Google', description: 'Acceso OAuth con Google', configured: false },
  { id: 'microsoft', label: 'Microsoft', description: 'Acceso OAuth con Microsoft', configured: false },
  { id: 'github', label: 'GitHub', description: 'Acceso OAuth con GitHub', configured: false },
  { id: 'apple', label: 'Apple', description: 'Acceso OAuth con Apple', configured: false },
]

const socialProviders = computed(() =>
  providerFallbacks.map((fallback) => {
    const remote = session.authProviders.find((provider) => provider.id === fallback.id)
    return { ...fallback, ...remote, configured: remote?.configured ?? false }
  }),
)

const pageTitle = computed(() => {
  if (mode.value === 'signup') return signupStep.value === 'confirm' ? 'Confirma tu código' : 'Crear cuenta'
  if (mode.value === 'recovery') return recoveryStep.value === 'reset' ? 'Nueva contraseña' : 'Recuperar acceso'
  return 'Iniciar sesión'
})

const pageCopy = computed(() => {
  if (mode.value === 'signup' && signupStep.value === 'confirm') {
    return 'Introduce el código que hemos enviado a tu correo para activar el mando.'
  }
  if (mode.value === 'signup') return 'Alta con verificación por email antes de entrar al mapa.'
  if (mode.value === 'recovery' && recoveryStep.value === 'reset') {
    return 'El enlace es temporal. Define una contraseña nueva para volver a producción.'
  }
  if (mode.value === 'recovery') return 'Te enviaremos un enlace temporal al correo de tu cuenta.'
  return 'Accede al tablero de Iberia 2084 con tus credenciales.'
})

onMounted(async () => {
  applyRecoveryQuery()
  await session.loadAuthProviders().catch(() => undefined)
})

watch(
  () => route.query,
  () => applyRecoveryQuery(),
)

function setMode(nextMode: AuthMode) {
  mode.value = nextMode
  formError.value = null
  feedbackMessage.value = null
  if (nextMode !== 'signup') signupStep.value = 'request'
  if (nextMode === 'recovery' && !hasRecoveryQuery()) recoveryStep.value = 'request'
}

function applyRecoveryQuery() {
  const resetId = queryString('resetId')
  const token = queryString('token')
  const email = queryString('email')
  if (!resetId || !token || !email) return

  mode.value = 'recovery'
  recoveryStep.value = 'reset'
  recoveryForm.resetId = resetId
  recoveryForm.token = token
  recoveryForm.email = email
  feedbackMessage.value = 'Enlace de recuperación detectado.'
}

function hasRecoveryQuery() {
  return Boolean(queryString('resetId') && queryString('token') && queryString('email'))
}

function queryString(key: string) {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

function passwordIsValid(value: string) {
  return value.length >= 8 && /[\d\W_]/.test(value)
}

function providerInitial(provider: AuthProviderDto) {
  return provider.label.slice(0, 1).toUpperCase()
}

function providerTitle(provider: AuthProviderDto) {
  return provider.configured ? provider.description : `${provider.label} pendiente de configuración OAuth`
}

function startSocialLogin(provider: AuthProviderDto) {
  if (!provider.configured) {
    feedbackMessage.value = `${provider.label} todavía no está configurado.`
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
  <main class="auth-page">
    <section class="auth-panel" aria-label="Acceso de usuario">
      <div class="auth-shell">
        <header class="brand-lockup">
          <span class="brand-mark">
            <span>IB</span>
            <strong>2084</strong>
          </span>
          <span class="brand-name">Iberia 2084</span>
        </header>

        <section class="auth-card" aria-labelledby="auth-title">
          <header class="access-heading">
            <span class="kicker">Acceso</span>
            <h1 id="auth-title">{{ pageTitle }}</h1>
            <p>{{ pageCopy }}</p>
          </header>

          <nav class="mode-switch" aria-label="Modo de acceso">
            <button type="button" :class="{ active: mode === 'login' }" @click="setMode('login')">Entrar</button>
            <button type="button" :class="{ active: mode === 'signup' }" @click="setMode('signup')">Registro</button>
            <button type="button" :class="{ active: mode === 'recovery' }" @click="setMode('recovery')">
              Recuperar
            </button>
          </nav>

          <section v-if="mode === 'login'" class="oauth-grid" aria-label="Acceso con proveedores externos">
            <button
              v-for="provider in socialProviders"
              :key="provider.id"
              class="oauth-button"
              type="button"
              :disabled="!provider.configured"
              :title="providerTitle(provider)"
              @click="startSocialLogin(provider)"
            >
              <span class="oauth-initial" aria-hidden="true">{{ providerInitial(provider) }}</span>
              <span>{{ provider.label }}</span>
              <small>Pendiente</small>
            </button>
          </section>

          <div v-if="mode === 'login'" class="divider" aria-hidden="true">
            <span>credenciales</span>
          </div>

          <form v-if="mode === 'login'" class="auth-form" @submit.prevent="submitLogin">
            <label class="field" for="login-username">
              <span>Usuario o correo</span>
              <input
                id="login-username"
                v-model.trim="loginForm.username"
                autocomplete="username"
                placeholder="gandalf o correo@dominio.es"
                required
              />
            </label>

            <label class="field" for="login-password">
              <span>Contraseña</span>
              <div class="password-control">
                <input
                  id="login-password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="contraseña"
                  required
                />
                <button type="button" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword">
                  {{ showPassword ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </label>

            <button class="app-button submit-button" type="submit" :disabled="session.loading">Entrar</button>
            <button class="text-button" type="button" @click="setMode('recovery')">Recuperar contraseña</button>
          </form>

          <form v-else-if="mode === 'signup'" class="auth-form" @submit.prevent="submitSignup">
            <template v-if="signupStep === 'request'">
              <label class="field" for="signup-username">
                <span>Usuario</span>
                <input id="signup-username" v-model.trim="signupForm.username" autocomplete="username" placeholder="usuario" required />
              </label>

              <label class="field" for="signup-display-name">
                <span>Nombre visible</span>
                <input id="signup-display-name" v-model.trim="signupForm.displayName" autocomplete="name" placeholder="Nombre público" />
              </label>

              <label class="field" for="signup-email">
                <span>Correo electrónico</span>
                <input id="signup-email" v-model.trim="signupForm.email" autocomplete="email" placeholder="correo@ejemplo.es" required type="email" />
              </label>

              <label class="field" for="signup-password">
                <span>Contraseña</span>
                <input id="signup-password" v-model="signupForm.password" autocomplete="new-password" minlength="8" placeholder="mínimo 8 caracteres" required type="password" />
                <small>Mínimo 8 caracteres y al menos un número o símbolo.</small>
              </label>

              <label class="field" for="signup-confirm-password">
                <span>Repetir contraseña</span>
                <input id="signup-confirm-password" v-model="signupForm.confirmPassword" autocomplete="new-password" minlength="8" placeholder="repite la contraseña" required type="password" />
              </label>
            </template>

            <template v-else>
              <label class="field" for="signup-code">
                <span>Código de acceso</span>
                <input id="signup-code" v-model.trim="signupForm.code" autocomplete="one-time-code" inputmode="numeric" maxlength="6" placeholder="000000" required />
                <small>Revisa tu correo y pega aquí los 6 dígitos.</small>
              </label>
              <button class="text-button" type="button" @click="signupStep = 'request'">Cambiar datos de registro</button>
            </template>

            <button class="app-button submit-button" type="submit" :disabled="session.loading">
              {{ signupStep === 'request' ? 'Enviar código' : 'Confirmar cuenta' }}
            </button>
          </form>

          <form v-else class="auth-form" @submit.prevent="submitRecovery">
            <template v-if="recoveryStep === 'request'">
              <label class="field" for="recovery-email">
                <span>Correo electrónico</span>
                <input id="recovery-email" v-model.trim="recoveryForm.email" autocomplete="email" placeholder="correo@ejemplo.es" required type="email" />
              </label>
              <button class="app-button submit-button" type="submit" :disabled="session.loading">Enviar enlace</button>
              <button class="text-button" type="button" @click="setMode('login')">Volver al acceso</button>
            </template>

            <template v-else>
              <label class="field" for="recovery-password">
                <span>Nueva contraseña</span>
                <input id="recovery-password" v-model="recoveryForm.password" autocomplete="new-password" minlength="8" placeholder="nueva contraseña" required type="password" />
              </label>

              <label class="field" for="recovery-confirm-password">
                <span>Repetir contraseña</span>
                <input id="recovery-confirm-password" v-model="recoveryForm.confirmPassword" autocomplete="new-password" minlength="8" placeholder="repite la contraseña" required type="password" />
              </label>

              <button class="app-button submit-button" type="submit" :disabled="session.loading">Guardar contraseña</button>
            </template>
          </form>

          <p v-if="formError || session.error" class="form-error" role="alert">{{ formError || session.error }}</p>
          <p v-if="feedbackMessage" class="form-feedback" role="status">{{ feedbackMessage }}</p>
        </section>
      </div>
    </section>

    <aside class="auth-visual" aria-label="Panel estratégico de Iberia 2084">
      <img :src="authArt" alt="Mapa estratégico de Iberia 2084" />
      <div class="visual-overlay">
        <section class="strategic-board" aria-label="Estado del teatro ibérico">
          <span class="kicker">Centro de mando</span>
          <h2>El mapa está vivo. La ventanilla, también.</h2>
          <p>El acceso queda protegido por correo verificado antes de abrir partidas, alianzas y provincias.</p>

          <dl class="status-grid">
            <div>
              <dt>Correo</dt>
              <dd>Verificado</dd>
            </div>
            <div>
              <dt>OAuth</dt>
              <dd>Stand-by</dd>
            </div>
            <div>
              <dt>Dominio</dt>
              <dd>iberia2084.com</dd>
            </div>
          </dl>

          <ul class="dispatch-list" aria-label="Actividad del sistema">
            <li>
              <span></span>
              <p>Códigos temporales para altas nuevas.</p>
            </li>
            <li>
              <span></span>
              <p>Recuperación con enlace firmado por email.</p>
            </li>
            <li>
              <span></span>
              <p>Proveedores externos visibles y apagados hasta configurar OAuth.</p>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  </main>
</template>

<style scoped>
.auth-page,
.auth-page * {
  box-sizing: border-box;
  letter-spacing: 0;
}

.auth-page {
  display: grid;
  grid-template-columns: minmax(420px, 520px) minmax(0, 1fr);
  min-height: 100svh;
  background:
    linear-gradient(135deg, rgba(105, 182, 159, 0.08), transparent 34%),
    linear-gradient(180deg, rgba(201, 111, 95, 0.08), transparent 28%),
    var(--color-bg);
}

.auth-panel {
  position: relative;
  z-index: 2;
  display: grid;
  min-width: 0;
  min-height: 100svh;
  align-items: center;
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 28%, var(--color-border));
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 8rem),
    color-mix(in srgb, var(--color-surface) 92%, black);
  box-shadow: 18px 0 42px rgba(0, 0, 0, 0.34);
}

.auth-shell {
  display: grid;
  width: 100%;
  max-width: 450px;
  gap: 1rem;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.brand-mark {
  display: grid;
  width: 58px;
  min-height: 52px;
  align-content: center;
  justify-items: center;
  border-left: 2px solid var(--color-accent);
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 38%, transparent);
  color: var(--color-accent-strong);
  background: rgba(8, 12, 10, 0.62);
  line-height: 1;
}

.brand-mark span {
  font-size: 0.68rem;
  font-weight: 950;
}

.brand-mark strong {
  color: var(--color-text);
  font-size: 1.18rem;
  font-weight: 950;
}

.brand-name {
  min-width: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 950;
  overflow-wrap: anywhere;
}

.auth-card {
  display: grid;
  gap: 1rem;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--color-accent) 20%, var(--color-border));
  border-radius: 6px;
  padding: clamp(1rem, 2.2vw, 1.5rem);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 7rem),
    rgba(12, 17, 16, 0.78);
  box-shadow: var(--strategy-shadow);
}

.access-heading {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
}

.kicker {
  margin: 0;
  color: var(--color-accent-strong);
  font-size: 0.76rem;
  font-weight: 950;
  line-height: 1.1;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: var(--color-text);
  font-size: clamp(1.65rem, 2.2vw, 2.1rem);
  font-weight: 950;
  line-height: 1.05;
}

.access-heading p,
.strategic-board p {
  color: var(--color-muted);
  font-size: 0.92rem;
  font-weight: 720;
  line-height: 1.45;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(8, 12, 10, 0.5);
}

.mode-switch button,
.oauth-button,
.text-button,
.password-control button {
  font: inherit;
}

.mode-switch button {
  min-width: 0;
  min-height: 42px;
  border: 0;
  border-right: 1px solid var(--color-border);
  padding: 0.55rem 0.42rem;
  color: var(--color-muted);
  background: transparent;
  font-size: 0.84rem;
  font-weight: 900;
  line-height: 1.05;
}

.mode-switch button:last-child {
  border-right: 0;
}

.mode-switch .active {
  color: var(--color-on-accent);
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
}

.oauth-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  min-width: 0;
}

.oauth-button {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  min-width: 0;
  min-height: 52px;
  gap: 0.52rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
  color: var(--color-muted);
  background: color-mix(in srgb, var(--color-surface-soft) 74%, black);
  opacity: 0.72;
  cursor: not-allowed;
}

.oauth-button span:not(.oauth-initial) {
  min-width: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.oauth-button small {
  grid-column: 2;
  color: var(--color-subtle);
  font-size: 0.7rem;
  font-weight: 800;
}

.oauth-initial {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
  border-radius: 50%;
  color: var(--color-accent-strong);
  background: var(--color-bg);
  font-size: 0.78rem;
  font-weight: 950;
}

.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.65rem;
  color: var(--color-subtle);
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  height: 1px;
  background: var(--color-border);
  content: '';
}

.auth-form {
  display: grid;
  gap: 0.82rem;
  min-width: 0;
}

.field {
  display: grid;
  gap: 0.42rem;
  min-width: 0;
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1.2;
  text-transform: uppercase;
}

.field input {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.62rem 0.72rem;
  color: var(--color-text);
  background: rgba(8, 12, 10, 0.72);
  outline: none;
}

.field input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.field small {
  color: var(--color-subtle);
  font-size: 0.72rem;
  font-weight: 720;
  line-height: 1.35;
  text-transform: none;
}

.password-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  min-width: 0;
}

.password-control input {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.password-control button {
  min-width: 70px;
  border: 1px solid var(--color-border);
  border-left: 0;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding-inline: 0.65rem;
  color: var(--color-accent-strong);
  background: var(--color-surface-soft);
  font-size: 0.76rem;
  font-weight: 900;
}

.submit-button {
  width: 100%;
  min-height: 48px;
  justify-content: center;
  font-size: 0.96rem;
}

.text-button {
  justify-self: center;
  border: 0;
  padding: 0.25rem 0.1rem;
  color: var(--color-accent-strong);
  background: transparent;
  font-size: 0.82rem;
  font-weight: 900;
}

.form-error,
.form-feedback {
  border-left: 3px solid var(--color-danger);
  padding: 0.48rem 0.66rem;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-danger) 14%, transparent);
  font-size: 0.84rem;
  font-weight: 780;
  line-height: 1.35;
}

.form-feedback {
  border-left-color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 13%, transparent);
}

.auth-visual {
  position: relative;
  min-width: 0;
  min-height: 100svh;
  overflow: hidden;
  background: #070907;
}

.auth-visual::before,
.auth-visual::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.auth-visual::before {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(7, 9, 7, 0.68), rgba(7, 9, 7, 0.14) 42%, rgba(7, 9, 7, 0.68)),
    linear-gradient(180deg, rgba(7, 9, 7, 0.34), rgba(7, 9, 7, 0.08) 44%, rgba(7, 9, 7, 0.84));
}

.auth-visual::after {
  z-index: 2;
  background:
    linear-gradient(90deg, rgba(210, 173, 84, 0.12) 1px, transparent 1px),
    linear-gradient(180deg, rgba(105, 182, 159, 0.1) 1px, transparent 1px);
  background-size: 86px 86px;
  opacity: 0.16;
}

.auth-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 54% 50%;
  filter: saturate(0.92) contrast(1.08) brightness(0.88);
}

.visual-overlay {
  position: relative;
  z-index: 3;
  display: grid;
  min-height: 100%;
  align-items: end;
  padding: clamp(1rem, 4vw, 3rem);
}

.strategic-board {
  display: grid;
  width: min(100%, 660px);
  gap: 1rem;
  border-left: 3px solid var(--color-accent);
  padding: clamp(1rem, 2.8vw, 1.6rem);
  background: linear-gradient(90deg, rgba(8, 12, 10, 0.86), rgba(8, 12, 10, 0.42));
  backdrop-filter: blur(6px);
  box-shadow: 0 20px 46px rgba(0, 0, 0, 0.38);
}

.strategic-board h2 {
  max-width: 11ch;
  color: var(--color-text);
  font-size: clamp(2.2rem, 5vw, 5.1rem);
  font-weight: 950;
  line-height: 0.98;
}

.strategic-board p {
  max-width: 58ch;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  margin: 0;
}

.status-grid div {
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
  border-radius: 6px;
  padding: 0.65rem;
  background: rgba(8, 12, 10, 0.66);
}

.status-grid dt {
  margin: 0 0 0.22rem;
  color: var(--color-subtle);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.status-grid dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 950;
  overflow-wrap: anywhere;
}

.dispatch-list {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dispatch-list li {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  align-items: start;
  gap: 0.55rem;
  color: var(--color-muted);
  font-size: 0.86rem;
  font-weight: 720;
}

.dispatch-list span {
  width: 10px;
  height: 10px;
  margin-top: 0.32rem;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-success) 48%, transparent);
}

@media (max-width: 980px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-panel {
    min-height: auto;
    border-right: 0;
    box-shadow: none;
  }

  .auth-shell {
    max-width: 620px;
    padding-block: 1rem;
  }

  .auth-visual {
    min-height: auto;
  }

  .visual-overlay {
    min-height: auto;
    padding: 1rem;
  }

  .auth-visual img {
    opacity: 0.46;
  }

  .strategic-board {
    width: 100%;
  }

  .strategic-board h2 {
    max-width: 16ch;
    font-size: clamp(1.8rem, 8vw, 3rem);
  }
}

@media (max-width: 560px) {
  .auth-shell {
    padding: 0.8rem;
  }

  .auth-card {
    padding: 0.85rem;
  }

  .oauth-grid,
  .status-grid {
    grid-template-columns: 1fr;
  }

  .mode-switch button {
    min-height: 40px;
    padding-inline: 0.22rem;
    font-size: 0.76rem;
  }

  .brand-mark {
    width: 52px;
    min-height: 48px;
  }

  .strategic-board {
    padding: 0.9rem;
  }
}
</style>
