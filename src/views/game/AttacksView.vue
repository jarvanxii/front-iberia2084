<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import type { ActionDto } from '@/types/game'

const session = useSessionStore()
const route = useRoute()

const state = computed(() => session.state)
const currentWorldCode = computed(() => {
  const routeCode = route.params.worldCode
  return typeof routeCode === 'string' && routeCode.length ? routeCode : 'iberia-beta-1'
})
const territoriesById = computed(() => new Map((state.value?.territories ?? []).map((territory) => [territory.id, territory])))
const offensiveActions = computed(() =>
  [...(state.value?.actions ?? [])]
    .filter((action) => action.actionType === 'CONQUEST' || action.actionType === 'INFLUENCE')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
      return Date.parse(b.resolvesAt || b.startedAt) - Date.parse(a.resolvesAt || a.startedAt)
    }),
)
const pendingActions = computed(() => offensiveActions.value.filter((action) => action.status === 'pending'))
const resolvedActions = computed(() => offensiveActions.value.filter((action) => action.status === 'resolved'))
const troops = computed(() => state.value?.troops ?? [])
const troopCount = computed(() => troops.value.reduce((total, troop) => total + troop.amount, 0))
const attackPower = computed(() =>
  troops.value.reduce((total, troop) => total + troop.amount * Math.max(0, troop.attack), 0),
)
const influencePower = computed(() =>
  troops.value.reduce((total, troop) => total + troop.amount * Math.max(0, troop.influence), 0),
)
const averageSuccess = computed(() => {
  if (!pendingActions.value.length) return 0
  const total = pendingActions.value.reduce((sum, action) => sum + action.successPercent, 0)
  return Math.round(total / pendingActions.value.length)
})

function actionKind(action: ActionDto) {
  return action.actionType === 'CONQUEST' ? 'Ataque territorial' : 'Presión política'
}

function actionTitle(action: ActionDto) {
  const territory = action.targetTerritoryId ? territoriesById.value.get(action.targetTerritoryId) : null
  return territory?.name ?? 'Objetivo sin identificar'
}

function actionDescription(action: ActionDto) {
  if (action.resultTitle) return action.resultTitle
  if (action.actionType === 'CONQUEST') return 'Operación de captura abierta desde el mapa provincial.'
  return 'Operación para erosionar el control político de la provincia.'
}

function statusLabel(action: ActionDto) {
  return action.status === 'pending' ? 'En curso' : 'Resuelta'
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <section v-if="state" class="attacks-view">
    <section class="panel attack-command">
      <div class="attack-command-copy">
        <p class="muted">Operaciones ofensivas</p>
        <h1>Ataques</h1>
        <p>
          Revisa ataques territoriales y campañas de presión activas, con riesgo, probabilidad de éxito y resolución.
        </p>
      </div>
      <div class="attack-command-actions">
        <RouterLink class="app-button" :to="{ name: 'gameMap', params: { worldCode: currentWorldCode } }">
          Abrir mapa
        </RouterLink>
        <RouterLink class="app-button secondary" :to="{ name: 'gameTroops', params: { worldCode: currentWorldCode } }">
          Revisar tropas
        </RouterLink>
      </div>
    </section>

    <section class="attack-summary" aria-label="Resumen de ataques">
      <article class="summary-card">
        <span>En curso</span>
        <strong>{{ pendingActions.length }}</strong>
        <small>{{ resolvedActions.length }} resueltas</small>
      </article>
      <article class="summary-card">
        <span>Éxito medio</span>
        <strong>{{ averageSuccess }}%</strong>
        <small>Solo operaciones activas</small>
      </article>
      <article class="summary-card">
        <span>Potencia</span>
        <strong>{{ attackPower.toLocaleString('es-ES') }}</strong>
        <small>{{ troopCount.toLocaleString('es-ES') }} tropas en reserva</small>
      </article>
      <article class="summary-card">
        <span>Influencia</span>
        <strong>{{ influencePower.toLocaleString('es-ES') }}</strong>
        <small>Capacidad política móvil</small>
      </article>
    </section>

    <section class="attacks-layout">
      <article class="panel attack-list-panel">
        <header class="section-title">
          <div>
            <p class="muted">Historial táctico</p>
            <h2>Operaciones</h2>
          </div>
          <button class="app-button secondary" :disabled="session.loading" @click="() => session.refresh(currentWorldCode)">
            Actualizar
          </button>
        </header>

        <div v-if="!offensiveActions.length" class="empty-state">
          <strong>No hay ataques registrados.</strong>
          <span>Selecciona una provincia en el mapa para iniciar una operación ofensiva.</span>
        </div>

        <div v-else class="operation-list">
          <article
            v-for="action in offensiveActions"
            :key="action.id"
            class="operation-row"
            :class="{ resolved: action.status === 'resolved' }"
          >
            <div class="operation-main">
              <span class="status-chip">{{ actionKind(action) }}</span>
              <h3>{{ actionTitle(action) }}</h3>
              <p>{{ actionDescription(action) }}</p>
            </div>

            <div class="operation-metrics" aria-label="Métricas de operación">
              <span>
                <strong>{{ action.successPercent }}%</strong>
                <small>Éxito</small>
              </span>
              <span>
                <strong>{{ action.riskPercent }}%</strong>
                <small>Riesgo</small>
              </span>
              <span>
                <strong>{{ statusLabel(action) }}</strong>
                <small>Estado</small>
              </span>
            </div>

            <div class="operation-timeline">
              <small>Inicio {{ formatDate(action.startedAt) }}</small>
              <small v-if="action.status === 'pending'">Resolución {{ formatDate(action.resolvesAt) }}</small>
              <small v-else>Resuelta {{ formatDate(action.resolvedAt) }}</small>
            </div>

            <p v-if="action.resultBody" class="operation-result">{{ action.resultBody }}</p>
          </article>
        </div>
      </article>

      <aside class="side-stack">
        <article class="panel readiness-panel">
          <h2>Preparación</h2>
          <div class="readiness-row">
            <span>Tropas disponibles</span>
            <strong>{{ troopCount.toLocaleString('es-ES') }}</strong>
          </div>
          <div class="readiness-row">
            <span>Ataque total</span>
            <strong>{{ attackPower.toLocaleString('es-ES') }}</strong>
          </div>
          <div class="readiness-row">
            <span>Influencia total</span>
            <strong>{{ influencePower.toLocaleString('es-ES') }}</strong>
          </div>
        </article>

        <article class="panel guidance-panel">
          <h2>Siguiente paso</h2>
          <p>
            Usa el mapa para elegir provincia, valorar defensa y lanzar el tipo de operación con mayor probabilidad de
            éxito.
          </p>
          <RouterLink class="app-button secondary" :to="{ name: 'gameMap', params: { worldCode: currentWorldCode } }">
            Ir al mapa
          </RouterLink>
        </article>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.attacks-view,
.attack-command-copy,
.attack-command-actions,
.attacks-layout,
.operation-list,
.side-stack,
.readiness-panel,
.guidance-panel {
  display: grid;
  gap: var(--compact-gap);
}

.attack-command,
.attack-list-panel,
.side-stack > .panel {
  padding: var(--compact-panel-padding);
}

.attack-command {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.attack-command h1,
.section-title h2,
.operation-main h3,
.readiness-panel h2,
.guidance-panel h2 {
  margin: 0;
}

.attack-command p {
  max-width: 760px;
  margin: 0;
  color: var(--color-muted);
}

.attack-command-actions {
  grid-template-columns: repeat(2, max-content);
}

.attack-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--compact-gap);
}

.summary-card {
  display: grid;
  gap: 0.18rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 80%),
    var(--color-surface);
}

.summary-card span,
.summary-card small,
.operation-timeline,
.readiness-row span,
.guidance-panel p {
  color: var(--color-muted);
}

.summary-card span {
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.summary-card strong {
  color: var(--color-text);
  font-size: clamp(1.45rem, 2vw, 2rem);
  font-variant-numeric: tabular-nums;
  font-weight: 950;
  line-height: 1;
}

.attacks-layout {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.34fr);
  align-items: start;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--compact-gap);
  margin-bottom: var(--compact-gap);
}

.empty-state {
  display: grid;
  gap: var(--compact-gap-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background: var(--color-surface-soft);
  color: var(--color-muted);
}

.empty-state strong {
  color: var(--color-text);
}

.operation-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 0.72fr) minmax(170px, 0.38fr);
  gap: var(--compact-gap);
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding: var(--compact-gap) 0;
}

.operation-row.resolved {
  opacity: 0.78;
}

.operation-main {
  display: grid;
  gap: var(--compact-gap-sm);
  min-width: 0;
}

.operation-main p,
.operation-result {
  margin: 0;
  color: var(--color-muted);
}

.status-chip {
  width: fit-content;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.22rem 0.42rem;
  background: var(--color-surface-soft);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 950;
}

.operation-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.42rem;
}

.operation-metrics span {
  display: grid;
  gap: 0.1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.44rem;
  background: var(--color-surface-soft);
}

.operation-metrics strong {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operation-metrics small {
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.operation-timeline {
  display: grid;
  gap: 0.28rem;
  font-size: 0.78rem;
  font-weight: 850;
}

.operation-result {
  grid-column: 1 / -1;
  border-left: 3px solid var(--color-accent);
  padding-left: 0.62rem;
}

.readiness-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap);
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding: 0.55rem 0;
}

.readiness-row strong {
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.guidance-panel p {
  margin: 0;
}

@media (max-width: 1060px) {
  .attack-command,
  .attacks-layout,
  .operation-row {
    grid-template-columns: 1fr;
  }

  .attack-command-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attack-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .attack-command-actions,
  .attack-summary,
  .operation-metrics,
  .section-title {
    grid-template-columns: 1fr;
  }

  .section-title {
    display: grid;
  }
}
</style>
