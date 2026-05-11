import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import type { AuthResponse, FactionDto, GameStateDto, WorldDto } from '@/types/game'

const TOKEN_KEY = 'iberia2084.token'

export const useSessionStore = defineStore('session', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const state = ref<GameStateDto | null>(null)
  const worlds = ref<WorldDto[]>([])
  const factions = ref<FactionDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => Boolean(token.value))
  const player = computed(() => state.value?.player ?? null)

  function applyAuth(response: AuthResponse) {
    token.value = response.token
    localStorage.setItem(TOKEN_KEY, response.token)
  }

  async function loadBootstrap() {
    const bootstrap = await api.bootstrap()
    worlds.value = bootstrap.worlds
    factions.value = bootstrap.factions
  }

  async function signup(payload: {
    username: string
    displayName: string
    email: string
    password: string
  }) {
    loading.value = true
    error.value = null
    try {
      applyAuth(await api.signup(payload))
      await refresh()
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo crear la cuenta.'
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      applyAuth(await api.login({ username, password }))
      await refresh()
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo iniciar sesión.'
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    if (!token.value) return
    state.value = await api.state(token.value)
  }

  async function collect() {
    if (!token.value) return
    state.value = await api.collect(token.value)
  }

  async function runAction(action: () => Promise<unknown>) {
    if (!token.value) return
    loading.value = true
    error.value = null
    try {
      await action()
      await refresh()
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'La operación se ha atragantado.'
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  const actions = {
    joinWorld: (body: { worldCode: string; factionCode: string; leaderName: string; provinceCode?: string }) =>
      runAction(async () => {
        state.value = await api.joinWorld(token.value!, body)
      }),
    onboarding: (body: {
      allianceName?: string
      allianceCode?: string
      allianceDescription?: string
      joinAllianceCode?: string
    }) =>
      runAction(async () => {
        state.value = await api.onboarding(token.value!, body)
      }),
    conquer: (territoryId: number) => runAction(() => api.conquer(token.value!, territoryId)),
    influence: (territoryId: number) => runAction(() => api.influence(token.value!, territoryId)),
    corruption: (schemeCode: string) => runAction(() => api.corruption(token.value!, schemeCode)),
    disaster: (eventId: number, planCode: string) =>
      runAction(() => api.disaster(token.value!, eventId, planCode)),
    research: (researchCode: string) => runAction(() => api.research(token.value!, researchCode)),
    trainTroops: (unitCode: string, amount: number) =>
      runAction(async () => {
        state.value = await api.trainTroops(token.value!, unitCode, amount)
      }),
    deployTroops: (territoryId: number, unitCode: string, amount: number) =>
      runAction(async () => {
        state.value = await api.deployTroops(token.value!, territoryId, unitCode, amount)
      }),
    upgradeBuilding: (buildingCode: string) =>
      runAction(async () => {
        state.value = await api.upgradeBuilding(token.value!, buildingCode)
      }),
    exchange: (fromCode: string, toCode: string, amount: number) =>
      runAction(async () => {
        state.value = await api.exchange(token.value!, fromCode, toCode, amount)
      }),
    createAlliance: (name: string, code: string, description: string) =>
      runAction(() => api.createAlliance(token.value!, { name, code, description })),
    joinAlliance: (code: string) => runAction(() => api.joinAlliance(token.value!, code)),
    message: (body: string) => runAction(() => api.message(token.value!, body)),
  }

  function logout() {
    token.value = null
    state.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    state,
    worlds,
    factions,
    loading,
    error,
    isLoggedIn,
    player,
    loadBootstrap,
    signup,
    login,
    refresh,
    collect,
    actions,
    logout,
  }
})
