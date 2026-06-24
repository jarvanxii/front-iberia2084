import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import type { AuthMessageResponse, AuthProviderDto, AuthResponse, FactionDto, GameStateDto, WorldDto } from '@/types/game'

const TOKEN_KEY = 'iberia2084.token'

export const useSessionStore = defineStore('session', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const state = ref<GameStateDto | null>(null)
  const worlds = ref<WorldDto[]>([])
  const factions = ref<FactionDto[]>([])
  const authProviders = ref<AuthProviderDto[]>([])
  const activeWorldCode = ref('')
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

  async function loadAuthProviders() {
    authProviders.value = await api.authProviders()
  }

  async function requestSignup(payload: {
    username: string
    displayName: string
    email: string
    password: string
  }): Promise<AuthMessageResponse> {
    loading.value = true
    error.value = null
    try {
      return await api.signupStart(payload)
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo crear la cuenta.'
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  async function confirmSignup(email: string, code: string) {
    loading.value = true
    error.value = null
    try {
      applyAuth(await api.signupConfirm({ email, code }))
      await refresh()
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo confirmar la cuenta.'
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

  async function requestPasswordRecovery(email: string): Promise<AuthMessageResponse> {
    loading.value = true
    error.value = null
    try {
      return await api.recoveryStart({ email })
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo enviar la recuperación.'
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  async function confirmPasswordRecovery(payload: {
    resetId: string
    email: string
    token: string
    password: string
  }) {
    loading.value = true
    error.value = null
    try {
      applyAuth(await api.recoveryConfirm(payload))
      await refresh()
    } catch (unknownError) {
      error.value = unknownError instanceof Error ? unknownError.message : 'No se pudo cambiar la contraseña.'
      throw unknownError
    } finally {
      loading.value = false
    }
  }

  async function refresh(worldCode?: string) {
    if (!token.value) return
    if (worldCode) activeWorldCode.value = worldCode
    state.value = await api.state(token.value, activeWorldCode.value || undefined)
  }

  async function collect(worldCode?: string) {
    if (!token.value) return
    if (worldCode) activeWorldCode.value = worldCode
    state.value = await api.collect(token.value, activeWorldCode.value || undefined)
  }

  async function runAction(action: (worldCode?: string) => Promise<unknown>, worldCode?: string) {
    if (!token.value) return
    if (worldCode) activeWorldCode.value = worldCode
    loading.value = true
    error.value = null
    try {
      await action(activeWorldCode.value || undefined)
      await refresh(activeWorldCode.value || undefined)
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
        activeWorldCode.value = body.worldCode
        state.value = await api.joinWorld(token.value!, body)
      }),
    onboarding: (body: {
      allianceName?: string
      allianceCode?: string
      allianceDescription?: string
      joinAllianceCode?: string
    }) =>
      runAction(async (worldCode) => {
        state.value = await api.onboarding(token.value!, body, worldCode)
      }),
    conquer: (territoryId: number) => runAction((worldCode) => api.conquer(token.value!, territoryId, worldCode)),
    influence: (territoryId: number) => runAction((worldCode) => api.influence(token.value!, territoryId, worldCode)),
    corruption: (schemeCode: string) => runAction((worldCode) => api.corruption(token.value!, schemeCode, worldCode)),
    disaster: (eventId: number, planCode: string) =>
      runAction((worldCode) => api.disaster(token.value!, eventId, planCode, worldCode)),
    research: (researchCode: string) => runAction((worldCode) => api.research(token.value!, researchCode, worldCode)),
    trainTroops: (unitCode: string, amount: number) =>
      runAction(async (worldCode) => {
        state.value = await api.trainTroops(token.value!, unitCode, amount, worldCode)
      }),
    deployTroops: (territoryId: number, unitCode: string, amount: number) =>
      runAction(async (worldCode) => {
        state.value = await api.deployTroops(token.value!, territoryId, unitCode, amount, worldCode)
      }),
    upgradeBuilding: (buildingCode: string) =>
      runAction(async (worldCode) => {
        state.value = await api.upgradeBuilding(token.value!, buildingCode, worldCode)
      }),
    exchange: (fromCode: string, toCode: string, amount: number) =>
      runAction(async (worldCode) => {
        state.value = await api.exchange(token.value!, fromCode, toCode, amount, worldCode)
      }),
    createAlliance: (name: string, code: string, description: string) =>
      runAction((worldCode) => api.createAlliance(token.value!, { name, code, description }, worldCode)),
    joinAlliance: (code: string) => runAction((worldCode) => api.joinAlliance(token.value!, code, worldCode)),
    message: (body: string) => runAction((worldCode) => api.message(token.value!, body, worldCode)),
  }

  function logout() {
    token.value = null
    state.value = null
    activeWorldCode.value = ''
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    state,
    worlds,
    factions,
    authProviders,
    activeWorldCode,
    loading,
    error,
    isLoggedIn,
    player,
    loadBootstrap,
    loadAuthProviders,
    requestSignup,
    confirmSignup,
    login,
    requestPasswordRecovery,
    confirmPasswordRecovery,
    refresh,
    collect,
    actions,
    logout,
  }
})
