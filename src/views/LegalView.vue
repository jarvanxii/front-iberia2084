<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/services/api'

interface LegalPage {
  kicker: string
  title: string
  intro: string
  links: Array<{ route: string; label: string }>
  sections: Array<{ title: string; paragraphs: string[] }>
}

const route = useRoute()
const ownerEmail = 'JarvanXII@gmail.com'
const brandLogo = `${import.meta.env.BASE_URL}logo-iberia84.png`

const contactBusy = ref(false)
const contactFeedback = ref('')
const contactFeedbackTone = ref<'neutral' | 'success' | 'error'>('neutral')
const contactForm = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '',
})

const pages: Record<string, LegalPage> = {
  privacy: {
    kicker: 'Privacidad',
    title: 'Política de privacidad',
    intro: 'Aquí se resume qué datos usa Iberia 2084, para qué los usa y cómo puedes contactar.',
    links: [
      { route: 'terms', label: 'Términos del servicio' },
      { route: 'contact', label: 'Contacto' },
    ],
    sections: [
      {
        title: 'Responsable y contacto',
        paragraphs: [
          'Iberia 2084 es una aplicación privada de simulación estratégica con partidos, provincias y situaciones ficticias.',
          'Para dudas sobre privacidad, seguridad o acceso, usa la página de contacto.',
        ],
      },
      {
        title: 'Datos que se tratan',
        paragraphs: [
          'La plataforma puede guardar usuario, nombre visible, email, proveedor de acceso, fechas de alta y último acceso, y permisos de usuario.',
          'También se guarda la información necesaria para mantener tus partidas: mundo, partido elegido, provincia, recursos, acciones, edificios y mensajes de alianza.',
        ],
      },
      {
        title: 'Finalidad',
        paragraphs: [
          'Los datos se usan para iniciar sesión, proteger la cuenta, recuperar el acceso y mantener el progreso de juego.',
        ],
      },
      {
        title: 'Cookies y datos locales',
        paragraphs: [
          'Iberia 2084 usa cookies técnicas y datos locales del navegador para mantener la sesión, recordar preferencias y mostrar avisos necesarios.',
          'No se usan cookies publicitarias ni seguimiento comercial.',
        ],
      },
      {
        title: 'Conservación y seguridad',
        paragraphs: [
          'Los datos se conservan mientras la cuenta exista o mientras sean necesarios por seguridad.',
          'Las contraseñas no se guardan en texto claro y los códigos temporales caducan.',
        ],
      },
      {
        title: 'Comunicaciones por email',
        paragraphs: [
          'Iberia 2084 puede enviarte correos necesarios para crear la cuenta, verificar el acceso o recuperar la contraseña.',
          'No se usan estos correos para marketing.',
        ],
      },
      {
        title: 'Derechos del usuario',
        paragraphs: [
          'Puedes pedir revisión, corrección o baja de tus datos desde la página de contacto.',
          'Si se elimina la cuenta, puede perderse el acceso a la plataforma y a las partidas asociadas.',
        ],
      },
    ],
  },
  terms: {
    kicker: 'Condiciones',
    title: 'Términos del servicio',
    intro: 'Estas condiciones explican el uso permitido de Iberia 2084 mientras la plataforma evoluciona.',
    links: [
      { route: 'privacy', label: 'Política de privacidad' },
      { route: 'contact', label: 'Contacto' },
    ],
    sections: [
      {
        title: 'Objeto del servicio',
        paragraphs: [
          'Iberia 2084 es una simulación estratégica por provincias con partidos, recursos, alianzas, eventos y acciones de juego.',
          'La aplicación está pensada para entretenimiento, pruebas y desarrollo de la experiencia.',
        ],
      },
      {
        title: 'Ficción y sátira',
        paragraphs: [
          'Los partidos, instituciones, territorios, personajes y situaciones son ficticios.',
          'El juego no representa a entidades, cargos ni personas reales.',
        ],
      },
      {
        title: 'Estado de desarrollo',
        paragraphs: [
          'Iberia 2084 está en desarrollo activo. Algunas funciones pueden cambiar, no estar disponibles o necesitar autorización manual.',
          'El acceso con proveedores externos se activará de forma progresiva.',
        ],
      },
      {
        title: 'Cuentas y permisos',
        paragraphs: [
          'Las cuentas nuevas pueden necesitar aprobación antes de acceder a todas las funciones.',
          'Los permisos pueden ajustarse o retirarse cuando sea necesario.',
        ],
      },
      {
        title: 'Uso aceptable',
        paragraphs: [
          'Cuida tus credenciales, no compartas tokens y cierra sesión cuando uses equipos compartidos.',
          'No uses la plataforma para dañar el servicio, automatizar abuso o acceder a datos que no te corresponden.',
        ],
      },
      {
        title: 'Disponibilidad',
        paragraphs: [
          'Durante el desarrollo puede haber interrupciones o errores.',
          'Las partidas, reglas y datos de prueba pueden cambiar mientras se ajusta el juego.',
        ],
      },
      {
        title: 'Cambios',
        paragraphs: [
          'Estas condiciones pueden actualizarse cuando cambie la plataforma.',
          'El uso continuado implica aceptar la versión publicada en iberia2084.com.',
        ],
      },
    ],
  },
  contact: {
    kicker: '',
    title: 'Contacto',
    intro: 'Para consultas sobre privacidad, acceso, seguridad o uso autorizado de Iberia 2084.',
    links: [
      { route: 'privacy', label: 'Política de privacidad' },
      { route: 'terms', label: 'Términos del servicio' },
    ],
    sections: [],
  },
}

const defaultPage: LegalPage = pages.privacy!
const page = computed<LegalPage>(() => pages[String(route.name)] ?? defaultPage)
const showContactForm = computed(() => route.name === 'contact')
const showLegalMeta = computed(() => route.name !== 'contact')

watch(
  () => route.name,
  () => {
    contactFeedback.value = ''
    contactFeedbackTone.value = 'neutral'
  },
)

async function submitContact() {
  if (contactBusy.value) return

  contactFeedback.value = ''
  contactFeedbackTone.value = 'neutral'

  if (!contactForm.email || !contactForm.message) {
    contactFeedback.value = 'Introduce tu email y un mensaje para poder enviar la consulta.'
    contactFeedbackTone.value = 'error'
    return
  }

  contactBusy.value = true

  try {
    await api.contact({ ...contactForm })
    contactFeedback.value = 'Mensaje enviado. Te responderé en cuanto pueda revisarlo.'
    contactFeedbackTone.value = 'success'
    contactForm.name = ''
    contactForm.email = ''
    contactForm.subject = ''
    contactForm.message = ''
    contactForm.website = ''
  } catch (unknownError) {
    contactFeedback.value =
      unknownError instanceof Error ? unknownError.message : 'No se pudo enviar el mensaje. Revisa el email e inténtalo de nuevo.'
    contactFeedbackTone.value = 'error'
  } finally {
    contactBusy.value = false
  }
}
</script>

<template>
  <main class="legal-page">
    <section class="legal-shell" aria-labelledby="legal-title">
      <article class="legal-card">
        <nav class="legal-topbar" aria-label="Navegación legal">
          <RouterLink :to="{ name: 'access' }" class="legal-brand" aria-label="Volver al login">
            <img :src="brandLogo" alt="Iberia 2084" />
            <span>Iberia 2084</span>
          </RouterLink>

          <RouterLink :to="{ name: 'access' }" class="legal-access-link">Acceso</RouterLink>
        </nav>

        <header class="legal-header">
          <span v-if="page.kicker" class="section-kicker">{{ page.kicker }}</span>
          <h1 id="legal-title">{{ page.title }}</h1>
          <p>{{ page.intro }}</p>
          <div v-if="showLegalMeta" class="legal-meta">
            <small>Última actualización: 25/06/2026</small>
            <a :href="`mailto:${ownerEmail}`">{{ ownerEmail }}</a>
          </div>
        </header>

        <div class="legal-content">
          <section
            v-for="(section, index) in page.sections"
            :id="`legal-section-${index}`"
            :key="section.title"
            class="legal-section"
          >
            <h2>{{ section.title }}</h2>
            <div class="legal-section-copy">
              <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
            </div>
          </section>

          <section v-if="showContactForm" class="legal-contact" aria-labelledby="contact-title">
            <div class="legal-contact-copy">
              <h2 id="contact-title">Enviar mensaje</h2>
              <p>
                Escribe a <a :href="`mailto:${ownerEmail}`">{{ ownerEmail }}</a> o usa el formulario.
              </p>
              <p>No envíes contraseñas, tokens ni claves privadas.</p>
            </div>

            <form class="legal-contact-form" @submit.prevent="submitContact">
              <label class="legal-field" for="contact-name">
                <span>Nombre</span>
                <input
                  id="contact-name"
                  v-model.trim="contactForm.name"
                  autocomplete="name"
                  maxlength="120"
                  placeholder="Tu nombre"
                  type="text"
                />
              </label>

              <label class="legal-field" for="contact-email">
                <span>Email</span>
                <input
                  id="contact-email"
                  v-model.trim="contactForm.email"
                  autocomplete="email"
                  inputmode="email"
                  maxlength="320"
                  placeholder="tu@email.com"
                  required
                  type="email"
                />
              </label>

              <label class="legal-field legal-field--wide" for="contact-subject">
                <span>Asunto</span>
                <input
                  id="contact-subject"
                  v-model.trim="contactForm.subject"
                  maxlength="160"
                  placeholder="Consulta sobre Iberia 2084"
                  type="text"
                />
              </label>

              <label class="legal-field legal-field--wide" for="contact-message">
                <span>Mensaje</span>
                <textarea
                  id="contact-message"
                  v-model.trim="contactForm.message"
                  maxlength="3000"
                  placeholder="Describe tu consulta."
                  required
                  rows="6"
                ></textarea>
              </label>

              <input
                v-model.trim="contactForm.website"
                aria-hidden="true"
                autocomplete="off"
                class="contact-honeypot"
                tabindex="-1"
                type="text"
              />

              <div class="legal-contact-actions">
                <p
                  v-if="contactFeedback"
                  class="legal-contact-feedback"
                  :class="`legal-contact-feedback--${contactFeedbackTone}`"
                  role="status"
                >
                  {{ contactFeedback }}
                </p>
                <button class="legal-contact-submit" type="submit" :disabled="contactBusy">
                  {{ contactBusy ? 'Enviando' : 'Enviar mensaje' }}
                </button>
              </div>
            </form>
          </section>
        </div>

        <footer class="legal-footer">
          <RouterLink :to="{ name: 'access' }">Volver al login</RouterLink>
          <RouterLink v-for="link in page.links" :key="link.route" :to="{ name: link.route }">
            {{ link.label }}
          </RouterLink>
        </footer>
      </article>
    </section>
  </main>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  color: var(--color-text);
  background:
    radial-gradient(circle at 18% 10%, rgba(85, 166, 232, 0.11), transparent 24rem),
    linear-gradient(180deg, rgba(4, 12, 22, 0.08), rgba(4, 12, 22, 0.42)),
    linear-gradient(90deg, rgba(175, 205, 232, 0.012) 1px, transparent 1px),
    var(--color-bg);
  background-size: auto, auto, 56px 56px, auto;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.legal-page,
.legal-page * {
  box-sizing: border-box;
  letter-spacing: 0;
}

.legal-shell {
  display: grid;
  width: min(100%, 940px);
  margin: 0 auto;
  padding: clamp(18px, 3vw, 42px) clamp(14px, 3vw, 28px) 54px;
}

.legal-card {
  display: grid;
  gap: 0;
  overflow: hidden;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-border));
  border-radius: 6px;
  background:
    radial-gradient(circle at 0 0, rgba(85, 166, 232, 0.06), transparent 18rem),
    linear-gradient(145deg, rgba(139, 208, 255, 0.035), transparent 34%),
    var(--color-surface);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(0, 0, 0, 0.28);
}

.legal-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px clamp(18px, 3vw, 30px);
  border-bottom: 1px solid rgba(176, 184, 194, 0.13);
  background: rgba(3, 7, 10, 0.3);
}

.legal-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 900;
  text-decoration: none;
}

.legal-brand img {
  display: block;
  width: 42px;
  height: 42px;
  border-radius: 8px;
}

.legal-brand span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legal-access-link,
.legal-footer a {
  min-height: 34px;
  padding: 9px 12px;
  border: 1px solid rgba(176, 184, 194, 0.16);
  border-radius: 4px;
  background: rgba(8, 12, 17, 0.34);
  color: #cbd7e5;
  font-size: 0.78rem;
  font-weight: 820;
  text-decoration: none;
}

.legal-access-link:hover,
.legal-footer a:hover,
.legal-footer a.router-link-active {
  border-color: color-mix(in srgb, var(--color-accent) 52%, white);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent-strong);
}

.legal-header {
  display: grid;
  gap: 10px;
  padding: clamp(26px, 4vw, 42px) clamp(20px, 4vw, 42px);
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.section-kicker {
  color: var(--color-accent-strong);
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.legal-header h1,
.legal-section h2,
.legal-contact h2,
.legal-header p,
.legal-section p,
.legal-contact p {
  margin: 0;
}

.legal-header h1 {
  max-width: 720px;
  color: var(--color-text);
  font-size: clamp(2.05rem, 4.5vw, 3.55rem);
  line-height: 1.04;
}

.legal-header > p {
  max-width: 720px;
  color: #d8e1eb;
  font-size: clamp(1rem, 1.5vw, 1.1rem);
  line-height: 1.66;
}

.legal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  margin-top: 6px;
  color: #8ea2b7;
  font-size: 0.86rem;
}

.legal-meta small {
  color: inherit;
  font-size: inherit;
}

.legal-meta a,
.legal-contact a {
  color: var(--color-accent-strong);
  font-weight: 820;
  text-decoration: none;
}

.legal-meta a:hover,
.legal-contact a:hover {
  color: #d8f0ff;
}

.legal-content {
  display: grid;
  padding: clamp(20px, 3vw, 34px) clamp(20px, 4vw, 42px);
}

.legal-section {
  display: grid;
  grid-template-columns: minmax(150px, 0.34fr) minmax(0, 1fr);
  gap: clamp(14px, 3vw, 28px);
  align-items: start;
  padding: 21px 0;
  border-top: 1px solid rgba(176, 184, 194, 0.12);
}

.legal-section:first-child {
  padding-top: 0;
  border-top: 0;
}

.legal-section h2 {
  color: var(--color-accent-strong);
  font-size: 0.9rem;
  font-weight: 900;
  text-transform: uppercase;
}

.legal-section-copy {
  display: grid;
  gap: 9px;
}

.legal-section p,
.legal-contact p {
  color: #cbd5e1;
  font-size: 1rem;
  line-height: 1.66;
}

.legal-contact {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
  gap: clamp(18px, 3vw, 30px);
  align-items: start;
  margin-top: 0;
  padding: clamp(18px, 2.5vw, 26px);
  border: 1px solid rgba(176, 184, 194, 0.15);
  border-radius: 6px;
  background: rgba(8, 12, 17, 0.46);
}

.legal-contact-copy {
  display: grid;
  gap: 8px;
}

.legal-contact h2 {
  color: var(--color-text);
  font-size: 1.12rem;
  line-height: 1.25;
}

.legal-contact-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.legal-field {
  display: grid;
  gap: 6px;
}

.legal-field--wide,
.legal-contact-actions {
  grid-column: 1 / -1;
}

.legal-field span {
  color: #e5edf6;
  font-size: 0.82rem;
  font-weight: 850;
}

.legal-field input,
.legal-field textarea {
  width: 100%;
  border: 1px solid rgba(176, 184, 194, 0.24);
  border-radius: 4px;
  background: rgba(2, 6, 10, 0.62);
  color: var(--color-text);
  font: inherit;
  font-size: 0.94rem;
  outline: none;
}

.legal-field input {
  min-height: 42px;
  padding: 0 12px;
}

.legal-field textarea {
  min-height: 132px;
  padding: 11px 12px;
  resize: vertical;
}

.legal-field input::placeholder,
.legal-field textarea::placeholder {
  color: #71859b;
}

.legal-field input:focus,
.legal-field textarea:focus {
  border-color: color-mix(in srgb, var(--color-accent) 58%, white);
  box-shadow: 0 0 0 3px rgba(85, 166, 232, 0.16);
}

.contact-honeypot {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.legal-contact-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.legal-contact-feedback {
  margin: 0;
  color: #aebdcd;
  font-size: 0.88rem;
  font-weight: 760;
}

.legal-contact-feedback--success {
  color: #72e4aa;
}

.legal-contact-feedback--error {
  color: #ff9f9f;
}

.legal-contact-submit {
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 72%, white);
  border-radius: 4px;
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
  color: var(--color-on-accent);
  font-weight: 900;
}

.legal-contact-submit:disabled {
  cursor: wait;
  filter: grayscale(0.35);
  opacity: 0.72;
}

.legal-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 clamp(20px, 4vw, 42px);
  padding: 18px 0 clamp(20px, 3vw, 28px);
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 16%, transparent);
}

@media (max-width: 820px) {
  .legal-shell {
    padding: 0;
  }

  .legal-card {
    min-height: 100vh;
    min-height: 100svh;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .legal-topbar {
    padding: 13px 16px;
  }

  .legal-brand img {
    width: 38px;
    height: 38px;
  }

  .legal-access-link {
    min-height: 34px;
    padding-inline: 12px;
    white-space: nowrap;
  }

  .legal-header {
    padding: 24px 18px 22px;
  }

  .legal-header h1 {
    font-size: clamp(1.9rem, 9vw, 2.7rem);
  }

  .legal-content {
    padding: 22px 18px 28px;
  }

  .legal-section {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 20px 0;
  }

  .legal-contact {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .legal-contact-form,
  .legal-contact-actions {
    grid-template-columns: 1fr;
  }

  .legal-contact-submit {
    width: 100%;
  }

  .legal-footer {
    margin: 0 18px;
  }
}

@media (max-width: 480px) {
  .legal-meta,
  .legal-footer {
    display: grid;
  }

  .legal-footer {
    gap: 8px;
  }

  .legal-footer a {
    min-height: 36px;
    text-align: center;
  }
}
</style>
