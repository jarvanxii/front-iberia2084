<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HomeBuildingsInfo from '@/components/home/HomeBuildingsInfo.vue'
import HomeChronologyTimeline from '@/components/home/HomeChronologyTimeline.vue'
import HomeEventsInfo from '@/components/home/HomeEventsInfo.vue'
import HomeIntroInfo from '@/components/home/HomeIntroInfo.vue'
import HomeOpenGames from '@/components/home/HomeOpenGames.vue'
import HomePartiesInfo from '@/components/home/HomePartiesInfo.vue'
import HomeResearchInfo from '@/components/home/HomeResearchInfo.vue'
import HomeTroopsInfo from '@/components/home/HomeTroopsInfo.vue'
import homeBannerUrl from '@/assets/banner-iberia.png'
import { useSessionStore } from '@/stores/session'

type HomeSection = 'inicio' | 'partidas' | 'partidos' | 'unidades' | 'edificios' | 'eventos' | 'investigaciones'

const route = useRoute()
const session = useSessionStore()

const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)
const players = computed(() => state.value?.players ?? (player.value ? [player.value] : []))
const worlds = computed(() => state.value?.worlds ?? session.worlds)
const factions = computed(() => state.value?.factions ?? session.factions)
const troopDefinitions = computed(() => state.value?.troopDefinitions ?? [])
const buildingDefinitions = computed(() => state.value?.buildingDefinitions ?? [])
const eventDefinitions = computed(() => state.value?.eventDefinitions ?? [])
const disasterPlans = computed(() => state.value?.disasterPlans ?? [])
const researchDefinitions = computed(() => state.value?.researchDefinitions ?? [])
const activeWorld = computed(() => {
  if (!player.value) return null
  return worlds.value.find((world) => world.id === player.value?.worldId) ?? null
})
const activeSection = computed<HomeSection>(() => {
  const section = route.meta.homeSection
  if (
    section === 'partidas' ||
    section === 'partidos' ||
    section === 'unidades' ||
    section === 'edificios' ||
    section === 'eventos' ||
    section === 'investigaciones'
  ) {
    return section
  }
  return 'inicio'
})
</script>

<template>
  <section v-if="state" class="home-view" :class="{ 'home-view--units': activeSection === 'unidades' }">
    <template v-if="activeSection === 'inicio'">
      <figure class="home-banner" aria-label="Banner de Iberia 2084">
        <img :src="homeBannerUrl" alt="Iberia 2084" />
      </figure>
      <HomeChronologyTimeline id="cronologia" />
      <HomeIntroInfo id="inicio" />
    </template>
    <HomeOpenGames
      v-else-if="activeSection === 'partidas'"
      id="partidas-abiertas"
      :worlds="worlds"
      :active-world="activeWorld"
      :players="players"
      :factions="factions"
      :has-player="Boolean(player)"
    />
    <HomePartiesInfo v-else-if="activeSection === 'partidos'" id="partidos" :factions="factions" />
    <HomeTroopsInfo v-else-if="activeSection === 'unidades'" id="unidades" :troop-definitions="troopDefinitions" />
    <HomeBuildingsInfo v-else-if="activeSection === 'edificios'" id="edificios" :buildings="buildingDefinitions" />
    <HomeEventsInfo
      v-else-if="activeSection === 'eventos'"
      id="eventos"
      :events="eventDefinitions"
      :disaster-plans="disasterPlans"
    />
    <HomeResearchInfo v-else id="investigaciones" :research="researchDefinitions" />
  </section>

  <section v-else class="panel loading-panel">
    Cargando inicio, partidas, partidos, unidades, edificios, eventos e investigaciones...
  </section>
</template>

<style scoped>
.home-view {
  display: grid;
  align-content: start;
  min-height: 100vh;
  gap: var(--compact-gap);
  overflow-x: hidden;
  padding: var(--space-page);
}

.home-view--units {
  padding-top: 0;
}

.home-banner {
  overflow: hidden;
  margin: 0;
  border: 1px solid rgba(125, 190, 255, 0.2);
  border-radius: 5px;
  background: rgba(3, 10, 18, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 16px 42px rgba(0, 0, 0, 0.22);
}

.home-banner img {
  display: block;
  width: 100%;
  height: auto;
}

.loading-panel {
  display: grid;
  min-height: 180px;
  place-items: center;
  margin: var(--space-page);
  padding: var(--compact-panel-padding);
  color: var(--color-text);
  font-weight: 900;
}

@media (max-width: 760px) {
  .home-view {
    gap: var(--compact-gap);
    padding: var(--space-page);
  }

  .home-view--units {
    padding-top: 0;
  }

  .home-banner {
    border-radius: 4px;
  }
}
</style>
