import { describe, it, expect } from 'vitest'

import App from '../App.vue'

describe('App', () => {
  it('exports the root component', () => {
    expect(App).toBeTruthy()
  })
})
