import type {
  ActionDto,
  AllianceDto,
  AllianceMessageDto,
  AuthMessageResponse,
  AuthProviderDto,
  AuthResponse,
  ContactMessageResponse,
  FactionDto,
  GameStateDto,
  ResearchDto,
  WorldDto,
} from '@/types/game'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

type JsonBody = Record<string, unknown>

async function request<T>(path: string, options: RequestInit = {}, token?: string, worldCode?: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(worldCode ? { 'X-World-Code': worldCode } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? `Error ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function apiUrl(path: string): string {
  if (!API_BASE_URL) return path
  if (API_BASE_URL.endsWith('/api') && path.startsWith('/api/')) {
    return `${API_BASE_URL}${path.slice(4)}`
  }
  return `${API_BASE_URL}${path}`
}

function post<T>(path: string, body: JsonBody, token?: string, worldCode?: string): Promise<T> {
  return request<T>(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    token,
    worldCode,
  )
}

export const api = {
  bootstrap: () => request<{ worlds: WorldDto[]; factions: FactionDto[] }>('/api/bootstrap'),
  authProviders: () => request<AuthProviderDto[]>('/api/auth/providers'),
  oauthHandoff: (handoffId: string) => post<AuthResponse>(`/api/auth/oauth/handoff/${encodeURIComponent(handoffId)}`, {}),
  contact: (body: JsonBody) => post<ContactMessageResponse>('/api/auth/contact', body),
  signupStart: (body: JsonBody) => post<AuthMessageResponse>('/api/auth/signup/start', body),
  signupConfirm: (body: JsonBody) => post<AuthResponse>('/api/auth/signup/confirm', body),
  login: (body: JsonBody) => post<AuthResponse>('/api/auth/login', body),
  recoveryStart: (body: JsonBody) => post<AuthMessageResponse>('/api/auth/recovery/start', body),
  recoveryConfirm: (body: JsonBody) => post<AuthResponse>('/api/auth/recovery/confirm', body),
  state: (token: string, worldCode?: string) => request<GameStateDto>('/api/game/state', {}, token, worldCode),
  joinWorld: (token: string, body: JsonBody) => post<GameStateDto>('/api/worlds/join', body, token),
  collect: (token: string, worldCode?: string) => post<GameStateDto>('/api/game/collect', {}, token, worldCode),
  onboarding: (token: string, body: JsonBody, worldCode?: string) =>
    post<GameStateDto>('/api/game/onboarding', body, token, worldCode),
  conquer: (token: string, territoryId: number, worldCode?: string) =>
    post<ActionDto>('/api/game/actions/conquer', { territoryId }, token, worldCode),
  influence: (token: string, territoryId: number, worldCode?: string) =>
    post<ActionDto>('/api/game/actions/influence', { territoryId }, token, worldCode),
  corruption: (token: string, schemeCode: string, worldCode?: string) =>
    post<ActionDto>('/api/game/actions/corruption', { schemeCode }, token, worldCode),
  disaster: (token: string, eventId: number, planCode: string, worldCode?: string) =>
    post<ActionDto>('/api/game/actions/disaster', { eventId, planCode }, token, worldCode),
  research: (token: string, researchCode: string, worldCode?: string) =>
    post<ResearchDto>('/api/game/research', { researchCode }, token, worldCode),
  trainTroops: (token: string, unitCode: string, amount: number, worldCode?: string) =>
    post<GameStateDto>('/api/game/troops/train', { unitCode, amount }, token, worldCode),
  deployTroops: (token: string, territoryId: number, unitCode: string, amount: number, worldCode?: string) =>
    post<GameStateDto>('/api/game/troops/deploy', { territoryId, unitCode, amount }, token, worldCode),
  upgradeBuilding: (token: string, buildingCode: string, worldCode?: string) =>
    post<GameStateDto>('/api/game/city/buildings/upgrade', { buildingCode }, token, worldCode),
  exchange: (token: string, fromCode: string, toCode: string, amount: number, worldCode?: string) =>
    post<GameStateDto>('/api/game/resources/exchange', { fromCode, toCode, amount }, token, worldCode),
  alliances: (token: string, worldCode?: string) => request<AllianceDto[]>('/api/alliances', {}, token, worldCode),
  createAlliance: (token: string, body: JsonBody, worldCode?: string) =>
    post<AllianceDto>('/api/alliances', body, token, worldCode),
  joinAlliance: (token: string, code: string, worldCode?: string) =>
    post<AllianceDto>('/api/alliances/join', { code }, token, worldCode),
  message: (token: string, body: string, worldCode?: string) =>
    post<AllianceMessageDto>('/api/alliances/messages', { body }, token, worldCode),
}
