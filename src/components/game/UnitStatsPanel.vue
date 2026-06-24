<script setup lang="ts">
interface UnitStatsSource {
  role?: string
  attack: number
  attackTypeLabel: string
  transportType?: string | null
  transportTypeLabel?: string | null
  defenseBureaucratic: number
  defenseIncisive: number
  defenseMedia: number
  slots: number
  trainingSeconds: number
}

defineProps<{
  unit: UnitStatsSource
  dense?: boolean
}>()

function secondsLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`
}

function lowerLabel(value: string) {
  return value.toLocaleLowerCase('es-ES')
}

function isTransportUnit(unit: UnitStatsSource) {
  return Boolean(unit.transportType || unit.role?.toLocaleLowerCase('es-ES').startsWith('transporte'))
}

function primaryStatLabel(unit: UnitStatsSource) {
  return isTransportUnit(unit) ? 'Tipo de transporte' : `Ataque ${lowerLabel(unit.attackTypeLabel)}`
}

function primaryStatValue(unit: UnitStatsSource) {
  if (!isTransportUnit(unit)) return unit.attack
  return lowerLabel(unit.transportTypeLabel ?? unit.transportType ?? 'transporte')
}
</script>

<template>
  <section class="unit-stats-panel" :class="{ dense }" aria-label="Estadísticas de unidad">
    <h5>Estadísticas</h5>

    <dl class="stats-grid">
      <div class="stat-column stat-column-main">
        <div class="stat-item">
          <dt>{{ primaryStatLabel(unit) }}</dt>
          <dd>
            <strong>{{ primaryStatValue(unit) }}</strong>
          </dd>
        </div>
        <div class="stat-item">
          <dt>Plazas</dt>
          <dd>
            <strong>{{ unit.slots }}</strong>
          </dd>
        </div>
        <div class="stat-item">
          <dt>Tiempo</dt>
          <dd>
            <strong>{{ secondsLabel(unit.trainingSeconds) }}</strong>
          </dd>
        </div>
      </div>

      <div class="stat-column stat-column-defense">
        <div class="stat-item">
          <dt>Defensa burocrática</dt>
          <dd>
            <strong>{{ unit.defenseBureaucratic }}</strong>
          </dd>
        </div>
        <div class="stat-item">
          <dt>Defensa incisiva</dt>
          <dd>
            <strong>{{ unit.defenseIncisive }}</strong>
          </dd>
        </div>
        <div class="stat-item">
          <dt>Defensa mediática</dt>
          <dd>
            <strong>{{ unit.defenseMedia }}</strong>
          </dd>
        </div>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.unit-stats-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.22rem;
  height: 100%;
  min-width: 0;
}

.unit-stats-panel h5 {
  min-height: 1rem;
  margin: 0;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1;
  text-transform: uppercase;
}

.stats-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--compact-gap-sm);
  height: 100%;
  min-width: 0;
  margin: 0;
}

.stat-column {
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 0.1rem;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.28rem;
  background: var(--color-surface-soft);
}

.stat-column-main {
  border-color: var(--color-border);
}

.stat-column-defense {
  border-color: var(--color-border);
}

.stat-item {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) auto;
  gap: 0.24rem;
  align-items: center;
  min-width: 0;
  min-height: 2.06rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.12rem 0.04rem;
}

.stat-item:last-child {
  border-bottom: 0;
}

dt {
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.12;
  text-transform: uppercase;
}

dd {
  display: grid;
  justify-items: end;
  min-width: 0;
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
  text-align: right;
}

dd strong {
  color: var(--color-text);
  font-size: 1.02rem;
  font-weight: 950;
}

.dense {
  gap: 0.2rem;
}

.dense .stat-column {
  border-radius: var(--radius-md);
  padding: 0.22rem;
}

.dense .stat-item {
  min-height: 2.06rem;
}

@media (max-width: 420px) {
  .stats-grid {
    gap: 0.38rem;
  }

  .stat-column {
    padding: 0.3rem;
  }

  dt {
    font-size: 0.58rem;
  }

  dd strong {
    font-size: 0.9rem;
  }

}
</style>
