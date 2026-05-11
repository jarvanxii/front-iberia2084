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
  await router.push({ name: 'home', query: invitationQuery() })
}

function invitationQuery() {
  const mundo = typeof route.query.mundo === 'string' ? route.query.mundo : ''
  const provincia = typeof route.query.provincia === 'string' ? route.query.provincia : ''
  return mundo || provincia ? { mundo, provincia } : undefined
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-visual" aria-label="Mapa estratégico de Iberia 2084">
      <img :src="authArt" alt="Mapa estratégico de Iberia 2084" />
      <div class="auth-visual-copy">
        <p class="eyebrow">Iberia 2084</p>
        <h1>Acceso</h1>
        <p>Entra para elegir partida, gestionar tu provincia y consultar tus unidades.</p>
      </div>
    </section>

    <section class="panel auth-panel">
      <div class="access-heading">
        <span>{{ mode === 'login' ? 'Entrar' : 'Registro' }}</span>
        <strong>{{ mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}</strong>
      </div>

      <div class="mode-switch">
        <button type="button" :class="{ active: mode === 'login' }" @click="switchMode('login')">Entrar</button>
        <button type="button" :class="{ active: mode === 'signup' }" @click="switchMode('signup')">Crear cuenta</button>
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
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
  gap: var(--space-page);
  align-items: stretch;
  padding: var(--space-page);
}

.auth-visual {
  position: relative;
  min-height: calc(100vh - (var(--space-page) * 2));
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--strategy-inset);
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
  border: 1px solid rgba(210, 173, 84, 0.18);
  background:
    linear-gradient(90deg, rgba(210, 173, 84, 0.2) 1px, transparent 1px),
    linear-gradient(180deg, rgba(210, 173, 84, 0.12) 1px, transparent 1px);
  background-size: 72px 72px;
  opacity: 0.14;
}

.auth-visual::after {
  z-index: 2;
  background:
    linear-gradient(90deg, rgba(12, 17, 16, 0.1), rgba(12, 17, 16, 0.18) 54%, rgba(12, 17, 16, 0.72)),
    linear-gradient(180deg, rgba(12, 17, 16, 0.08), transparent 38%, rgba(12, 17, 16, 0.84));
}

.auth-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 50%;
  filter: saturate(0.86) contrast(1.08) brightness(0.9);
}

.auth-visual-copy {
  position: absolute;
  z-index: 3;
  right: clamp(0.75rem, 3vw, 2.2rem);
  bottom: clamp(0.75rem, 3vw, 2.2rem);
  left: clamp(0.75rem, 3vw, 2.2rem);
  display: grid;
  max-width: 620px;
  gap: var(--compact-gap-sm);
  border-left: 3px solid var(--color-accent);
  padding-left: var(--compact-gap);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.72);
}

.eyebrow,
.access-heading span {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2.1rem, 5vw, 4.2rem);
  line-height: 1;
}

.auth-visual-copy p:last-child {
  max-width: 520px;
  margin: 0;
  color: var(--color-text);
  font-size: 1.02rem;
  line-height: 1.38;
}

.auth-panel {
  display: grid;
  align-self: center;
  gap: var(--compact-gap);
  width: 100%;
  border-left: 3px solid var(--color-accent);
  padding: var(--compact-panel-padding);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 86px),
    var(--color-surface);
}

.access-heading {
  display: grid;
  gap: 0.16rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--compact-gap);
}

.access-heading strong {
  color: var(--color-text);
  font-size: 1.45rem;
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--compact-gap-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
  padding: 0.22rem;
}

.mode-switch button {
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.46rem;
  color: var(--color-muted);
  background: transparent;
  font-weight: 800;
}

.mode-switch .active {
  border-color: var(--color-accent);
  color: var(--color-on-accent);
  background: var(--color-accent);
}

form {
  display: grid;
  gap: var(--compact-gap);
}

label {
  display: grid;
  gap: var(--compact-gap-sm);
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

input {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.58rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
  outline: none;
}

input:focus {
  border-color: var(--color-accent);
}

label small {
  color: var(--color-subtle);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.35;
  text-transform: none;
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-weight: 700;
}

@media (max-width: 900px) {
  .auth-page {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .auth-visual {
    min-height: 280px;
  }

  .auth-visual::after {
    background:
      linear-gradient(180deg, rgba(12, 17, 16, 0.1), rgba(12, 17, 16, 0.88)),
      linear-gradient(90deg, rgba(12, 17, 16, 0.12), rgba(12, 17, 16, 0.5));
  }

  .auth-panel {
    align-self: stretch;
    border-left-width: 1px;
  }
}

@media (max-width: 560px) {
  .auth-visual {
    min-height: 220px;
  }

  .auth-visual-copy {
    right: var(--compact-panel-padding);
    bottom: var(--compact-panel-padding);
    left: var(--compact-panel-padding);
  }
}
</style>
