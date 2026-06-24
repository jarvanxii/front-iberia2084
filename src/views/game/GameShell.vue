<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const route = useRoute()
const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)

onMounted(async () => {
  if (!state.value) {
    const worldCode = typeof route.params.worldCode === 'string' ? route.params.worldCode : undefined
    await session.refresh(worldCode)
  }
})
</script>

<template>
  <div class="game-shell-page">
    <section v-if="state && player" class="view-frame">
      <RouterView />
    </section>

    <section v-else class="panel loading-panel">Cargando el comité de campaña...</section>
  </div>
</template>

<style scoped>
.game-shell-page,
.view-frame {
  min-width: 0;
}

.loading-panel {
  padding: var(--compact-panel-padding);
}
</style>
