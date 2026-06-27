<script setup lang="ts">
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const displayName = ref(session.user?.displayName ?? '')
const email = ref(session.user?.email ?? '')
const emailPassword = ref('')
const emailCode = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const repeatPassword = ref('')
const savingProfile = ref(false)
const requestingEmail = ref(false)
const confirmingEmail = ref(false)
const changingPassword = ref(false)
const emailPending = ref(false)
const errorMessage = ref('')
const noticeMessage = ref('')

const currentUser = computed(() => session.user)
const canChangePassword = computed(
  () => currentPassword.value.length > 0 && newPassword.value.length >= 8 && newPassword.value === repeatPassword.value,
)

function tokenOrFail() {
  if (!session.token) throw new Error('Inicia sesión para gestionar la cuenta.')
  return session.token
}

function clearStatus() {
  errorMessage.value = ''
  noticeMessage.value = ''
}

async function saveProfile() {
  const cleanName = displayName.value.trim()
  if (cleanName.length < 3) {
    errorMessage.value = 'El nombre visible debe tener al menos 3 caracteres.'
    return
  }

  savingProfile.value = true
  clearStatus()
  try {
    const user = await api.updateAccountProfile(tokenOrFail(), { displayName: cleanName })
    session.updateUser(user)
    displayName.value = user.displayName
    noticeMessage.value = 'Nombre visible actualizado.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo actualizar el perfil.'
  } finally {
    savingProfile.value = false
  }
}

async function requestEmailChange() {
  const cleanEmail = email.value.trim().toLowerCase()
  if (!cleanEmail.includes('@')) {
    errorMessage.value = 'Escribe un correo válido.'
    return
  }

  requestingEmail.value = true
  clearStatus()
  try {
    await api.requestEmailChange(tokenOrFail(), { email: cleanEmail, password: emailPassword.value })
    emailPending.value = true
    noticeMessage.value = 'Te hemos enviado un código de seguridad al nuevo correo.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo iniciar el cambio de correo.'
  } finally {
    requestingEmail.value = false
  }
}

async function confirmEmailChange() {
  confirmingEmail.value = true
  clearStatus()
  try {
    const user = await api.confirmEmailChange(tokenOrFail(), { email: email.value.trim().toLowerCase(), code: emailCode.value.trim() })
    session.updateUser(user)
    email.value = user.email
    emailPassword.value = ''
    emailCode.value = ''
    emailPending.value = false
    noticeMessage.value = 'Correo de contacto actualizado.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo confirmar el correo.'
  } finally {
    confirmingEmail.value = false
  }
}

async function changePassword() {
  if (!canChangePassword.value) {
    errorMessage.value = 'Revisa la contraseña actual y confirma que la nueva coincide.'
    return
  }

  changingPassword.value = true
  clearStatus()
  try {
    await api.changePassword(tokenOrFail(), {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    currentPassword.value = ''
    newPassword.value = ''
    repeatPassword.value = ''
    noticeMessage.value = 'Contraseña actualizada.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.'
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <section class="account-view security-view">
    <header class="account-hero">
      <span>cuenta y seguridad</span>
      <h1>Perfil, correo y acceso</h1>
      <p>Gestiona los datos visibles y los cambios sensibles de tu cuenta.</p>
    </header>

    <p v-if="errorMessage" class="account-alert error">{{ errorMessage }}</p>
    <p v-else-if="noticeMessage" class="account-alert ok">{{ noticeMessage }}</p>

    <section class="security-grid">
      <form class="security-panel" @submit.prevent="saveProfile">
        <header>
          <span>perfil público</span>
          <strong>Nombre visible</strong>
        </header>
        <label>
          <span>Usuario</span>
          <input type="text" :value="currentUser?.username ?? ''" disabled />
        </label>
        <label>
          <span>Nombre visible</span>
          <input v-model="displayName" type="text" maxlength="90" autocomplete="name" />
        </label>
        <button type="submit" :disabled="savingProfile">Guardar nombre</button>
      </form>

      <form class="security-panel" @submit.prevent="requestEmailChange">
        <header>
          <span>correo</span>
          <strong>Mail de contacto</strong>
        </header>
        <label>
          <span>Nuevo correo</span>
          <input v-model="email" type="email" maxlength="190" autocomplete="email" />
        </label>
        <label>
          <span>Contraseña actual</span>
          <input v-model="emailPassword" type="password" autocomplete="current-password" />
        </label>
        <button type="submit" :disabled="requestingEmail">Enviar código</button>

        <div class="verification-box">
          <label>
            <span>Código de seguridad</span>
            <input v-model="emailCode" type="text" inputmode="numeric" autocomplete="one-time-code" />
          </label>
          <button type="button" :disabled="!emailPending || !emailCode.trim() || confirmingEmail" @click="confirmEmailChange">
            Confirmar correo
          </button>
        </div>
      </form>

      <form class="security-panel" @submit.prevent="changePassword">
        <header>
          <span>contraseña</span>
          <strong>Cambio de acceso</strong>
        </header>
        <label>
          <span>Contraseña actual</span>
          <input v-model="currentPassword" type="password" autocomplete="current-password" />
        </label>
        <label>
          <span>Nueva contraseña</span>
          <input v-model="newPassword" type="password" minlength="8" autocomplete="new-password" />
        </label>
        <label>
          <span>Confirmar contraseña</span>
          <input v-model="repeatPassword" type="password" minlength="8" autocomplete="new-password" />
        </label>
        <button type="submit" :disabled="!canChangePassword || changingPassword">Cambiar contraseña</button>
      </form>
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
.security-panel header span,
.security-panel label span {
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

.account-alert.ok {
  border-color: #8fdcc9;
  color: #d6fff6;
  background: rgba(37, 108, 91, 0.2);
}

.security-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--compact-gap);
  align-items: start;
}

.security-panel {
  display: grid;
  gap: 0.68rem;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.78rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent 36%),
    var(--color-surface);
}

.security-panel header {
  display: grid;
  gap: 0.2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.58rem;
}

.security-panel header strong {
  font-size: 1rem;
  font-weight: 950;
  text-transform: uppercase;
}

.security-panel label {
  display: grid;
  gap: 0.26rem;
}

.security-panel input {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(125, 190, 255, 0.22);
  border-radius: 7px;
  padding: 0.58rem 0.68rem;
  color: #eef8ff;
  background: rgba(1, 8, 16, 0.58);
}

.security-panel input:disabled {
  opacity: 0.68;
}

.security-panel button {
  min-height: 42px;
  border: 1px solid rgba(155, 214, 255, 0.48);
  border-radius: 7px;
  padding: 0.5rem 0.92rem;
  color: #06111f;
  background: linear-gradient(180deg, #a7ddff, #4b9de8);
  font-weight: 950;
}

.verification-box {
  display: grid;
  gap: 0.56rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.68rem;
}

@media (max-width: 1080px) {
  .security-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .account-view {
    padding: var(--space-page) 0;
  }

  .account-hero,
  .security-grid {
    margin-inline: var(--space-page);
  }
}
</style>
