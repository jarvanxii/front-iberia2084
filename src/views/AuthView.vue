<script setup lang="ts">
import { ref } from 'vue'
import authArt from '@/assets/iberia-key-art.png'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const mode = ref<'login' | 'signup'>('login')
const username = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const formError = ref<string | null>(null)

function switchMode(nextMode: 'login' | 'signup') {
  mode.value = nextMode
  formError.value = null
}

function passwordIsValid(value: string) {
  return value.length >= 8 && /[\d\W_]/.test(value)
}

function validateSignup() {
  if (!email.value.trim()) {
    formError.value = 'Introduce un correo electrónico.'
    return false
  }
  if (!passwordIsValid(password.value)) {
    formError.value = 'La contraseña debe tener al menos 8 caracteres e incluir un número o un símbolo.'
    return false
  }
  if (password.value !== confirmPassword.value) {
    formError.value = 'Las contraseñas no coinciden.'
    return false
  }
  return true
}

async function submit() {
  formError.value = null
  if (mode.value === 'login') {
    await session.login(username.value, password.value)
  } else {
    if (!validateSignup()) return
    await session.signup({
      username: username.value.trim(),
      displayName: displayName.value.trim() || username.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
  }
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
  <section class="auth-page">
    <section class="auth-visual" aria-label="Mapa estratégico de Iberia 2084">
      <img :src="authArt" alt="Mapa estratégico de Iberia 2084" />

      <div class="auth-brand-rail" aria-hidden="true">
        <span class="auth-mark">
          <span>IB</span>
          <strong>2084</strong>
        </span>
        <span class="auth-brand-line"></span>
        <span class="auth-brand-text">Beta estratégica</span>
      </div>

      <div class="auth-visual-copy">
        <p class="eyebrow">Iberia 2084</p>
        <h1>Acceso al mapa</h1>
        <p>Entra, elige partida y toma el control de tu provincia.</p>
      </div>
    </section>

    <aside class="auth-panel" aria-label="Acceso de usuario">
      <div class="auth-panel-inner">
        <div class="access-heading">
          <span>{{ mode === 'login' ? 'Acceso' : 'Registro' }}</span>
          <strong>{{ mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}</strong>
          <p>{{ mode === 'login' ? 'Vuelve al tablero de Iberia 2084.' : 'Crea tu mando y prepara tu primera partida.' }}</p>
        </div>

        <div class="mode-switch" aria-label="Modo de acceso">
          <button type="button" :class="{ active: mode === 'login' }" @click="switchMode('login')">Entrar</button>
          <button type="button" :class="{ active: mode === 'signup' }" @click="switchMode('signup')">
            Crear cuenta
          </button>
        </div>

        <form @submit.prevent="submit">
          <label>
            {{ mode === 'login' ? 'Usuario o correo' : 'Usuario' }}
            <input
              v-model="username"
              autocomplete="username"
              :placeholder="mode === 'login' ? 'usuario o correo' : 'usuario'"
              required
            />
          </label>

          <label v-if="mode === 'signup'">
            Nombre visible
            <input v-model="displayName" placeholder="Nombre público" required />
          </label>

          <label v-if="mode === 'signup'">
            Correo electrónico
            <input v-model="email" autocomplete="email" placeholder="correo@ejemplo.es" required type="email" />
          </label>

          <label>
            Contraseña
            <input
              v-model="password"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
              :minlength="mode === 'signup' ? 8 : 1"
              :placeholder="mode === 'signup' ? 'mínimo 8 caracteres' : 'contraseña'"
              type="password"
              required
            />
            <small v-if="mode === 'signup'">Mínimo 8 caracteres y al menos un número o símbolo.</small>
          </label>

          <label v-if="mode === 'signup'">
            Repetir contraseña
            <input
              v-model="confirmPassword"
              autocomplete="new-password"
              minlength="8"
              placeholder="repite la contraseña"
              required
              type="password"
            />
          </label>

          <p v-if="formError || session.error" class="form-error">{{ formError || session.error }}</p>

          <button class="app-button" type="submit" :disabled="session.loading">
            {{ mode === 'signup' ? 'Crear cuenta' : 'Entrar' }}
          </button>
        </form>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(420px, 31vw, 510px);
  min-height: 100svh;
  overflow: hidden;
  background: var(--color-bg);
}

.auth-visual {
  position: relative;
  min-width: 0;
  min-height: 100svh;
  overflow: hidden;
  background: #080a09;
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
    linear-gradient(90deg, rgba(12, 17, 16, 0.08), rgba(12, 17, 16, 0.1) 47%, rgba(12, 17, 16, 0.78)),
    linear-gradient(180deg, rgba(12, 17, 16, 0.18), transparent 33%, rgba(12, 17, 16, 0.82));
}

.auth-visual::after {
  z-index: 2;
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
  background:
    linear-gradient(90deg, rgba(210, 173, 84, 0.18) 1px, transparent 1px),
    linear-gradient(180deg, rgba(210, 173, 84, 0.1) 1px, transparent 1px);
  background-size: 78px 78px;
  opacity: 0.13;
}

.auth-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 47% 50%;
  filter: saturate(0.88) contrast(1.08) brightness(0.9);
  transform: scale(1.01);
}

.auth-brand-rail {
  position: absolute;
  z-index: 3;
  top: clamp(1rem, 2.4vw, 1.7rem);
  left: clamp(1rem, 2.4vw, 1.8rem);
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--color-accent-strong);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
}

.auth-mark {
  display: grid;
  width: 62px;
  min-height: 56px;
  align-content: center;
  justify-items: center;
  border-left: 2px solid var(--color-accent);
  border-right: 1px solid color-mix(in srgb, var(--color-accent) 36%, transparent);
  background: rgba(8, 10, 9, 0.5);
  line-height: 1;
  box-shadow: inset 0 1px 0 rgba(255, 241, 190, 0.08);
}

.auth-mark span {
  font-size: 0.68rem;
  font-weight: 950;
}

.auth-mark strong {
  color: var(--color-text);
  font-size: 1.24rem;
  font-weight: 950;
}

.auth-brand-line {
  width: clamp(42px, 9vw, 142px);
  height: 1px;
  background: linear-gradient(90deg, var(--color-accent), transparent);
}

.auth-brand-text {
  color: color-mix(in srgb, var(--color-accent-strong) 82%, var(--color-text));
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.auth-visual-copy {
  position: absolute;
  z-index: 3;
  right: clamp(1rem, 5vw, 4.8rem);
  bottom: clamp(1.2rem, 4vw, 3.8rem);
  left: clamp(1rem, 4vw, 3.4rem);
  display: grid;
  min-width: 0;
  max-width: 670px;
  gap: var(--space-2);
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-4);
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.82);
}

.eyebrow,
.access-heading span {
  margin: 0;
  color: var(--color-accent-strong);
  font-size: 0.78rem;
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2.3rem, 5vw, 5.25rem);
  font-weight: 950;
  line-height: 0.96;
}

.auth-visual-copy p:last-child {
  max-width: 460px;
  margin: 0;
  color: color-mix(in srgb, var(--color-text) 88%, var(--color-muted));
  font-size: clamp(1rem, 1.2vw, 1.13rem);
  font-weight: 740;
  line-height: 1.34;
  overflow-wrap: anywhere;
}

.auth-panel {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 100svh;
  align-items: center;
  border-left: 1px solid color-mix(in srgb, var(--color-accent) 34%, var(--color-border));
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 6rem),
    linear-gradient(90deg, rgba(210, 173, 84, 0.08), transparent 42%),
    var(--color-surface);
  box-shadow: -18px 0 38px rgba(0, 0, 0, 0.36);
}

.auth-panel::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), transparent 72%);
}

.auth-panel-inner {
  display: grid;
  min-width: 0;
  max-width: 440px;
  gap: var(--space-5);
  width: 100%;
  margin: 0 auto;
  padding: clamp(1rem, 3.2vw, 2.2rem);
}

.access-heading {
  display: grid;
  gap: var(--space-2);
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 28%, var(--color-border));
  padding-bottom: var(--space-5);
}

.access-heading strong {
  color: var(--color-text);
  font-size: clamp(1.65rem, 2.1vw, 2.05rem);
  font-weight: 950;
  line-height: 1.02;
}

.access-heading p {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 720;
}

.mode-switch {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-width: 0;
  max-width: 100%;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(8, 12, 10, 0.44);
  box-shadow: var(--strategy-inset);
}

.mode-switch button {
  min-width: 0;
  min-height: 42px;
  border: 0;
  border-right: 1px solid var(--color-border);
  border-radius: 0;
  padding: 0.58rem 0.62rem;
  color: var(--color-muted);
  background: transparent;
  font-weight: 900;
  line-height: 1.08;
}

.mode-switch button:last-child {
  border-right: 0;
}

.mode-switch .active {
  color: var(--color-on-accent);
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
}

form {
  display: grid;
  gap: var(--space-5);
}

label {
  display: grid;
  gap: var(--space-2);
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
}

input {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.62rem 0.72rem;
  color: var(--color-text);
  background: rgba(8, 12, 10, 0.62);
  outline: none;
}

input:focus {
  border-color: var(--color-accent);
}

label small {
  color: var(--color-subtle);
  font-size: 0.72rem;
  font-weight: 720;
  line-height: 1.35;
  text-transform: none;
}

.form-error {
  margin: 0;
  border-left: 3px solid var(--color-danger);
  padding: 0.42rem 0.62rem;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-danger) 16%, transparent);
  font-weight: 780;
}

.auth-panel .app-button {
  min-height: 48px;
  font-size: 0.98rem;
}

@media (max-width: 980px) {
  .auth-page {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .auth-visual {
    min-height: clamp(300px, 45svh, 460px);
  }

  .auth-visual::before {
    background:
      linear-gradient(180deg, rgba(12, 17, 16, 0.06), rgba(12, 17, 16, 0.85)),
      linear-gradient(90deg, rgba(12, 17, 16, 0.08), rgba(12, 17, 16, 0.32));
  }

  .auth-visual::after {
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
  }

  .auth-panel {
    min-height: auto;
    border-left: 0;
    box-shadow: none;
  }

  .auth-panel-inner {
    max-width: 560px;
    padding-block: clamp(1.1rem, 4vw, 2rem);
  }
}

@media (max-width: 560px) {
  .auth-visual {
    min-height: 300px;
  }

  .auth-brand-rail {
    top: var(--space-5);
    left: var(--space-5);
  }

  .auth-brand-line,
  .auth-brand-text {
    display: none;
  }

  .auth-mark {
    width: 54px;
    min-height: 50px;
  }

  .auth-visual-copy {
    right: var(--space-5);
    bottom: var(--space-5);
    left: var(--space-5);
    padding-left: var(--space-3);
  }

  h1 {
    font-size: clamp(1.86rem, 10.5vw, 2.72rem);
    line-height: 0.98;
  }

  .auth-visual-copy p:last-child {
    max-width: 31ch;
    font-size: 0.88rem;
  }

  .auth-panel-inner {
    padding: var(--space-5) calc(var(--space-5) + 1.8rem) var(--space-5) var(--space-5);
  }

  .mode-switch button {
    padding-inline: 0.42rem;
    font-size: 0.86rem;
  }
}
</style>
