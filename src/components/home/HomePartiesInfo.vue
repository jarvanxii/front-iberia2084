<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FactionDto } from '@/types/game'
import { partyLogo } from '@/utils/partyLogos'
import { partyPortrait } from '@/utils/partyPortraits'

const props = defineProps<{
  factions: FactionDto[]
  currentFactionCode: string
}>()

type SortMode = 'partido' | 'riesgo' | 'region'

interface PartyProfile {
  style: string
  bonuses: string[]
  tempo: string
  pressure: string
}

const sortMode = ref<SortMode>('partido')

const factionSummary = computed(() => {
  const risky = props.factions.filter((faction) => faction.corruptionAffinity >= 7)
  const safe = props.factions.filter((faction) => faction.corruptionAffinity <= 4)
  const regions = new Set(props.factions.map((faction) => faction.startingRegion))
  const averageRisk = props.factions.length
    ? Math.round(props.factions.reduce((total, faction) => total + faction.corruptionAffinity, 0) / props.factions.length)
    : 0

  return {
    total: props.factions.length,
    regions: regions.size,
    risky: risky.length,
    safe: safe.length,
    averageRisk,
  }
})

const currentFaction = computed(() =>
  props.factions.find((faction) => faction.code === props.currentFactionCode) ?? null,
)
const safestFaction = computed(() =>
  [...props.factions].sort((a, b) => a.corruptionAffinity - b.corruptionAffinity)[0] ?? null,
)
const riskiestFaction = computed(() =>
  [...props.factions].sort((a, b) => b.corruptionAffinity - a.corruptionAffinity)[0] ?? null,
)

const orderedFactions = computed(() => {
  const currentCode = props.currentFactionCode
  return [...props.factions].sort((a, b) => {
    if (a.code === currentCode) return -1
    if (b.code === currentCode) return 1
    if (sortMode.value === 'riesgo') return b.corruptionAffinity - a.corruptionAffinity || a.name.localeCompare(b.name)
    if (sortMode.value === 'region') return a.startingRegion.localeCompare(b.startingRegion) || a.name.localeCompare(b.name)
    return a.name.localeCompare(b.name)
  })
})

const sortOptions: Array<{ key: SortMode; label: string }> = [
  { key: 'partido', label: 'Partido' },
  { key: 'riesgo', label: 'Riesgo' },
  { key: 'region', label: 'Región' },
]

function factionProfile(faction: FactionDto): PartyProfile {
  const profiles: Record<string, PartyProfile> = {
    pp: {
      style: 'Gestión conservadora, caja seria y defensa sólida.',
      bonuses: ['Pesetas', 'Favores', 'Defensa'],
      tempo: 'Resistente',
      pressure: 'Aguanta bien partidas largas y castiga el error rival.',
    },
    pisoe: {
      style: 'Relato progresista, votos constantes y control de agenda.',
      bonuses: ['Votos', 'Pesetas', 'Pactos'],
      tempo: 'Constante',
      pressure: 'Gana valor si encadena recursos y negociación territorial.',
    },
    gil: {
      style: 'Ladrillo veloz, pesetas rápidas y espectáculo municipal.',
      bonuses: ['Pesetas', 'Favores', 'Expansión'],
      tempo: 'Explosivo',
      pressure: 'Quiere crecer pronto antes de que la factura política pese.',
    },
    puff: {
      style: 'Movilización social, defensa de calle y bronca organizada.',
      bonuses: ['Votos', 'Favores', 'Resistencia'],
      tempo: 'Reactivo',
      pressure: 'Funciona mejor cuando el mapa se vuelve incómodo.',
    },
    vox: {
      style: 'Presión frontal, voto ruidoso y moral de balcón.',
      bonuses: ['Votos', 'Pesetas', 'Choque'],
      tempo: 'Agresivo',
      pressure: 'Conviene jugar directo: menos floritura y más empuje.',
    },
    junts: {
      style: 'Pactismo territorial, favores caros y control de bisagra.',
      bonuses: ['Favores', 'Pesetas', 'Negociación'],
      tempo: 'Táctico',
      pressure: 'Saca partido de cada frontera y de cada pacto estrecho.',
    },
  }

  return (
    profiles[faction.code] ?? {
      style: 'Partido híbrido pendiente de doctrina oficial.',
      bonuses: ['Adaptación', 'Margen', 'Sorpresa'],
      tempo: 'Flexible',
      pressure: 'Debe encontrar una ventaja clara en los primeros turnos.',
    }
  )
}

function corruptionRiskLabel(value: number) {
  if (value >= 9) return 'Alto'
  if (value >= 5) return 'Medio'
  return 'Bajo'
}

function riskClass(value: number) {
  if (value >= 9) return 'high'
  if (value >= 5) return 'medium'
  return 'low'
}

function riskPercent(value: number) {
  return `${Math.round((value / 12) * 100)}%`
}
</script>

<template>
  <section class="parties-guide">
    <header class="parties-hero">
      <div class="parties-title">
        <p class="muted">Partidos jugables</p>
        <h2>Partidos</h2>
      </div>

      <dl class="parties-metrics" aria-label="Resumen de partidos">
        <div>
          <dt>Total</dt>
          <dd>{{ factionSummary.total }}</dd>
        </div>
        <div>
          <dt>Regiones</dt>
          <dd>{{ factionSummary.regions }}</dd>
        </div>
        <div>
          <dt>Riesgo alto</dt>
          <dd>{{ factionSummary.risky }}</dd>
        </div>
        <div>
          <dt>Riesgo bajo</dt>
          <dd>{{ factionSummary.safe }}</dd>
        </div>
        <div>
          <dt>Media</dt>
          <dd>{{ factionSummary.averageRisk }}/12</dd>
        </div>
      </dl>
    </header>

    <section class="party-dashboard">
      <article
        class="focus-party"
        :class="{ empty: !currentFaction }"
        :style="{ '--focus-color': currentFaction?.color ?? 'var(--color-accent)' }"
      >
        <template v-if="currentFaction">
          <img class="focus-portrait" :src="partyPortrait(currentFaction.code)" :alt="currentFaction.name" />
          <div class="focus-copy">
            <span>Tu partido</span>
            <h3>{{ currentFaction.name }}</h3>
            <p>{{ factionProfile(currentFaction).pressure }}</p>
          </div>
        </template>
        <template v-else>
          <div class="focus-copy">
            <span>Sin partido activo</span>
            <h3>Elige partida para fijar partido</h3>
            <p>Mientras tanto puedes comparar estilos, regiones iniciales y afinidad de riesgo.</p>
          </div>
        </template>
      </article>

      <article class="insight-card">
        <span>Más estable</span>
        <strong>{{ safestFaction?.shortName ?? 'N/A' }}</strong>
        <p>{{ safestFaction?.name ?? 'Pendiente' }}</p>
      </article>

      <article class="insight-card">
        <span>Más arriesgado</span>
        <strong>{{ riskiestFaction?.shortName ?? 'N/A' }}</strong>
        <p>{{ riskiestFaction?.name ?? 'Pendiente' }}</p>
      </article>

      <div class="sort-control" aria-label="Ordenar partidos">
        <button
          v-for="option in sortOptions"
          :key="option.key"
          type="button"
          :class="{ active: sortMode === option.key }"
          @click="sortMode = option.key"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <div class="party-list">
      <article
        v-for="faction in orderedFactions"
        :key="faction.code"
        class="party-row"
        :class="{ current: currentFactionCode === faction.code }"
        :style="{ '--faction': faction.color }"
      >
        <aside class="party-media">
          <img class="party-portrait" :src="partyPortrait(faction.code)" :alt="faction.name" loading="lazy" />
          <div class="party-emblem">
            <img v-if="partyLogo(faction.code)" :src="partyLogo(faction.code)" :alt="`Logo de ${faction.name}`" />
            <span v-else>{{ faction.shortName.slice(0, 2) }}</span>
          </div>
        </aside>

        <div class="party-main">
          <div class="party-kicker">
            <span>{{ faction.shortName }}</span>
            <em>{{ faction.startingRegion }}</em>
            <strong v-if="currentFactionCode === faction.code">Actual</strong>
          </div>
          <h3>{{ faction.name }}</h3>
          <p class="motto">{{ faction.motto }}</p>
          <p>{{ faction.satire }}</p>
        </div>

        <section class="party-profile" aria-label="Perfil jugable">
          <span>Estilo</span>
          <strong>{{ factionProfile(faction).style }}</strong>
          <div class="party-bonuses">
            <em v-for="bonus in factionProfile(faction).bonuses" :key="bonus">{{ bonus }}</em>
          </div>
        </section>

        <section class="party-risk" :class="riskClass(faction.corruptionAffinity)" aria-label="Riesgo">
          <div>
            <span>Riesgo</span>
            <strong>{{ corruptionRiskLabel(faction.corruptionAffinity) }}</strong>
          </div>
          <div>
            <span>Afinidad</span>
            <strong>{{ faction.corruptionAffinity }}/12</strong>
          </div>
          <div class="risk-meter" aria-hidden="true">
            <i :style="{ width: riskPercent(faction.corruptionAffinity) }"></i>
          </div>
          <p>{{ factionProfile(faction).tempo }}</p>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.parties-guide {
  display: grid;
  gap: var(--compact-gap);
  scroll-margin-top: calc(var(--home-header-height) + var(--space-page));
}

.parties-hero {
  display: grid;
  grid-template-columns: minmax(240px, 0.55fr) minmax(560px, 1fr);
  gap: var(--compact-gap);
  align-items: end;
  min-width: 0;
}

.parties-title h2,
.focus-copy h3,
.party-main h3 {
  margin: 0;
  color: var(--color-text);
  line-height: 1.05;
}

.parties-title h2 {
  font-size: clamp(1.7rem, 4vw, 3.05rem);
  font-weight: 950;
}

.parties-title p {
  margin: 0 0 0.16rem;
  font-weight: 850;
}

.parties-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
  min-width: 0;
  margin: 0;
}

.parties-metrics div,
.insight-card {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background: var(--color-surface);
}

.parties-metrics dt,
.insight-card span,
.focus-copy span,
.party-profile span,
.party-risk span {
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.parties-metrics dd,
.insight-card strong {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 950;
}

.party-dashboard {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(150px, 0.32fr) minmax(150px, 0.32fr) minmax(240px, 0.48fr);
  gap: var(--compact-gap);
  align-items: stretch;
  min-width: 0;
}

.focus-party {
  position: relative;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  min-height: 92px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--focus-color) 62%, var(--color-border));
  border-left: 5px solid var(--focus-color);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.focus-party.empty {
  grid-template-columns: 1fr;
}

.focus-portrait {
  width: 88px;
  height: 100%;
  object-fit: cover;
}

.focus-copy {
  display: grid;
  align-content: center;
  gap: var(--space-1);
  min-width: 0;
  padding: var(--compact-card-padding);
}

.focus-copy span {
  color: var(--focus-color);
}

.focus-copy h3 {
  overflow-wrap: anywhere;
  font-size: 1.25rem;
}

.focus-copy p,
.insight-card p,
.party-main p,
.party-risk p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.34;
}

.insight-card {
  align-content: center;
}

.insight-card p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sort-control {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.28rem;
  background: var(--color-surface);
}

.sort-control button {
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.34rem 0.4rem;
  color: var(--color-muted);
  background: transparent;
  font-size: 0.76rem;
  font-weight: 900;
}

.sort-control button:hover,
.sort-control button.active {
  border-color: var(--color-accent);
  color: var(--color-on-accent);
  background: var(--color-accent);
}

.party-list {
  display: grid;
  gap: var(--compact-gap);
  min-width: 0;
}

.party-row {
  display: grid;
  grid-template-columns: 104px minmax(250px, 1.05fr) minmax(250px, 0.9fr) minmax(180px, 0.48fr);
  gap: var(--compact-gap);
  align-items: stretch;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-left: 5px solid var(--faction);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--faction) 13%, transparent), transparent 38%),
    var(--color-surface);
}

.party-row.current {
  border-color: color-mix(in srgb, var(--faction) 72%, var(--color-accent));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--faction) 35%, transparent);
}

.party-media {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.party-portrait {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 104px;
  object-fit: cover;
}

.party-emblem {
  position: absolute;
  right: 0.44rem;
  bottom: 0.44rem;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--faction) 55%, var(--color-border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
}

.party-emblem img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.party-emblem span {
  color: var(--color-text);
  font-weight: 950;
}

.party-main,
.party-profile,
.party-risk {
  display: grid;
  align-content: center;
  gap: var(--compact-gap-sm);
  min-width: 0;
}

.party-kicker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  align-items: center;
  min-width: 0;
}

.party-kicker span,
.party-kicker em,
.party-kicker strong,
.party-bonuses em {
  border: 1px solid color-mix(in srgb, var(--faction) 54%, var(--color-border));
  border-radius: var(--radius-sm);
  padding: 0.16rem 0.34rem;
  color: color-mix(in srgb, var(--faction) 82%, var(--color-text));
  background: color-mix(in srgb, var(--faction) 10%, var(--color-surface));
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 950;
}

.party-kicker strong {
  color: var(--color-on-accent);
  background: var(--color-accent);
}

.party-main h3 {
  overflow-wrap: anywhere;
  font-size: 1.18rem;
}

.party-main .motto {
  color: var(--color-accent);
  font-weight: 900;
}

.party-main p:not(.motto) {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.party-profile {
  border-left: 1px solid var(--color-border);
  padding-left: var(--compact-gap);
}

.party-profile span,
.party-risk span {
  color: var(--color-accent);
}

.party-profile strong {
  color: var(--color-text);
  line-height: 1.35;
}

.party-bonuses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  min-width: 0;
}

.party-risk {
  align-content: stretch;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background: var(--color-surface-soft);
}

.party-risk > div:not(.risk-meter) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--compact-gap-sm);
  align-items: center;
}

.party-risk strong {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.risk-meter {
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
}

.risk-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-success);
}

.party-risk.medium .risk-meter i {
  background: var(--color-accent);
}

.party-risk.high .risk-meter i {
  background: var(--color-danger);
}

.party-risk p {
  color: var(--color-text);
  font-weight: 900;
}

@media (max-width: 1180px) {
  .parties-hero,
  .party-dashboard {
    grid-template-columns: 1fr;
  }

  .parties-metrics {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .party-row {
    grid-template-columns: 118px minmax(0, 1fr) minmax(250px, 0.9fr);
  }

  .party-risk {
    grid-column: 2 / -1;
  }
}

@media (max-width: 820px) {
  .parties-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .party-row {
    grid-template-columns: 104px minmax(0, 1fr);
  }

  .party-profile,
  .party-risk {
    grid-column: 1 / -1;
  }

  .party-profile {
    border-left: 0;
    border-top: 1px solid var(--color-border);
    padding: var(--compact-gap) 0 0;
  }
}

@media (max-width: 560px) {
  .parties-metrics,
  .sort-control {
    grid-template-columns: 1fr;
  }

  .focus-party,
  .party-row {
    grid-template-columns: 1fr;
  }

  .focus-portrait {
    display: none;
  }

  .party-media {
    aspect-ratio: 16 / 9;
  }

  .party-portrait {
    min-height: 150px;
  }
}
</style>
