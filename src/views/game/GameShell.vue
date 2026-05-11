<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const state = computed(() => session.state)
const player = computed(() => state.value?.player ?? null)

onMounted(async () => {
  if (!state.value) {
    await session.refresh()
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
