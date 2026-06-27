<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import type { ResearchDefinitionDto, ResourceCostDto, TroopDefinitionDto } from '@/types/game'
import { buildingImage } from '@/utils/buildingImages'
import { eventImage } from '@/utils/eventImages'
import { comparePartyCodes, sortByPartyOrder } from '@/utils/partyOrder'
import { partyLogo } from '@/utils/partyLogos'
import { researchImage } from '@/utils/researchImages'
import { resourceIcon } from '@/utils/resourceIcons'
import { troopPortrait } from '@/utils/troopPortraits'

type TopicKey =
  | 'resumen'
  | 'partidas'
  | 'recursos'
  | 'unidades'
  | 'transportes'
  | 'edificios'
  | 'investigaciones'
  | 'eventos'
  | 'partidos'
  | 'provincias'
  | 'ministerios'
  | 'riesgos'

interface TopicDefinition {
  key: TopicKey
  label: string
  eyebrow: string
  description: string
}

const session = useSessionStore()
const route = useRoute()

const topics: TopicDefinition[] = [
  {
    key: 'resumen',
    label: 'Resumen',
    eyebrow: 'Base',
    description: 'Cómo se lee Iberia 2084 sin entrar en datos de ninguna partida concreta.',
  },
  {
    key: 'partidas',
    label: 'Partidas',
    eyebrow: 'Mundos',
    description: 'Reglas generales de plazas, velocidad, dificultad y permanencia.',
  },
  {
    key: 'recursos',
    label: 'Recursos',
    eyebrow: 'Economía',
    description: 'Para qué sirve cada recurso y qué decisiones empuja.',
  },
  {
    key: 'unidades',
    label: 'Unidades',
    eyebrow: 'Cuartel',
    description: 'Tropas comunes y especiales por partido, con coste, tiempo y estadísticas base.',
  },
  {
    key: 'transportes',
    label: 'Transportes',
    eyebrow: 'Movimiento',
    description: 'Medios terrestres, marítimos y aéreos. No atacan: mueven unidades.',
  },
  {
    key: 'edificios',
    label: 'Edificios',
    eyebrow: 'Provincia',
    description: 'Infraestructura común de una provincia, sus usos, desbloqueos y costes base.',
  },
  {
    key: 'investigaciones',
    label: 'Investigaciones',
    eyebrow: 'Mejoras',
    description: 'Investigaciones comunes y especiales por partido, siempre como catálogo general.',
  },
  {
    key: 'eventos',
    label: 'Eventos',
    eyebrow: 'Crisis',
    description: 'Eventos globales que pueden afectar a todos los jugadores.',
  },
  {
    key: 'partidos',
    label: 'Partidos',
    eyebrow: 'Política',
    description: 'Partidos ficticios, lemas y personalidad jugable.',
  },
  {
    key: 'provincias',
    label: 'Provincias',
    eyebrow: 'Mapa',
    description: 'Catálogo territorial: una ciudad equivale a una capital de provincia.',
  },
  {
    key: 'ministerios',
    label: 'Ministerios',
    eyebrow: 'Estado',
    description: 'Instituciones generales y sus bonificaciones, sin control actual de partida.',
  },
  {
    key: 'riesgos',
    label: 'Riesgos',
    eyebrow: 'Opaco',
    description: 'Operaciones arriesgadas y planes de respuesta ante crisis.',
  },
]

const topicKeys = topics.map((topic) => topic.key)
const activeTopic = ref<TopicKey>(topicFromRoute())

const state = computed(() => session.state)
const resources = computed(() => state.value?.resources ?? [])
const factions = computed(() => sortByPartyOrder(state.value?.factions ?? []))
const troopDefinitions = computed(() =>
  [...(state.value?.troopDefinitions ?? [])].sort(
    (a, b) =>
      (a.factionCode ? 1 : 0) - (b.factionCode ? 1 : 0) ||
      comparePartyCodes(a.factionCode, b.factionCode) ||
      a.tier - b.tier ||
      a.name.localeCompare(b.name, 'es'),
  ),
)
const combatUnits = computed(() => troopDefinitions.value.filter((unit) => !isTransportUnit(unit)))
const transportUnits = computed(() => troopDefinitions.value.filter(isTransportUnit))
const buildings = computed(() =>
  [...(state.value?.buildingDefinitions ?? [])].sort(
    (a, b) => a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es'),
  ),
)
const researchDefinitions = computed(() =>
  [...(state.value?.researchDefinitions ?? [])].sort(
    (a, b) =>
      (a.factionCode ? 1 : 0) - (b.factionCode ? 1 : 0) ||
      comparePartyCodes(a.factionCode, b.factionCode) ||
      a.category.localeCompare(b.category, 'es') ||
      a.name.localeCompare(b.name, 'es'),
  ),
)
const eventDefinitions = computed(() =>
  [...(state.value?.eventDefinitions ?? [])].sort(
    (a, b) => a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es'),
  ),
)
const territories = computed(() =>
  [...(state.value?.territories ?? [])].sort(
    (a, b) => a.region.localeCompare(b.region, 'es') || a.name.localeCompare(b.name, 'es'),
  ),
)
const ministries = computed(() =>
  [...(state.value?.ministries ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es')),
)
const corruptionSchemes = computed(() => state.value?.corruptionSchemes ?? [])
const disasterPlans = computed(() => state.value?.disasterPlans ?? [])
const currentTopic = computed(
  () => topics.find((topic) => topic.key === activeTopic.value) ?? topics[0]!,
)

const resourcePurpose: Record<string, { usage: string; tension: string }> = {
  pesetas: {
    usage: 'Construcción, entrenamiento, investigaciones y acciones que necesitan caja.',
    tension: 'Aceleran el crecimiento, pero no sustituyen la defensa política.',
  },
  votos: {
    usage: 'Presión territorial, legitimidad ofensiva y músculo público.',
    tension: 'Sirven para empujar el mapa; gastarlos sin plan deja la retaguardia floja.',
  },
  favores: {
    usage: 'Atajos, pactos, defensa delicada y operaciones con letra pequeña.',
    tension:
      'Son potentes, escasos y peligrosos cuando todo el mundo empieza a pedir explicaciones.',
  },
  influencia: {
    usage: 'Capacidad de condicionar decisiones sin ocupar directamente.',
    tension: 'Funciona mejor como presión sostenida que como golpe aislado.',
  },
  funcionarios: {
    usage: 'Burocracia disponible para edificios, defensas y planes largos.',
    tension: 'Sin estructura administrativa, las promesas se quedan en rueda de prensa.',
  },
  escanos: {
    usage: 'Peso institucional para ministerios, pactos y desbloqueos políticos.',
    tension: 'No ganan una provincia solos, pero cambian qué herramientas puedes activar.',
  },
}

function topicCount(key: TopicKey) {
  const counts: Record<TopicKey, number | string> = {
    resumen: 'Manual',
    partidas: 'Reglas',
    recursos: resources.value.length,
    unidades: combatUnits.value.length,
    transportes: transportUnits.value.length,
    edificios: buildings.value.length,
    investigaciones: researchDefinitions.value.length,
    eventos: eventDefinitions.value.length,
    partidos: factions.value.length,
    provincias: territories.value.length,
    ministerios: ministries.value.length,
    riesgos: corruptionSchemes.value.length + disasterPlans.value.length,
  }
  return counts[key]
}

function isTransportUnit(unit: TroopDefinitionDto) {
  return Boolean(unit.transportType)
}

function resourceName(code: string) {
  return resources.value.find((resource) => resource.code === code)?.name ?? code
}

function costLabel(costs: ResourceCostDto[]) {
  if (!costs.length) return 'Sin coste'
  return costs
    .map((cost) => `${cost.amount.toLocaleString('es-ES')} ${resourceName(cost.code)}`)
    .join(' · ')
}

function researchCostLabel(item: ResearchDefinitionDto) {
  return [
    `${item.costPesetas.toLocaleString('es-ES')} pesetas`,
    `${item.costVotos.toLocaleString('es-ES')} votos`,
    `${item.costFavores.toLocaleString('es-ES')} favores`,
  ].join(' · ')
}

function secondsLabel(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

function buildingLabel(code: string) {
  return buildings.value.find((building) => building.code === code)?.name ?? code.replace(/_/g, ' ')
}

function unitAccent(unit: TroopDefinitionDto) {
  if (unit.factionColor) return unit.factionColor
  if (unit.transportType) return 'var(--color-success)'
  if (unit.attackType === 'INCISIVE') return 'var(--color-danger)'
  if (unit.attackType === 'MEDIA') return 'var(--color-info)'
  return 'var(--color-accent)'
}

function topicFromRoute(): TopicKey {
  const queryTopic = typeof route.query.tema === 'string' ? route.query.tema : ''
  return topicKeys.includes(queryTopic as TopicKey) ? (queryTopic as TopicKey) : 'resumen'
}

watch(
  () => route.query.tema,
  () => {
    activeTopic.value = topicFromRoute()
  },
)
</script>

<template>
  <section v-if="state" class="iberopedia-view">
    <section class="iberopedia-shell">
      <aside class="iberopedia-sidebar" aria-label="Índice de Iberopedia">
        <strong>Índice</strong>
        <nav>
          <button
            v-for="topic in topics"
            :key="topic.key"
            type="button"
            :class="{ active: activeTopic === topic.key }"
            @click="activeTopic = topic.key"
          >
            <span>{{ topic.eyebrow }}</span>
            <strong>{{ topic.label }}</strong>
            <em>{{ topicCount(topic.key) }}</em>
          </button>
        </nav>
      </aside>

      <main class="iberopedia-content">
        <header class="topic-header">
          <span>{{ currentTopic.eyebrow }}</span>
          <h3>{{ currentTopic.label }}</h3>
          <p>{{ currentTopic.description }}</p>
        </header>

        <section v-if="activeTopic === 'resumen'" class="manual-copy">
          <p>
            Iberia 2084 se juega provincia a provincia. Cada hueco del mapa representa una capital
            de provincia y solo puede pertenecer a un jugador dentro de una partida. No se nombran
            ciudades manualmente porque el mapa ya las define.
          </p>
          <p>
            El bucle principal es sencillo: produces recursos, mejoras edificios, entrenas unidades,
            te mueves por el mapa y decides cuándo asumir riesgos. Las pantallas de catálogo
            explican herramientas; las pantallas de partida muestran estado real.
          </p>
          <ol class="manual-rules">
            <li>Construye edificios para desbloquear producción, unidades y planes.</li>
            <li>Entrena tropas para atacar, ocupar o defender provincias.</li>
            <li>Usa transportes para mover unidades; el ataque no depende del transporte.</li>
            <li>Investiga mejoras comunes o especiales de tu partido.</li>
            <li>
              Gestiona crisis y corrupción mirando siempre coste, duración, riesgo y consecuencia.
            </li>
          </ol>
        </section>

        <section v-else-if="activeTopic === 'partidas'" class="manual-copy">
          <p>
            Una partida es un mundo persistente con velocidad, dificultad y plazas limitadas por
            provincias. La velocidad se expresa como ratio, por ejemplo x1 o x1,5, y afecta a cómo
            se sienten colas, acciones y ritmo.
          </p>
          <p>
            La dificultad no es un nivel del jugador: define la dureza de los bots y de la presión
            del mundo. Una misma cuenta puede estar en dos partidas distintas, pero cada provincia
            solo admite un propietario.
          </p>
          <ul class="manual-rules">
            <li>Una ciudad equivale a una capital de provincia.</li>
            <li>Una provincia solo puede pertenecer a un jugador por partida.</li>
            <li>
              La invitación a un amigo reserva un hueco libre del mapa, no comparte tus datos
              privados.
            </li>
          </ul>
        </section>

        <section v-else-if="activeTopic === 'recursos'" class="entry-list">
          <article
            v-for="resource in resources"
            :key="resource.code"
            class="entry-row resource-entry"
          >
            <figure class="entry-media square">
              <img :src="resourceIcon(resource.code)" :alt="resource.name" loading="lazy" />
            </figure>
            <header class="entry-copy">
              <span>{{ resource.code }}</span>
              <h4>{{ resource.name }}</h4>
              <p>{{ resource.description }}</p>
            </header>
            <dl class="entry-facts">
              <dt>Uso</dt>
              <dd>
                {{ resourcePurpose[resource.code]?.usage ?? 'Recurso común pendiente de afinar.' }}
              </dd>
              <dt>Tensión</dt>
              <dd>
                {{
                  resourcePurpose[resource.code]?.tension ??
                  'Debe tener una consecuencia clara en partida.'
                }}
              </dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'unidades'" class="entry-list">
          <article
            v-for="unit in combatUnits"
            :key="unit.code"
            class="entry-row unit-entry"
            :style="{ '--entry-accent': unitAccent(unit) }"
          >
            <figure class="entry-media square">
              <img :src="troopPortrait(unit.imageKey)" :alt="unit.name" loading="lazy" />
            </figure>
            <header class="entry-copy">
              <span
                >{{ unit.factionShortName ? `Especial ${unit.factionShortName}` : 'Común' }} · T{{
                  unit.tier
                }}</span
              >
              <h4>{{ unit.name }}</h4>
              <p>{{ unit.description }}</p>
              <small
                >Desbloqueo: {{ buildingLabel(unit.unlockBuildingCode) }} nivel
                {{ unit.unlockBuildingLevel }}</small
              >
            </header>
            <dl class="entry-facts dense">
              <dt>Ataque {{ unit.attackTypeLabel.toLowerCase() }}</dt>
              <dd>{{ unit.attack }}</dd>
              <dt>Plazas</dt>
              <dd>{{ unit.slots }}</dd>
              <dt>Tiempo</dt>
              <dd>{{ secondsLabel(unit.trainingSeconds) }}</dd>
              <dt>Defensa burocrática</dt>
              <dd>{{ unit.defenseBureaucratic }}</dd>
              <dt>Defensa incisiva</dt>
              <dd>{{ unit.defenseIncisive }}</dd>
              <dt>Defensa mediática</dt>
              <dd>{{ unit.defenseMedia }}</dd>
              <dt>Coste</dt>
              <dd>{{ costLabel(unit.costs) }}</dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'transportes'" class="entry-list">
          <article
            v-for="unit in transportUnits"
            :key="unit.code"
            class="entry-row unit-entry"
            :style="{ '--entry-accent': unitAccent(unit) }"
          >
            <figure class="entry-media square">
              <img :src="troopPortrait(unit.imageKey)" :alt="unit.name" loading="lazy" />
            </figure>
            <header class="entry-copy">
              <span>{{ unit.transportTypeLabel ?? 'Transporte' }} · T{{ unit.tier }}</span>
              <h4>{{ unit.name }}</h4>
              <p>{{ unit.description }}</p>
              <small
                >Desbloqueo: {{ buildingLabel(unit.unlockBuildingCode) }} nivel
                {{ unit.unlockBuildingLevel }}</small
              >
            </header>
            <dl class="entry-facts dense">
              <dt>Tipo</dt>
              <dd>{{ unit.transportTypeLabel ?? 'Transporte' }}</dd>
              <dt>Plazas</dt>
              <dd>{{ unit.slots }}</dd>
              <dt>Tiempo</dt>
              <dd>{{ secondsLabel(unit.trainingSeconds) }}</dd>
              <dt>Defensa burocrática</dt>
              <dd>{{ unit.defenseBureaucratic }}</dd>
              <dt>Defensa incisiva</dt>
              <dd>{{ unit.defenseIncisive }}</dd>
              <dt>Defensa mediática</dt>
              <dd>{{ unit.defenseMedia }}</dd>
              <dt>Coste</dt>
              <dd>{{ costLabel(unit.costs) }}</dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'edificios'" class="entry-list">
          <article v-for="building in buildings" :key="building.code" class="entry-row">
            <figure class="entry-media">
              <img :src="buildingImage(building.imageKey)" :alt="building.name" loading="lazy" />
            </figure>
            <header class="entry-copy">
              <span>{{ building.category }} · nivel máximo {{ building.maxLevel }}</span>
              <h4>{{ building.name }}</h4>
              <p>{{ building.description }}</p>
              <small>{{ building.effects.join(' · ') }}</small>
            </header>
            <dl class="entry-facts">
              <dt>Coste base</dt>
              <dd>{{ costLabel(building.costs) }}</dd>
              <dt>Tiempo base</dt>
              <dd>{{ secondsLabel(building.durationSeconds) }}</dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'investigaciones'" class="entry-list">
          <article
            v-for="item in researchDefinitions"
            :key="item.code"
            class="entry-row"
            :style="{ '--entry-accent': item.factionColor ?? 'var(--color-accent)' }"
          >
            <figure class="entry-media">
              <img :src="researchImage(item.imageKey)" :alt="item.name" loading="lazy" />
            </figure>
            <header class="entry-copy">
              <span
                >{{ item.factionShortName ? `Especial ${item.factionShortName}` : 'Común' }} ·
                {{ item.category }}</span
              >
              <h4>{{ item.name }}</h4>
              <p>{{ item.description }}</p>
            </header>
            <dl class="entry-facts">
              <dt>Coste</dt>
              <dd>{{ researchCostLabel(item) }}</dd>
              <dt>Duración</dt>
              <dd>{{ secondsLabel(item.durationSeconds) }}</dd>
              <dt>Efecto</dt>
              <dd>{{ item.effectLabel }}</dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'eventos'" class="entry-list">
          <article v-for="event in eventDefinitions" :key="event.code" class="entry-row">
            <figure class="entry-media">
              <img :src="eventImage(event.imageKey)" :alt="event.name" loading="lazy" />
            </figure>
            <header class="entry-copy">
              <span>{{ event.category }} · severidad {{ event.baseSeverity }}</span>
              <h4>{{ event.name }}</h4>
              <p>{{ event.description }}</p>
            </header>
            <dl class="entry-facts">
              <dt>Duración base</dt>
              <dd>{{ secondsLabel(event.durationSeconds) }}</dd>
              <dt>Alcance</dt>
              <dd>{{ event.scopeLabel }}</dd>
              <dt>Impacto</dt>
              <dd>{{ event.impactLabel }}</dd>
              <dt>Respuesta</dt>
              <dd>{{ event.responseLabel }}</dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'partidos'" class="entry-list">
          <article
            v-for="faction in factions"
            :key="faction.code"
            class="entry-row party-entry"
            :style="{ '--entry-accent': faction.color }"
          >
            <figure class="entry-media square">
              <img
                v-if="partyLogo(faction.code)"
                :src="partyLogo(faction.code)"
                :alt="`Logo de ${faction.name}`"
                loading="lazy"
              />
            </figure>
            <header class="entry-copy">
              <span>{{ faction.shortName }}</span>
              <h4>{{ faction.name }}</h4>
              <p>{{ faction.satire }}</p>
            </header>
            <dl class="entry-facts">
              <dt>Lema</dt>
              <dd>{{ faction.motto }}</dd>
              <dt>Color</dt>
              <dd><i class="color-swatch"></i>{{ faction.color }}</dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'provincias'" class="entry-list province-list">
          <article
            v-for="territory in territories"
            :key="territory.code"
            class="entry-row no-media"
          >
            <header class="entry-copy">
              <span>{{ territory.region }}</span>
              <h4>{{ territory.name }}</h4>
              <p>{{ territory.satire }}</p>
            </header>
            <dl class="entry-facts dense">
              <dt>Recurso local</dt>
              <dd>{{ territory.resourceName }}</dd>
              <dt>Edificio base</dt>
              <dd>{{ territory.buildingName }}</dd>
              <dt>Población</dt>
              <dd>{{ territory.population.toLocaleString('es-ES') }}</dd>
              <dt>Voto base</dt>
              <dd>{{ territory.baseVotes.toLocaleString('es-ES') }}</dd>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'ministerios'" class="entry-list">
          <article v-for="ministry in ministries" :key="ministry.code" class="entry-row no-media">
            <header class="entry-copy">
              <span>{{ ministry.bonusResource }}</span>
              <h4>{{ ministry.name }}</h4>
              <p>{{ ministry.description }}</p>
            </header>
            <dl class="entry-facts">
              <dt>Efecto</dt>
              <dd>{{ ministry.effectLabel }}</dd>
              <dt>Apoyo requerido</dt>
              <dd>{{ ministry.requiredSupport }}</dd>
              <dt>Bono base</dt>
              <dd>+{{ ministry.bonusAmount }} {{ resourceName(ministry.bonusResource) }}</dd>
            </dl>
          </article>
        </section>

        <section v-else class="entry-list">
          <article
            v-for="scheme in corruptionSchemes"
            :key="scheme.code"
            class="entry-row no-media risk-entry"
          >
            <header class="entry-copy">
              <span>Corrupción · {{ scheme.baseRiskPercent }}% riesgo</span>
              <h4>{{ scheme.name }}</h4>
              <p>{{ scheme.description }}</p>
              <small>{{ scheme.rewardLabel }}</small>
            </header>
            <dl class="entry-facts">
              <dt>Coste</dt>
              <dd>{{ costLabel(scheme.costs) }}</dd>
              <dt>Duración</dt>
              <dd>{{ secondsLabel(scheme.durationSeconds) }}</dd>
              <dt>Si te pillan</dt>
              <dd>{{ scheme.caughtLabel }}</dd>
            </dl>
          </article>

          <article
            v-for="plan in disasterPlans"
            :key="plan.code"
            class="entry-row no-media risk-entry"
          >
            <header class="entry-copy">
              <span>Plan de crisis · {{ plan.baseSuccessPercent }}% éxito</span>
              <h4>{{ plan.name }}</h4>
              <p>{{ plan.description }}</p>
              <small>{{ plan.upside }}</small>
            </header>
            <dl class="entry-facts">
              <dt>Coste</dt>
              <dd>{{ costLabel(plan.costs) }}</dd>
              <dt>Duración</dt>
              <dd>{{ secondsLabel(plan.durationSeconds) }}</dd>
              <dt>Si falla</dt>
              <dd>{{ plan.downside }}</dd>
            </dl>
          </article>
        </section>
      </main>
    </section>
  </section>
</template>

<style scoped>
.iberopedia-view {
  display: grid;
  gap: var(--compact-gap);
  color: var(--color-text);
}

.topic-header h3,
.topic-header p,
.entry-copy h4,
.entry-copy p {
  margin: 0;
}

.topic-header span,
.entry-copy span,
.entry-facts dt {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.iberopedia-shell {
  display: grid;
  grid-template-columns: 238px minmax(0, 1fr);
  gap: var(--compact-gap);
  align-items: start;
}

.iberopedia-sidebar {
  position: sticky;
  top: calc(var(--active-header-height, var(--game-header-height)) + var(--space-page));
  display: grid;
  gap: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-surface);
}

.iberopedia-sidebar > strong {
  border-bottom: 1px solid var(--color-border);
  padding: 0 0 var(--space-2);
  color: var(--color-text);
  font-size: 0.82rem;
  text-transform: uppercase;
}

.iberopedia-sidebar nav {
  display: grid;
  gap: 0.08rem;
}

.iberopedia-sidebar button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.04rem 0.45rem;
  border: 0;
  border-left: 2px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.42rem 0.48rem;
  color: var(--color-muted);
  background: transparent;
  text-align: left;
}

.iberopedia-sidebar button:hover,
.iberopedia-sidebar button.active {
  border-left-color: var(--color-accent);
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.iberopedia-sidebar button span {
  grid-column: 1;
  color: var(--color-subtle);
  font-size: 0.62rem;
  font-weight: 900;
  text-transform: uppercase;
}

.iberopedia-sidebar button strong {
  grid-column: 1;
  overflow: hidden;
  font-size: 0.86rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iberopedia-sidebar button em {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--color-success);
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 950;
}

.iberopedia-content {
  display: grid;
  min-width: 0;
  gap: var(--compact-gap);
}

.topic-header {
  display: grid;
  gap: var(--space-1);
  border-bottom: 1px solid var(--color-border);
  padding: 0.1rem 0 var(--space-3);
}

.topic-header h3 {
  color: var(--color-text);
  font-size: 1.62rem;
  line-height: 1.05;
}

.topic-header p,
.manual-copy,
.entry-copy p,
.entry-copy small,
.entry-facts dd {
  color: var(--color-muted);
}

.manual-copy {
  display: grid;
  max-width: 92ch;
  gap: var(--space-4);
  font-size: 1rem;
  line-height: 1.5;
}

.manual-copy p,
.manual-rules {
  margin: 0;
}

.manual-rules {
  display: grid;
  gap: var(--space-2);
  padding-left: 1.2rem;
}

.manual-rules li::marker {
  color: var(--color-accent);
  font-weight: 950;
}

.entry-list {
  display: grid;
  min-width: 0;
  border-top: 1px solid var(--color-border);
}

.entry-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) minmax(260px, 0.42fr);
  gap: var(--space-4);
  align-items: start;
  min-width: 0;
  border-bottom: 1px solid var(--color-border);
  border-left: 3px solid var(--entry-accent, transparent);
  padding: var(--space-4) var(--space-3);
  background: color-mix(in srgb, var(--entry-accent, var(--color-surface)) 5%, transparent);
}

.entry-row.no-media {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
}

.entry-row:hover {
  background: color-mix(in srgb, var(--entry-accent, var(--color-accent)) 9%, var(--color-surface));
}

.entry-media {
  width: 96px;
  aspect-ratio: 1.16;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
}

.entry-media.square {
  aspect-ratio: 1;
}

.entry-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resource-entry .entry-media img,
.party-entry .entry-media img {
  object-fit: contain;
}

.entry-copy {
  display: grid;
  min-width: 0;
  gap: var(--space-2);
}

.entry-copy h4 {
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-size: 1.02rem;
  line-height: 1.14;
}

.entry-copy p,
.entry-copy small {
  line-height: 1.38;
}

.entry-copy small {
  font-weight: 780;
}

.entry-facts {
  display: grid;
  grid-template-columns: minmax(90px, 0.42fr) minmax(0, 1fr);
  gap: 0.26rem 0.55rem;
  align-content: start;
  min-width: 0;
  margin: 0;
}

.entry-facts.dense {
  grid-template-columns: minmax(128px, 0.56fr) minmax(0, 1fr);
}

.entry-facts dt {
  color: var(--color-accent);
  font-size: 0.64rem;
}

.entry-facts dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.82rem;
  font-weight: 820;
  line-height: 1.28;
}

.unit-entry {
  --entry-accent: var(--color-accent);
}

.color-swatch {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.34rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--entry-accent);
  vertical-align: -0.08rem;
}

.risk-entry .entry-copy span {
  color: var(--color-danger);
}

@media (max-width: 1080px) {
  .iberopedia-shell,
  .entry-row,
  .entry-row.no-media {
    grid-template-columns: 1fr;
  }

  .iberopedia-sidebar {
    position: static;
  }

  .iberopedia-sidebar nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .entry-row {
    grid-template-columns: 92px minmax(0, 1fr);
  }

  .entry-row.no-media {
    grid-template-columns: 1fr;
  }

  .entry-facts {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}

@media (max-width: 680px) {
  .iberopedia-sidebar nav,
  .entry-row,
  .entry-facts,
  .entry-facts.dense {
    grid-template-columns: 1fr;
  }

  .entry-media {
    width: min(100%, 180px);
  }
}
</style>
