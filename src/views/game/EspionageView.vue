<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import type { ActionDto, CorruptionSchemeDto, ResourceCostDto } from '@/types/game'

const session = useSessionStore()
const route = useRoute()

const state = computed(() => session.state)
const currentWorldCode = computed(() => {
  const routeCode = route.params.worldCode
  return typeof routeCode === 'string' && routeCode.length ? routeCode : 'iberia-beta-1'
})
const schemes = computed(() => state.value?.corruptionSchemes ?? [])
const resources = computed(() => state.value?.resources ?? [])
const resourceAmounts = computed(() => new Map(resources.value.map((resource) => [resource.code, resource.amount])))
const schemeByCode = computed(() => new Map(schemes.value.map((scheme) => [scheme.code, scheme])))
const espionageActions = computed(() =>
  [...(state.value?.actions ?? [])]
    .filter((action) => action.actionType === 'CORRUPTION')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
      return Date.parse(b.resolvesAt || b.startedAt) - Date.parse(a.resolvesAt || a.startedAt)
    }),
)
const pendingActions = computed(() => espionageActions.value.filter((action) => action.status === 'pending'))
const resolvedActions = computed(() => espionageActions.value.filter((action) => action.status === 'resolved'))
const averageRisk = computed(() => {
  if (!schemes.value.length) return 0
  return Math.round(schemes.value.reduce((total, scheme) => total + scheme.baseRiskPercent, 0) / schemes.value.length)
})
const lowestRiskScheme = computed(() =>
  [...schemes.value].sort((a, b) => a.baseRiskPercent - b.baseRiskPercent || a.durationSeconds - b.durationSeconds)[0],
)

function resourceName(code: string) {
  return resources.value.find((resource) => resource.code === code)?.name ?? code
}

function costLabel(costs: ResourceCostDto[]) {
  if (!costs.length) return 'Sin coste'
  return costs.map((cost) => `${cost.amount.toLocaleString('es-ES')} ${resourceName(cost.code)}`).join(' · ')
}

function hasEnough(costs: ResourceCostDto[]) {
  return costs.every((cost) => (resourceAmounts.value.get(cost.code) ?? 0) >= cost.amount)
}

function secondsLabel(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

function actionTitle(action: ActionDto) {
  const scheme = action.schemeCode ? schemeByCode.value.get(action.schemeCode) : null
  return action.resultTitle ?? scheme?.name ?? 'Operación clasificada'
}

function actionBody(action: ActionDto) {
  const scheme = action.schemeCode ? schemeByCode.value.get(action.schemeCode) : null
  return action.resultBody ?? scheme?.description ?? 'Dossier interno en curso.'
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

async function launchScheme(scheme: CorruptionSchemeDto) {
  if (!hasEnough(scheme.costs)) return
  await session.actions.corruption(scheme.code)
}
</script>

<template>
  <section v-if="state" class="espionage-view">
    <section class="panel command-panel">
      <div>
        <p class="muted">Operaciones discretas</p>
        <h1>Espionaje</h1>
        <p class="lead">
          Activa expedientes, filtraciones y maniobras de despacho midiendo siempre coste, riesgo y recompensa.
        </p>
      </div>
      <button class="app-button secondary" :disabled="session.loading" @click="() => session.refresh(currentWorldCode)">
        Actualizar
      </button>
    </section>

    <section class="intel-summary" aria-label="Resumen de espionaje">
      <article class="summary-card">
        <span>En curso</span>
        <strong>{{ pendingActions.length }}</strong>
        <small>{{ resolvedActions.length }} resueltas</small>
      </article>
      <article class="summary-card">
        <span>Dossieres</span>
        <strong>{{ schemes.length }}</strong>
        <small>Operaciones disponibles</small>
      </article>
      <article class="summary-card">
        <span>Riesgo medio</span>
        <strong>{{ averageRisk }}%</strong>
        <small>Antes de modificadores</small>
      </article>
      <article class="summary-card">
        <span>Más discreta</span>
        <strong>{{ lowestRiskScheme?.baseRiskPercent ?? 0 }}%</strong>
        <small>{{ lowestRiskScheme?.name ?? 'Sin dossier' }}</small>
      </article>
    </section>

    <section class="espionage-layout">
      <article class="panel schemes-panel">
        <header class="section-title">
          <div>
            <p class="muted">Catálogo operativo</p>
            <h2>Dossieres disponibles</h2>
          </div>
        </header>

        <div v-if="!schemes.length" class="empty-state">
          <strong>No hay operaciones de espionaje configuradas.</strong>
          <span>Cuando el servidor publique dossieres aparecerán aquí.</span>
        </div>

        <div v-else class="scheme-list">
          <article v-for="scheme in schemes" :key="scheme.code" class="scheme-row">
            <div class="scheme-main">
              <span class="status-chip">{{ scheme.baseRiskPercent }}% riesgo</span>
              <h3>{{ scheme.name }}</h3>
              <p>{{ scheme.description }}</p>
              <small>{{ scheme.rewardLabel }}</small>
            </div>

            <dl class="scheme-metrics">
              <div>
                <dt>Coste</dt>
                <dd>{{ costLabel(scheme.costs) }}</dd>
              </div>
              <div>
                <dt>Duración</dt>
                <dd>{{ secondsLabel(scheme.durationSeconds) }}</dd>
              </div>
              <div>
                <dt>Si sale mal</dt>
                <dd>{{ scheme.caughtLabel }}</dd>
              </div>
            </dl>

            <button
              class="app-button"
              :disabled="session.loading || !hasEnough(scheme.costs)"
              @click="launchScheme(scheme)"
            >
              Lanzar
            </button>
          </article>
        </div>
      </article>

      <aside class="side-stack">
        <article class="panel operations-panel">
          <h2>Operaciones</h2>
          <div v-if="!espionageActions.length" class="empty-state compact">
            <strong>Sin actividad.</strong>
            <span>Aún no hay expedientes abiertos.</span>
          </div>
          <div v-else class="operation-list">
            <article
              v-for="action in espionageActions"
              :key="action.id"
              class="operation-row"
              :class="{ resolved: action.status === 'resolved' }"
            >
              <span>{{ action.status === 'pending' ? 'En curso' : 'Resuelta' }}</span>
              <strong>{{ actionTitle(action) }}</strong>
              <p>{{ actionBody(action) }}</p>
              <small v-if="action.status === 'pending'">Resolución {{ formatDate(action.resolvesAt) }}</small>
              <small v-else>Resuelta {{ formatDate(action.resolvedAt) }}</small>
            </article>
          </div>
        </article>

        <article class="panel protocol-panel">
          <h2>Protocolo</h2>
          <p>Prioriza operaciones de riesgo bajo cuando tus recursos estén justos y reserva las maniobras caras para ventanas decisivas.</p>
        </article>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.espionage-view,
.espionage-layout,
.scheme-list,
.side-stack,
.operation-list,
.operations-panel,
.protocol-panel {
  display: grid;
  gap: var(--compact-gap);
}

.command-panel,
.schemes-panel,
.side-stack > .panel {
  padding: var(--compact-panel-padding);
}

.command-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap);
  align-items: end;
}

.command-panel h1,
.section-title h2,
.scheme-main h3,
.operations-panel h2,
.protocol-panel h2 {
  margin: 0;
}

.lead,
.scheme-main p,
.scheme-main small,
.operation-row p,
.operation-row small,
.protocol-panel p,
.empty-state,
.summary-card small {
  color: var(--color-muted);
}

.lead,
.protocol-panel p {
  max-width: 760px;
  margin: 0;
}

.intel-summary {
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

.summary-card span {
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.summary-card strong {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: clamp(1.28rem, 1.8vw, 1.85rem);
  font-variant-numeric: tabular-nums;
  font-weight: 950;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.espionage-layout {
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.34fr);
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
}

.empty-state.compact {
  padding: 0.62rem;
}

.empty-state strong {
  color: var(--color-text);
}

.scheme-row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(280px, 0.72fr) auto;
  gap: var(--compact-gap);
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding: var(--compact-gap) 0;
}

.scheme-main {
  display: grid;
  gap: var(--compact-gap-sm);
  min-width: 0;
}

.scheme-main p,
.scheme-main small {
  margin: 0;
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

.scheme-metrics {
  display: grid;
  gap: 0.42rem;
  margin: 0;
}

.scheme-metrics div {
  display: grid;
  gap: 0.08rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.44rem;
  background: var(--color-surface-soft);
}

.scheme-metrics dt,
.scheme-metrics dd {
  margin: 0;
}

.scheme-metrics dt {
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  text-transform: uppercase;
}

.scheme-metrics dd {
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 850;
}

.operation-row {
  display: grid;
  gap: 0.24rem;
  border-top: 1px solid var(--color-border);
  padding: 0.62rem 0;
}

.operation-row.resolved {
  opacity: 0.76;
}

.operation-row span {
  width: fit-content;
  border-radius: var(--radius-sm);
  padding: 0.16rem 0.34rem;
  color: var(--color-accent);
  background: var(--color-surface-soft);
  font-size: 0.66rem;
  font-weight: 950;
  text-transform: uppercase;
}

.operation-row strong {
  color: var(--color-text);
}

.operation-row p {
  margin: 0;
}

@media (max-width: 1080px) {
  .command-panel,
  .espionage-layout,
  .scheme-row {
    grid-template-columns: 1fr;
  }

  .intel-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .intel-summary {
    grid-template-columns: 1fr;
  }
}
</style>
