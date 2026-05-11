export interface UserDto {
  id: number
  username: string
  displayName: string
  email: string
}

export interface WorldDto {
  id: number
  code: string
  name: string
  description: string
  maxPlayers: number
  currentPlayers: number
  tickSeconds: number
  status: 'OPEN' | 'UPCOMING' | 'CLOSED'
  difficultyCode: string
  difficultyName: string
  difficultyLevel: number
  opensAt: string | null
  closedAt: string | null
  winningAllianceName: string | null
  controlledTerritories: number
  totalTerritories: number
  joinable: boolean
}

export interface FactionDto {
  id: number
  code: string
  name: string
  shortName: string
  color: string
  motto: string
  satire: string
  startingRegion: string
  corruptionAffinity: number
}

export interface AllianceDto {
  id: number
  name: string
  code: string
  description: string
  factionCode: string
  factionName: string
  factionColor: string
}

export interface PlayerDto {
  id: number
  worldId: number
  leaderName: string
  faction: FactionDto
  alliance: AllianceDto | null
  votes: number
  politicalCredit: number
  reputation: number
  mediaHeat: number
  actionPoints: number
  capitalCityName: string | null
  onboardingDone: boolean
}

export interface ResourceDto {
  code: string
  name: string
  description: string
  icon: string
  amount: number
  productionPerMinute: number
}

export interface TerritoryDto {
  id: number
  code: string
  name: string
  region: string
  mapX: number
  mapY: number
  ownerPlayerId: number | null
  ownerName: string | null
  flavorFactionName: string
  color: string
  defense: number
  population: number
  baseVotes: number
  resourceFocus: string
  resourceName: string
  buildingName: string
  satire: string
}

export interface ActionDto {
  id: number
  actionType: 'CONQUEST' | 'INFLUENCE' | 'CORRUPTION' | 'DISASTER'
  targetTerritoryId: number | null
  schemeCode: string | null
  status: 'pending' | 'resolved'
  riskPercent: number
  successPercent: number
  startedAt: string
  resolvesAt: string
  resolvedAt: string | null
  resultTitle: string | null
  resultBody: string | null
}

export interface ResourceCostDto {
  code: string
  amount: number
}

export interface CorruptionSchemeDto {
  code: string
  name: string
  description: string
  baseRiskPercent: number
  durationSeconds: number
  rewardLabel: string
  caughtLabel: string
  costs: ResourceCostDto[]
}

export interface DisasterPlanDto {
  code: string
  name: string
  description: string
  baseSuccessPercent: number
  durationSeconds: number
  upside: string
  downside: string
  costs: ResourceCostDto[]
}

export interface WorldEventDto {
  id: number
  territoryId: number
  territoryName: string
  eventType: string
  name: string
  description: string
  severity: number
  status: string
  spawnedAt: string
  expiresAt: string
  resultSummary: string | null
}

export interface ResearchDto {
  id: number
  code: string
  name: string
  description: string
  costPesetas: number
  costVotos: number
  costFavores: number
  durationSeconds: number
  effectType: string
  effectValue: number
  status: 'pending' | 'done' | null
  finishesAt: string | null
}

export interface CityBuildingDto {
  id: number
  code: string
  name: string
  category: string
  description: string
  imageKey: string
  mapX: number
  mapY: number
  width: number
  height: number
  level: number
  maxLevel: number
  upgrading: boolean
  upgradeStartedAt: string | null
  upgradeFinishesAt: string | null
  nextCosts: ResourceCostDto[]
  nextDurationSeconds: number
  effects: string[]
}

export interface TroopDefinitionDto {
  code: string
  name: string
  role: string
  description: string
  imageKey: string
  factionCode: string | null
  factionName: string | null
  factionShortName: string | null
  factionColor: string | null
  tier: number
  attack: number
  attackType: string
  attackTypeLabel: string
  defenseBureaucratic: number
  defenseIncisive: number
  defenseMedia: number
  influence: number
  speed: number
  slots: number
  trainingSeconds: number
  unlockBuildingCode: string
  unlockBuildingLevel: number
  costs: ResourceCostDto[]
}

export interface PlayerTroopDto {
  code: string
  name: string
  imageKey: string
  factionCode: string | null
  factionName: string | null
  factionShortName: string | null
  factionColor: string | null
  amount: number
  attack: number
  attackType: string
  attackTypeLabel: string
  defenseBureaucratic: number
  defenseIncisive: number
  defenseMedia: number
  influence: number
  speed: number
  slots: number
}

export interface CityDto {
  id: number
  code: string
  name: string
  region: string
  mapX: number
  mapY: number
  factionName: string
  factionColor: string
  defense: number
  population: number
  baseVotes: number
  resourceName: string
  buildingName: string
  satire: string
  capital: boolean
}

export interface CityGarrisonDto {
  territoryId: number
  territoryName: string
  unitCode: string
  unitName: string
  imageKey: string
  factionCode: string | null
  factionName: string | null
  factionShortName: string | null
  factionColor: string | null
  amount: number
  attack: number
  attackType: string
  attackTypeLabel: string
  defenseBureaucratic: number
  defenseIncisive: number
  defenseMedia: number
  influence: number
  slots: number
}

export interface TrainingQueueDto {
  id: number
  unitCode: string
  unitName: string
  imageKey: string
  amount: number
  startedAt: string
  finishesAt: string
  totalSeconds: number
}

export interface MinistryDto {
  code: string
  name: string
  description: string
  controlledByFactionCode: string
  controlledByFactionName: string
  color: string
  bonusResource: string
  bonusAmount: number
  requiredSupport: number
  activeForPlayer: boolean
  effectLabel: string
}

export interface RegionalGovernmentDto {
  code: string
  name: string
  provinces: string[]
  controlledByFactionCode: string
  controlledByFactionName: string
  color: string
  stability: number
  seats: number
}

export interface AllianceMessageDto {
  id: number
  author: string
  body: string
  createdAt: string
}

export interface AllianceScoreDto {
  id: number
  name: string
  code: string
  factionName: string
  factionColor: string
  members: number
  totalVotes: number
  territories: number
  troopPower: number
  score: number
}

export interface GameStateDto {
  player: PlayerDto | null
  worlds: WorldDto[]
  factions: FactionDto[]
  resources: ResourceDto[]
  territories: TerritoryDto[]
  actions: ActionDto[]
  corruptionSchemes: CorruptionSchemeDto[]
  disasterPlans: DisasterPlanDto[]
  events: WorldEventDto[]
  research: ResearchDto[]
  cities: CityDto[]
  cityBuildings: CityBuildingDto[]
  troopDefinitions: TroopDefinitionDto[]
  troops: PlayerTroopDto[]
  garrisons: CityGarrisonDto[]
  trainingQueue: TrainingQueueDto[]
  ministries: MinistryDto[]
  regionalGovernments: RegionalGovernmentDto[]
  allianceScores: AllianceScoreDto[]
  allianceMessages: AllianceMessageDto[]
}

export interface AuthResponse {
  token: string
  user: UserDto
  player: PlayerDto | null
}
