import { describe, expect, it } from 'vitest'

import router from '@/router'

describe('router', () => {
  it('resolves lobby screens as standalone urls', () => {
    expect(router.resolve({ name: 'home' }).href).toBe('/home')
    expect(router.resolve({ name: 'homeGames' }).href).toBe('/partidas')
    expect(router.resolve({ name: 'homeParties' }).href).toBe('/partidos')
    expect(router.resolve({ name: 'homeTroops' }).href).toBe('/unidades')
    expect(router.resolve({ name: 'homeBuildings' }).href).toBe('/edificios')
    expect(router.resolve({ name: 'homeEvents' }).href).toBe('/eventos')
    expect(router.resolve({ name: 'homeResearch' }).href).toBe('/investigaciones')
  })

  it('resolves game screens below the selected world', () => {
    const params = { worldCode: 'iberia-beta-1' }

    expect(router.resolve({ name: 'gameCity', params }).href).toBe('/mundo/iberia-beta-1/provincia')
    expect(router.resolve({ name: 'gameTroops', params }).href).toBe('/mundo/iberia-beta-1/unidades')
    expect(router.resolve({ name: 'gameAlliance', params }).href).toBe('/mundo/iberia-beta-1/alianza')
    expect(router.resolve({ name: 'gameMap', params }).href).toBe('/mundo/iberia-beta-1/mapa')
    expect(router.resolve({ name: 'gameIberopedia', params }).href).toBe('/mundo/iberia-beta-1/iberopedia')
  })
})
