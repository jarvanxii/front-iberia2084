<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HomeOpenGames from '@/components/home/HomeOpenGames.vue'
import HomePartiesInfo from '@/components/home/HomePartiesInfo.vue'
import HomeTroopsInfo from '@/components/home/HomeTroopsInfo.vue'
import { useSessionStore } from '@/stores/session'

type HomeSection = 'partidas' | 'partidos' | 'unidades'

const route = useRoute()
const session = useSessionStore()

const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)
const worlds = computed(() => state.value?.worlds ?? session.worlds)
const factions = computed(() => state.value?.factions ?? session.factions)
const troopDefinitions = computed(() => state.value?.troopDefinitions ?? [])
const activeWorld = computed(() => {
  if (!player.value) return null
  return worlds.value.find((world) => world.id === player.value?.worldId) ?? null
})
const activeSection = computed<HomeSection>(() => {
  const section = route.meta.homeSection
  return section === 'partidos' || section === 'unidades' ? section : 'partidas'
})
</script>

<template>
  <section v-if="state" class="home-view">
    <HomeOpenGames
      v-if="activeSection === 'partidas'"
      id="partidas-abiertas"
      :worlds="worlds"
      :active-world="activeWorld"
      :factions="factions"
      :has-player="Boolean(player)"
    />
    <HomePartiesInfo
      v-else-if="activeSection === 'partidos'"
      id="partidos"
      :factions="factions"
      :current-faction-code="player?.faction.code ?? ''"
    />
    <HomeTroopsInfo v-else id="unidades" :troop-definitions="troopDefinitions" />
  </section>

  <section v-else class="panel loading-panel">Cargando partidas, partidos y unidades...</section>
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
}
</style>
