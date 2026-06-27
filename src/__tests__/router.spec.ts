import { describe, expect, it } from 'vitest'

import router from '@/router'

describe('router', () => {
  it('resolves lobby screens as standalone urls', () => {
    expect(router.resolve({ name: 'home' }).href).toBe('/home')
    expect(router.resolve({ name: 'homeGames' }).href).toBe('/partidas')
    expect(router.resolve({ name: 'homeIberopedia' }).href).toBe('/iberopedia')
    expect(router.resolve({ name: 'accountChat' }).href).toBe('/chat')
    expect(router.resolve({ name: 'accountFriends' }).href).toBe('/amigos')
    expect(router.resolve({ name: 'accountPreferences' }).href).toBe('/preferencias')
    expect(router.resolve({ name: 'accountSecurity' }).href).toBe('/cuenta-seguridad')
    expect(router.resolve({ name: 'accountPayments' }).href).toBe('/pagos-domiciliaciones')
  })

  it('resolves game screens below the selected world', () => {
    const params = { worldCode: 'iberia-beta-1' }

    expect(router.resolve({ name: 'gameCity', params }).href).toBe('/mundo/iberia-beta-1/ciudad')
    expect(router.resolve({ name: 'gameMap', params }).href).toBe('/mundo/iberia-beta-1/mapa')
    expect(router.resolve({ name: 'gameTroops', params }).href).toBe('/mundo/iberia-beta-1/tropas')
    expect(router.resolve({ name: 'gameAlliance', params }).href).toBe('/mundo/iberia-beta-1/alianza')
    expect(router.resolve({ name: 'gameIberopedia', params }).href).toBe('/mundo/iberia-beta-1/iberopedia')
    expect(router.resolve({ name: 'gameAccountChat', params }).href).toBe('/mundo/iberia-beta-1/cuenta/chat')
    expect(router.resolve({ name: 'gameAccountPreferences', params }).href).toBe(
      '/mundo/iberia-beta-1/cuenta/preferencias',
    )
  })
})
