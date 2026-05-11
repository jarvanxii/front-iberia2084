<script setup lang="ts">
import { computed, ref } from 'vue'
import UnitStatsPanel from '@/components/game/UnitStatsPanel.vue'
import { useSessionStore } from '@/stores/session'
import type { CityBuildingDto, ResourceCostDto } from '@/types/game'
import { partyLogo } from '@/utils/partyLogos'
import { troopPortrait } from '@/utils/troopPortraits'

type CategoryKey = 'base' | 'catalogo' | 'politica' | 'territorio' | 'riesgo'
type TopicKey =
  | 'resumen'
  | 'mundos'
  | 'recursos'
  | 'unidades'
  | 'edificios'
  | 'investigaciones'
  | 'partidos'
  | 'ministerios'
  | 'gobiernos'
  | 'provincias'
  | 'corrupcion'
  | 'crisis'

interface TopicDefinition {
  key: TopicKey
  label: string
  eyebrow: string
  description: string
}

interface CategoryDefinition {
  key: CategoryKey
  label: string
  eyebrow: string
  topics: TopicDefinition[]
}

const session = useSessionStore()
const activeCategory = ref<CategoryKey>('base')
const activeTopic = ref<TopicKey>('resumen')

const categories: CategoryDefinition[] = [
  {
    key: 'base',
    label: 'Base de juego',
    eyebrow: 'Reglas',
    topics: [
      {
        key: 'resumen',
        label: 'Resumen',
        eyebrow: 'Inicio',
        description: 'Vista general de los sistemas principales de Iberia 2084.',
      },
      {
        key: 'mundos',
        label: 'Mundos',
        eyebrow: 'Partidas',
        description: 'Mapas persistentes, estado, dificultad y cierre de mundo.',
      },
      {
        key: 'recursos',
        label: 'Recursos',
        eyebrow: 'Economía',
        description: 'Las tres monedas jugables: pesetas, votos y favores.',
      },
    ],
  },
  {
    key: 'catalogo',
    label: 'Catálogo',
    eyebrow: 'Juego',
    topics: [
      {
        key: 'unidades',
        label: 'Unidades',
        eyebrow: 'Cuartel',
        description: 'Tropas comunes y especiales con costes, estadísticas y desbloqueos.',
      },
      {
        key: 'edificios',
        label: 'Edificios',
        eyebrow: 'Provincia',
        description: 'Infraestructura urbana, niveles, efectos y costes de mejora.',
      },
      {
        key: 'investigaciones',
        label: 'Investigaciones',
        eyebrow: 'Mejoras',
        description: 'Tecnologías de partida con coste, duración y efecto.',
      },
    ],
  },
  {
    key: 'politica',
    label: 'Política',
    eyebrow: 'Poder',
    topics: [
      {
        key: 'partidos',
        label: 'Partidos',
        eyebrow: 'Ficciones',
        description: 'Partidos jugables, lemas, afinidades y tono satírico.',
      },
      {
        key: 'ministerios',
        label: 'Ministerios',
        eyebrow: 'Estado',
        description: 'Bonos pasivos y apoyo institucional requerido.',
      },
      {
        key: 'gobiernos',
        label: 'Gobiernos',
        eyebrow: 'Regiones',
        description: 'Control regional, estabilidad y soporte territorial.',
      },
    ],
  },
  {
    key: 'territorio',
    label: 'Territorio',
    eyebrow: 'Mapa',
    topics: [
      {
        key: 'provincias',
        label: 'Provincias',
        eyebrow: 'Mapa',
        description: 'Provincias del mundo activo con defensa, población y recurso local.',
      },
    ],
  },
  {
    key: 'riesgo',
    label: 'Riesgo',
    eyebrow: 'Caos',
    topics: [
      {
        key: 'corrupcion',
        label: 'Corrupción',
        eyebrow: 'Opaco',
        description: 'Operaciones arriesgadas, costes, premios y castigos.',
      },
      {
        key: 'crisis',
        label: 'Crisis',
        eyebrow: 'Gestión',
        description: 'Planes de respuesta, porcentaje de éxito y eventos activos.',
      },
    ],
  },
]
const defaultCategory = categories[0]!

const resourcePurpose: Record<string, { usage: string; pressure: string }> = {
  pesetas: {
    usage: 'Comprar edificios, unidades, investigaciones y mejoras con factura.',
    pressure: 'Si faltan, la provincia se queda en promesa pública con andamios.',
  },
  votos: {
    usage: 'Sostener presión territorial, unidades ofensivas y músculo político.',
    pressure: 'Si bajan, atacas poco y la oposición huele sangre.',
  },
  favores: {
    usage: 'Pagar defensa, pactos internos, corrupción y atajos administrativos.',
    pressure: 'Sin favores, cualquier provincia queda vendida al primer escándalo serio.',
  },
}

const state = computed(() => session.state)
const worlds = computed(() => state.value?.worlds ?? [])
const resources = computed(() => state.value?.resources ?? [])
const factions = computed(() => state.value?.factions ?? [])
const troopDefinitions = computed(() => [...(state.value?.troopDefinitions ?? [])].sort((a, b) => a.tier - b.tier))
const research = computed(() => [...(state.value?.research ?? [])].sort((a, b) => a.durationSeconds - b.durationSeconds))
const ministries = computed(() => state.value?.ministries ?? [])
const regionalGovernments = computed(() => state.value?.regionalGovernments ?? [])
const territories = computed(() =>
  [...(state.value?.territories ?? [])].sort((a, b) => a.region.localeCompare(b.region, 'es') || a.name.localeCompare(b.name, 'es')),
)
const corruptionSchemes = computed(() => state.value?.corruptionSchemes ?? [])
const disasterPlans = computed(() => state.value?.disasterPlans ?? [])
const activeEvents = computed(() => state.value?.events ?? [])
const buildingGroups = computed(() => groupBuildings(state.value?.cityBuildings ?? []))
const currentCategory = computed<CategoryDefinition>(
  () => categories.find((category) => category.key === activeCategory.value) ?? defaultCategory,
)
const currentTopics = computed<TopicDefinition[]>(() => currentCategory.value.topics)
const activeTopicInfo = computed<TopicDefinition>(
  () => currentTopics.value.find((topic) => topic.key === activeTopic.value) ?? currentTopics.value[0]!,
)

function selectCategory(category: CategoryDefinition) {
  activeCategory.value = category.key
  activeTopic.value = category.topics[0]!.key
}

function groupBuildings(buildings: CityBuildingDto[]) {
  const groups: { category: string; buildings: CityBuildingDto[] }[] = []
  const groupIndex = new Map<string, { category: string; buildings: CityBuildingDto[] }>()
  for (const building of buildings) {
    const category = building.category || 'General'
    const existing = groupIndex.get(category)
    if (existing) {
      existing.buildings.push(building)
    } else {
      const created = { category, buildings: [building] }
      groups.push(created)
      groupIndex.set(category, created)
    }
  }
  return groups
}

function topicCount(key: TopicKey) {
  const counts: Record<TopicKey, number> = {
    resumen: 5,
    mundos: worlds.value.length,
    recursos: resources.value.length,
    unidades: troopDefinitions.value.length,
    edificios: buildingGroups.value.reduce((total, group) => total + group.buildings.length, 0),
    investigaciones: research.value.length,
    partidos: factions.value.length,
    ministerios: ministries.value.length,
    gobiernos: regionalGovernments.value.length,
    provincias: territories.value.length,
    corrupcion: corruptionSchemes.value.length,
    crisis: disasterPlans.value.length + activeEvents.value.length,
  }
  return counts[key]
}

function resourceName(code: string) {
  return resources.value.find((resource) => resource.code === code)?.name ?? code
}

function costLabel(costs: ResourceCostDto[]) {
  if (!costs.length) return 'Sin coste'
  return costs.map((cost) => `${cost.amount.toLocaleString('es-ES')} ${resourceName(cost.code)}`).join(' · ')
}

function secondsLabel(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

function riskClass(risk: number) {
  if (risk >= 55) return 'high'
  if (risk >= 30) return 'medium'
  return 'low'
}

function statusLabel(status: string) {
  if (status === 'OPEN') return 'Abierto'
  if (status === 'UPCOMING') return 'Próximamente'
  return 'Cerrado'
}

function ownerLabel(ownerName: string | null) {
  return ownerName ?? 'Sin control'
}

function worldDateLabel(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <section v-if="state" class="iberopedia-view">
    <article class="panel iberopedia-hero">
      <div>
        <p class="muted">Archivo de campaña</p>
        <h2>Iberopedia</h2>
        <p>
          Consulta rápida de reglas, catálogos y sistemas activos de Iberia 2084. Elige una categoría arriba y
          navega sus entradas desde el índice lateral.
        </p>
      </div>
      <dl class="archive-stats">
        <div>
          <dt>Mundos</dt>
          <dd>{{ worlds.length }}</dd>
        </div>
        <div>
          <dt>Partidos</dt>
          <dd>{{ factions.length }}</dd>
        </div>
        <div>
          <dt>Unidades</dt>
          <dd>{{ troopDefinitions.length }}</dd>
        </div>
        <div>
          <dt>Provincias</dt>
          <dd>{{ territories.length }}</dd>
        </div>
      </dl>
    </article>

    <nav class="panel iberopedia-subheader" aria-label="Categorías de Iberopedia">
      <button
        v-for="category in categories"
        :key="category.key"
        type="button"
        :class="{ active: activeCategory === category.key }"
        @click="selectCategory(category)"
      >
        <span>{{ category.eyebrow }}</span>
        <strong>{{ category.label }}</strong>
      </button>
    </nav>

    <div class="iberopedia-layout">
      <aside class="panel topic-sidebar" aria-label="Navegación de categoría">
        <div class="sidebar-heading">
          <span>{{ currentCategory.eyebrow }}</span>
          <strong>{{ currentCategory.label }}</strong>
        </div>
        <button
          v-for="topic in currentTopics"
          :key="topic.key"
          type="button"
          :class="{ active: activeTopic === topic.key }"
          @click="activeTopic = topic.key"
        >
          <span>{{ topic.eyebrow }}</span>
          <strong>{{ topic.label }}</strong>
          <em>{{ topicCount(topic.key) }}</em>
        </button>
      </aside>

      <main class="archive-content">
        <header class="content-title">
          <span>{{ activeTopicInfo.eyebrow }}</span>
          <h3>{{ activeTopicInfo.label }}</h3>
          <p>{{ activeTopicInfo.description }}</p>
        </header>

        <section v-if="activeTopic === 'resumen'" class="summary-grid">
          <article class="panel feature-card wide">
            <span>Bucle principal</span>
            <h4>Provincia, unidades, territorio y riesgo</h4>
            <p>
              La provincia produce recursos y desbloquea edificios. Las unidades se entrenan por cola, se despliegan en
              provincias y sostienen la expansión territorial. Los riesgos ofrecen atajos medibles, nunca gratis.
            </p>
          </article>
          <article class="panel feature-card">
            <span>Recursos</span>
            <h4>Tres monedas, tres trabajos</h4>
            <p>Pesetas para construir, votos para presionar y favores para defensa, pactos y acciones especiales.</p>
          </article>
          <article class="panel feature-card">
            <span>Estado</span>
            <h4>El apoyo institucional activa ministerios</h4>
            <p>Los ministerios premian bloques con suficiente soporte político y convierten el poder en producción.</p>
          </article>
          <article
            v-for="category in categories"
            :key="category.key"
            class="panel category-preview"
            :class="{ active: category.key === activeCategory }"
            @click="selectCategory(category)"
          >
            <span>{{ category.eyebrow }}</span>
            <strong>{{ category.label }}</strong>
            <small>{{ category.topics.length }} entradas</small>
          </article>
        </section>

        <section v-else-if="activeTopic === 'mundos'" class="card-grid">
          <article v-for="world in worlds" :key="world.code" class="panel data-card world-card">
            <div>
              <span>{{ statusLabel(world.status) }}</span>
              <h4>{{ world.name }}</h4>
              <p>{{ world.description }}</p>
            </div>
            <dl>
              <div>
                <dt>Dificultad</dt>
                <dd>{{ world.difficultyName }} · nivel {{ world.difficultyLevel }}</dd>
              </div>
              <div>
                <dt>Plazas</dt>
                <dd>{{ world.currentPlayers }} / {{ world.maxPlayers }}</dd>
              </div>
              <div>
                <dt>Control</dt>
                <dd>{{ world.controlledTerritories }} / {{ world.totalTerritories || '??' }} provincias</dd>
              </div>
              <div v-if="world.status === 'UPCOMING'">
                <dt>Apertura</dt>
                <dd>{{ worldDateLabel(world.opensAt) }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'recursos'" class="card-grid compact">
          <article v-for="resource in resources" :key="resource.code" class="panel data-card">
            <span>{{ resource.name }}</span>
            <h4>{{ resource.amount.toLocaleString('es-ES') }}</h4>
            <p>{{ resource.description }}</p>
            <dl>
              <div>
                <dt>Uso</dt>
                <dd>{{ resourcePurpose[resource.code]?.usage ?? 'Pendiente de documentar.' }}</dd>
              </div>
              <div>
                <dt>Presión</dt>
                <dd>{{ resourcePurpose[resource.code]?.pressure ?? 'Debe tener impacto jugable claro.' }}</dd>
              </div>
              <div>
                <dt>Producción</dt>
                <dd>+{{ resource.productionPerMinute }}/min</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'unidades'" class="unit-list">
          <article v-for="unit in troopDefinitions" :key="unit.code" class="panel unit-card">
            <figure class="unit-card-portrait">
              <img :src="troopPortrait(unit.imageKey)" :alt="unit.name" loading="lazy" />
            </figure>
            <div>
              <span>{{ unit.role }} · Tier {{ unit.tier }}</span>
              <h4>{{ unit.name }}</h4>
              <p>{{ unit.description }}</p>
              <small>Desbloqueo: {{ unit.unlockBuildingCode }} nivel {{ unit.unlockBuildingLevel }}</small>
            </div>
            <UnitStatsPanel :unit="unit" dense />
            <strong>Coste: {{ costLabel(unit.costs) }}</strong>
          </article>
        </section>

        <section v-else-if="activeTopic === 'edificios'" class="building-stack">
          <template v-for="group in buildingGroups" :key="group.category">
            <div class="group-title">
              <span>Edificios</span>
              <h4>{{ group.category }}</h4>
            </div>
            <div class="card-grid compact">
              <article v-for="building in group.buildings" :key="building.code" class="panel data-card">
                <span>Nivel {{ building.level }} / {{ building.maxLevel }}</span>
                <h4>{{ building.name }}</h4>
                <p>{{ building.description }}</p>
                <small>{{ building.effects.join(' · ') }}</small>
                <strong>{{ costLabel(building.nextCosts) }}</strong>
              </article>
            </div>
          </template>
        </section>

        <section v-else-if="activeTopic === 'investigaciones'" class="card-grid">
          <article v-for="item in research" :key="item.code" class="panel data-card">
            <span>{{ item.status === 'done' ? 'Investigado' : item.status === 'pending' ? 'En curso' : 'Disponible' }}</span>
            <h4>{{ item.name }}</h4>
            <p>{{ item.description }}</p>
            <dl>
              <div>
                <dt>Coste</dt>
                <dd>
                  {{ item.costPesetas.toLocaleString('es-ES') }} pesetas ·
                  {{ item.costVotos.toLocaleString('es-ES') }} votos ·
                  {{ item.costFavores.toLocaleString('es-ES') }} favores
                </dd>
              </div>
              <div>
                <dt>Duración</dt>
                <dd>{{ secondsLabel(item.durationSeconds) }}</dd>
              </div>
              <div>
                <dt>Efecto</dt>
                <dd>{{ item.effectType }} +{{ item.effectValue }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'partidos'" class="card-grid">
          <article
            v-for="faction in factions"
            :key="faction.code"
            class="panel party-card"
            :style="{ '--faction': faction.color }"
          >
            <div class="party-heading">
              <img v-if="partyLogo(faction.code)" :src="partyLogo(faction.code)" :alt="`Logo de ${faction.name}`" />
              <div>
                <span>{{ faction.shortName }}</span>
                <h4>{{ faction.name }}</h4>
              </div>
            </div>
            <p>{{ faction.satire }}</p>
            <dl>
              <div>
                <dt>Lema</dt>
                <dd>{{ faction.motto }}</dd>
              </div>
              <div>
                <dt>Inicio</dt>
                <dd>{{ faction.startingRegion }}</dd>
              </div>
              <div>
                <dt>Afinidad opaca</dt>
                <dd>{{ faction.corruptionAffinity }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'ministerios'" class="card-grid">
          <article v-for="ministry in ministries" :key="ministry.code" class="panel ministry-card">
            <span :style="{ background: ministry.color }"></span>
            <div>
              <small>{{ ministry.controlledByFactionName }}</small>
              <h4>{{ ministry.name }}</h4>
              <p>{{ ministry.description }}</p>
              <strong>{{ ministry.effectLabel }}</strong>
              <em>{{ ministry.requiredSupport }} apoyo institucional requerido</em>
            </div>
          </article>
        </section>

        <section v-else-if="activeTopic === 'gobiernos'" class="card-grid compact">
          <article v-for="government in regionalGovernments" :key="government.code" class="panel data-card">
            <span>{{ government.controlledByFactionName }}</span>
            <h4>{{ government.name }}</h4>
            <p>{{ government.provinces.join(', ') }}</p>
            <dl>
              <div>
                <dt>Estabilidad</dt>
                <dd>{{ government.stability }}</dd>
              </div>
              <div>
                <dt>Soporte</dt>
                <dd>{{ government.seats }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'provincias'" class="territory-list">
          <article v-for="territory in territories" :key="territory.id" class="panel territory-row">
            <div>
              <span>{{ territory.region }}</span>
              <h4>{{ territory.name }}</h4>
              <p>{{ territory.satire }}</p>
            </div>
            <dl>
              <div>
                <dt>Control</dt>
                <dd>{{ ownerLabel(territory.ownerName) }}</dd>
              </div>
              <div>
                <dt>Defensa</dt>
                <dd>{{ territory.defense }}</dd>
              </div>
              <div>
                <dt>Población</dt>
                <dd>{{ territory.population.toLocaleString('es-ES') }}</dd>
              </div>
              <div>
                <dt>Recurso</dt>
                <dd>{{ territory.resourceName }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-else-if="activeTopic === 'corrupcion'" class="card-grid">
          <article v-for="scheme in corruptionSchemes" :key="scheme.code" class="panel risk-card">
            <span :class="riskClass(scheme.baseRiskPercent)">{{ scheme.baseRiskPercent }}% riesgo</span>
            <h4>{{ scheme.name }}</h4>
            <p>{{ scheme.description }}</p>
            <small>{{ scheme.rewardLabel }}</small>
            <em>{{ scheme.caughtLabel }}</em>
            <strong>{{ costLabel(scheme.costs) }} · {{ secondsLabel(scheme.durationSeconds) }}</strong>
          </article>
        </section>

        <section v-else class="risk-layout">
          <div class="card-grid">
            <article v-for="plan in disasterPlans" :key="plan.code" class="panel risk-card">
              <span>{{ plan.baseSuccessPercent }}% éxito</span>
              <h4>{{ plan.name }}</h4>
              <p>{{ plan.description }}</p>
              <small>{{ plan.upside }}</small>
              <em>{{ plan.downside }}</em>
              <strong>{{ costLabel(plan.costs) }} · {{ secondsLabel(plan.durationSeconds) }}</strong>
            </article>
          </div>
          <div v-if="activeEvents.length" class="card-grid">
            <article v-for="event in activeEvents" :key="event.id" class="panel risk-card live">
              <span>Severidad {{ event.severity }}</span>
              <h4>{{ event.name }}</h4>
              <p>{{ event.description }}</p>
              <small>{{ event.territoryName }}</small>
            </article>
          </div>
        </section>
      </main>
    </div>
  </section>
</template>

<style scoped>
.iberopedia-view,
.archive-content,
.building-stack,
.risk-layout {
  display: grid;
  gap: var(--compact-gap);
}

.iberopedia-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 0.38fr);
  gap: var(--compact-gap);
  padding: var(--compact-panel-padding);
  background: var(--color-surface);
}

.iberopedia-hero h2,
.iberopedia-hero p,
.content-title h3,
.content-title p,
.feature-card h4,
.feature-card p,
.data-card h4,
.data-card p,
.unit-card h4,
.unit-card p,
.party-card h4,
.party-card p,
.ministry-card h4,
.ministry-card p,
.risk-card h4,
.risk-card p,
.territory-row h4,
.territory-row p,
.group-title h4 {
  margin: 0;
}

.iberopedia-hero h2 {
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3.8rem);
  line-height: 0.95;
}

.iberopedia-hero p,
.content-title p,
.feature-card p,
.data-card p,
.unit-card p,
.party-card p,
.ministry-card p,
.risk-card p,
.territory-row p {
  color: var(--color-muted);
  line-height: 1.36;
}

.archive-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--compact-gap-sm);
  align-self: end;
  margin: 0;
}

.archive-stats div,
.category-preview,
.feature-card,
.data-card,
.unit-card,
.party-card,
.ministry-card,
.risk-card,
.territory-row {
  min-width: 0;
}

.archive-stats div {
  border-radius: var(--radius-md);
  padding: var(--compact-card-padding);
  background: var(--color-surface-soft);
}

.archive-stats dt,
.iberopedia-subheader span,
.topic-sidebar span,
.content-title span,
.feature-card span,
.category-preview span,
.data-card span,
.unit-card span,
.party-card span,
.risk-card > span,
.territory-row span,
.group-title span {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
}

.archive-stats dd {
  margin: 0.06rem 0 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 950;
}

.iberopedia-subheader {
  position: sticky;
  z-index: 30;
  top: var(--game-header-height);
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: var(--compact-gap-sm);
  padding: 0.32rem;
}

.iberopedia-subheader button,
.topic-sidebar button,
.category-preview {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-muted);
  background: var(--color-surface-soft);
  text-align: left;
}

.iberopedia-subheader button {
  display: grid;
  gap: 0.08rem;
  padding: 0.38rem 0.52rem;
}

.iberopedia-subheader button.active,
.topic-sidebar button.active,
.category-preview.active,
.category-preview:hover {
  color: var(--color-on-accent);
  background: var(--color-accent);
}

.iberopedia-subheader button.active span,
.iberopedia-subheader button.active strong,
.topic-sidebar button.active span,
.topic-sidebar button.active strong,
.topic-sidebar button.active em,
.category-preview.active span,
.category-preview.active strong,
.category-preview.active small,
.category-preview:hover span,
.category-preview:hover strong,
.category-preview:hover small {
  color: var(--color-on-accent);
}

.iberopedia-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: var(--compact-gap);
  align-items: start;
}

.topic-sidebar {
  position: sticky;
  top: calc(var(--game-header-height) + 4.25rem);
  display: grid;
  gap: var(--compact-gap-sm);
  padding: var(--compact-card-padding);
}

.sidebar-heading {
  display: grid;
  gap: 0.16rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.12rem 0.18rem 0.42rem;
}

.sidebar-heading strong {
  color: var(--color-text);
}

.topic-sidebar button {
  position: relative;
  display: grid;
  gap: 0.04rem;
  padding: 0.38rem 2.3rem 0.38rem 0.5rem;
}

.topic-sidebar button em {
  position: absolute;
  top: 50%;
  right: 0.58rem;
  color: var(--color-success);
  font-style: normal;
  font-weight: 950;
  transform: translateY(-50%);
}

.content-title {
  display: grid;
  gap: var(--space-1);
  border-left: 3px solid var(--color-accent);
  padding: 0.12rem 0 0.12rem 0.62rem;
}

.content-title h3 {
  color: var(--color-text);
  font-size: clamp(1.45rem, 3vw, 2.4rem);
}

.summary-grid,
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--compact-gap);
}

.card-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.feature-card,
.data-card,
.party-card,
.risk-card {
  display: grid;
  gap: var(--compact-gap-sm);
  padding: var(--compact-panel-padding);
}

.feature-card.wide {
  grid-column: span 2;
}

.feature-card h4,
.data-card h4,
.unit-card h4,
.party-card h4,
.ministry-card h4,
.risk-card h4,
.territory-row h4,
.group-title h4 {
  color: var(--color-text);
}

.category-preview {
  display: grid;
  gap: var(--space-1);
  padding: var(--compact-card-padding);
  cursor: pointer;
}

.category-preview small,
.data-card small,
.unit-card small,
.ministry-card small,
.risk-card small {
  color: var(--color-muted);
  font-weight: 850;
}

.data-card dl,
.party-card dl,
.territory-row dl {
  display: grid;
  gap: var(--compact-gap-sm);
  margin: 0;
}

.data-card dt,
.party-card dt,
.territory-row dt {
  color: var(--color-accent);
  font-size: 0.68rem;
  font-weight: 950;
  text-transform: uppercase;
}

.data-card dd,
.party-card dd,
.territory-row dd {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.34;
}

.data-card strong,
.unit-card strong,
.ministry-card strong,
.risk-card strong {
  color: var(--color-success);
}

.world-card {
  align-content: start;
}

.unit-list,
.territory-list {
  display: grid;
  gap: var(--compact-gap);
}

.unit-card {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) minmax(330px, 0.44fr) minmax(190px, 0.22fr);
  gap: var(--compact-gap);
  align-items: center;
  padding: var(--compact-panel-padding);
}

.unit-card-portrait {
  width: 76px;
  aspect-ratio: 1 / 1;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.unit-card-portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.building-stack {
  gap: var(--compact-gap);
}

.group-title {
  display: grid;
  gap: 0.1rem;
}

.party-card {
  border-color: var(--color-border);
  background: var(--color-surface);
}

.party-heading {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: var(--compact-gap);
  align-items: center;
}

.party-heading img {
  width: 42px;
  height: 42px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  object-fit: cover;
}

.ministry-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--compact-gap);
  padding: var(--compact-panel-padding);
}

.ministry-card > span {
  width: 12px;
  min-height: 100%;
  border-radius: var(--radius-sm);
}

.ministry-card div {
  display: grid;
  gap: var(--compact-gap-sm);
}

.ministry-card em,
.risk-card em {
  color: var(--color-danger);
  font-style: normal;
  font-weight: 850;
}

.territory-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.62fr);
  gap: var(--compact-gap);
  padding: var(--compact-panel-padding);
}

.territory-row dl {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.risk-card > span {
  width: fit-content;
  border-radius: var(--radius-sm);
  padding: 0.22rem 0.42rem;
  background: var(--color-surface-soft);
}

.risk-card > span.medium {
  background: var(--color-surface-soft);
}

.risk-card > span.high {
  color: var(--color-danger);
  background: var(--color-surface-soft);
}

.risk-card.live {
  border-color: var(--color-danger);
}

@media (max-width: 1180px) {
  .iberopedia-hero,
  .iberopedia-layout,
  .unit-card,
  .territory-row {
    grid-template-columns: 1fr;
  }

  .iberopedia-subheader,
  .topic-sidebar {
    position: static;
  }

  .topic-sidebar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sidebar-heading {
    grid-column: 1 / -1;
  }

  .summary-grid,
  .card-grid,
  .card-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .feature-card.wide {
    grid-column: span 1;
  }
}

@media (max-width: 700px) {
  .iberopedia-view {
    gap: var(--compact-gap);
  }

  .iberopedia-hero,
  .iberopedia-subheader,
  .topic-sidebar {
    border-radius: 0;
  }

  .iberopedia-subheader {
    display: flex;
    overflow-x: auto;
    padding: 0.3rem;
    scrollbar-width: none;
  }

  .iberopedia-subheader::-webkit-scrollbar {
    display: none;
  }

  .iberopedia-subheader button {
    flex: 0 0 142px;
  }

  .archive-stats,
  .topic-sidebar,
  .summary-grid,
  .card-grid,
  .card-grid.compact,
  .territory-row dl {
    grid-template-columns: 1fr;
  }
}
</style>
