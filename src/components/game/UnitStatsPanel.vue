<script setup lang="ts">
interface UnitStatsSource {
  attack: number
  attackTypeLabel: string
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
</script>

<template>
  <dl class="unit-stats-panel" :class="{ dense }">
    <div class="stat-column stat-column-main">
      <div class="stat-item">
        <dt>Ataque</dt>
        <dd>
          <strong>{{ unit.attack }}</strong>
          <span>{{ unit.attackTypeLabel }}</span>
        </dd>
      </div>
      <div class="stat-item">
        <dt>Plazas</dt>
        <dd>
          <strong>{{ unit.slots }}</strong>
          <span>ocupación</span>
        </dd>
      </div>
      <div class="stat-item">
        <dt>Tiempo</dt>
        <dd>
          <strong>{{ secondsLabel(unit.trainingSeconds) }}</strong>
          <span>generación</span>
        </dd>
      </div>
    </div>

    <div class="stat-column stat-column-defense">
      <div class="stat-item">
        <dt>Burocrática</dt>
        <dd>
          <strong>{{ unit.defenseBureaucratic }}</strong>
          <span>defensa</span>
        </dd>
      </div>
      <div class="stat-item">
        <dt>Incisiva</dt>
        <dd>
          <strong>{{ unit.defenseIncisive }}</strong>
          <span>defensa</span>
        </dd>
      </div>
      <div class="stat-item">
        <dt>Mediática</dt>
        <dd>
          <strong>{{ unit.defenseMedia }}</strong>
          <span>defensa</span>
        </dd>
      </div>
    </div>
  </dl>
</template>

<style scoped>
.unit-stats-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--compact-gap-sm);
  min-width: 0;
  margin: 0;
}

.stat-column {
  display: grid;
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
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.24rem;
  align-items: center;
  min-width: 0;
  min-height: 1.82rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.12rem 0.04rem;
}

.stat-item:last-child {
  border-bottom: 0;
}

dt {
  overflow: hidden;
  color: var(--color-accent);
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.05;
  text-overflow: ellipsis;
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

dd span {
  color: var(--color-muted);
  font-size: 0.62rem;
  font-weight: 850;
}

.dense {
  gap: 0.24rem;
}

.dense .stat-column {
  border-radius: var(--radius-md);
  padding: 0.22rem;
}

.dense .stat-item {
  min-height: 1.68rem;
}

@media (max-width: 420px) {
  .unit-stats-panel {
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

  dd span {
    font-size: 0.56rem;
  }
}
</style>
