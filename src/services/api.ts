import type {
  ActionDto,
  AllianceDto,
  AllianceMessageDto,
  AuthResponse,
  FactionDto,
  GameStateDto,
  ResearchDto,
  WorldDto,
} from '@/types/game'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type JsonBody = Record<string, unknown>

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? `Error ${response.status}`)
  }

  return response.json() as Promise<T>
}

function post<T>(path: string, body: JsonBody, token?: string): Promise<T> {
  return request<T>(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    token,
  )
}

export const api = {
  bootstrap: () => request<{ worlds: WorldDto[]; factions: FactionDto[] }>('/api/bootstrap'),
  signup: (body: JsonBody) => post<AuthResponse>('/api/auth/signup', body),
  login: (body: JsonBody) => post<AuthResponse>('/api/auth/login', body),
  state: (token: string) => request<GameStateDto>('/api/game/state', {}, token),
  joinWorld: (token: string, body: JsonBody) => post<GameStateDto>('/api/worlds/join', body, token),
  collect: (token: string) => post<GameStateDto>('/api/game/collect', {}, token),
  onboarding: (token: string, body: JsonBody) => post<GameStateDto>('/api/game/onboarding', body, token),
  conquer: (token: string, territoryId: number) =>
    post<ActionDto>('/api/game/actions/conquer', { territoryId }, token),
  influence: (token: string, territoryId: number) =>
    post<ActionDto>('/api/game/actions/influence', { territoryId }, token),
  corruption: (token: string, schemeCode: string) =>
    post<ActionDto>('/api/game/actions/corruption', { schemeCode }, token),
  disaster: (token: string, eventId: number, planCode: string) =>
    post<ActionDto>('/api/game/actions/disaster', { eventId, planCode }, token),
  research: (token: string, researchCode: string) =>
    post<ResearchDto>('/api/game/research', { researchCode }, token),
  trainTroops: (token: string, unitCode: string, amount: number) =>
    post<GameStateDto>('/api/game/troops/train', { unitCode, amount }, token),
  deployTroops: (token: string, territoryId: number, unitCode: string, amount: number) =>
    post<GameStateDto>('/api/game/troops/deploy', { territoryId, unitCode, amount }, token),
  upgradeBuilding: (token: string, buildingCode: string) =>
    post<GameStateDto>('/api/game/city/buildings/upgrade', { buildingCode }, token),
  exchange: (token: string, fromCode: string, toCode: string, amount: number) =>
    post<GameStateDto>('/api/game/resources/exchange', { fromCode, toCode, amount }, token),
  alliances: (token: string) => request<AllianceDto[]>('/api/alliances', {}, token),
  createAlliance: (token: string, body: JsonBody) => post<AllianceDto>('/api/alliances', body, token),
  joinAlliance: (token: string, code: string) => post<AllianceDto>('/api/alliances/join', { code }, token),
  message: (token: string, body: string) =>
    post<AllianceMessageDto>('/api/alliances/messages', { body }, token),
}
