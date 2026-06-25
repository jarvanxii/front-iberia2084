<script setup lang="ts">
import { computed } from 'vue'
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'
import GameHeader from '@/components/layout/GameHeader.vue'
import HomeHeader from '@/components/layout/HomeHeader.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const route = useRoute()
const headerKind = computed(() => route.meta.header)
const shellKind = computed(() => (typeof route.meta.shell === 'string' ? route.meta.shell : 'plain'))
const showFooter = computed(() => shellKind.value !== 'auth')

onMounted(async () => {
  await session.loadBootstrap()
  if (session.isLoggedIn) {
    await session.refresh().catch(() => session.logout())
  }
})
</script>

<template>
  <HomeHeader v-if="headerKind === 'home'" />
  <GameHeader v-else-if="headerKind === 'game'" />
  <main :class="['app-shell', `app-shell--${shellKind}`]">
    <RouterView />
  </main>
  <AppFooter v-if="showFooter" />
</template>
