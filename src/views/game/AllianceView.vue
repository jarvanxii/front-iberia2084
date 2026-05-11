<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const allianceName = ref('')
const allianceCode = ref('')
const allianceDescription = ref('')
const joinCode = ref('')
const chatBody = ref('')

const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)
const scores = computed(() => state.value?.allianceScores ?? [])
const partyScores = computed(() =>
  scores.value.filter((score) => score.factionName === player.value?.faction.name),
)

async function createAlliance() {
  await session.actions.createAlliance(allianceName.value, allianceCode.value, allianceDescription.value)
  allianceName.value = ''
  allianceCode.value = ''
  allianceDescription.value = ''
}

async function joinAlliance() {
  await session.actions.joinAlliance(joinCode.value)
  joinCode.value = ''
}

async function sendMessage() {
  await session.actions.message(chatBody.value)
  chatBody.value = ''
}
</script>

<template>
  <section v-if="state && player" class="alliance-view">
    <article class="panel alliance-hero">
      <p class="muted">Alianza política</p>
      <h2>{{ player.alliance?.name ?? 'Sin alianza' }}</h2>
      <p>
        Las alianzas son comités internos del mismo partido. Aquí se reparten provincias, se pactan campañas y se
        decide qué compañero se come el marrón con mejor sonrisa.
      </p>
    </article>

    <section class="alliance-layout">
      <article class="panel chat-panel">
        <h2>Chat de estrategia</h2>
        <div v-if="!player.alliance" class="empty">Primero entra en una alianza de tu partido.</div>
        <form v-else class="chat-form" @submit.prevent="sendMessage">
          <input v-model="chatBody" placeholder="Mensaje para la ejecutiva..." required />
          <button class="app-button">Enviar</button>
        </form>
        <div class="messages">
          <article v-for="message in state.allianceMessages" :key="message.id">
            <strong>{{ message.author }}</strong>
            <p>{{ message.body }}</p>
          </article>
        </div>
      </article>

      <aside class="side-stack">
        <article v-if="!player.alliance" class="panel forms-panel">
          <h2>Crear alianza</h2>
          <form @submit.prevent="createAlliance">
            <input v-model="allianceName" placeholder="Nombre" required />
            <input v-model="allianceCode" placeholder="Código" required maxlength="16" />
            <input v-model="allianceDescription" placeholder="Manifiesto interno" required />
            <button class="app-button">Crear</button>
          </form>
        </article>

        <article v-if="!player.alliance" class="panel forms-panel">
          <h2>Unirse</h2>
          <form @submit.prevent="joinAlliance">
            <input v-model="joinCode" placeholder="Código de alianza" required maxlength="16" />
            <button class="app-button secondary">Unirse</button>
          </form>
        </article>

        <article class="panel score-panel">
          <h2>Puntuación de alianzas</h2>
          <div v-for="score in scores" :key="score.id" class="score-row">
            <span :style="{ background: score.factionColor }"></span>
            <div>
              <strong>{{ score.name }}</strong>
              <small>{{ score.factionName }} · {{ score.members }} miembros · {{ score.territories }} territorios</small>
            </div>
            <em>{{ score.score.toLocaleString('es-ES') }}</em>
          </div>
        </article>

        <article class="panel score-panel">
          <h2>Tu partido</h2>
          <div v-if="!partyScores.length" class="empty">Aún no hay ranking interno. Momento perfecto para mandar.</div>
          <div v-for="score in partyScores" :key="score.id" class="score-row">
            <span :style="{ background: score.factionColor }"></span>
            <div>
              <strong>{{ score.name }}</strong>
              <small>{{ score.totalVotes.toLocaleString('es-ES') }} votos</small>
            </div>
            <em>{{ score.troopPower.toLocaleString('es-ES') }}</em>
          </div>
        </article>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.alliance-view,
.side-stack,
.forms-panel form,
.chat-form,
.messages {
  display: grid;
  gap: var(--compact-gap);
}

.alliance-hero,
.chat-panel,
.forms-panel,
.score-panel {
  padding: var(--compact-panel-padding);
}

.alliance-hero h2,
.chat-panel h2,
.forms-panel h2,
.score-panel h2 {
  margin: 0;
}

.alliance-hero p:last-child {
  max-width: 850px;
  color: var(--color-muted);
  line-height: 1.38;
}

.alliance-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.42fr);
  gap: var(--compact-gap);
}

.chat-form {
  grid-template-columns: minmax(0, 1fr) auto;
}

input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.58rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.messages article,
.score-row {
  border-top: 1px solid var(--color-border);
  padding: 0.5rem 0;
}

.messages p {
  margin: 0.18rem 0 0;
  color: var(--color-muted);
}

.score-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--compact-gap);
  align-items: center;
}

.score-row span {
  width: 9px;
  height: 24px;
  border-radius: var(--radius-sm);
}

.score-row strong,
.score-row small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-row small,
.empty {
  color: var(--color-subtle);
}

.score-row em {
  color: var(--color-accent-strong);
  font-style: normal;
  font-weight: 900;
}

@media (max-width: 1000px) {
  .alliance-layout,
  .chat-form {
    grid-template-columns: 1fr;
  }
}
</style>
