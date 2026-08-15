import { describe, it, expect, beforeEach } from 'vitest'
import {
  readPersistedEra,
  writePersistedEra,
  readEraMapSelection,
  writeEraMapSelection,
} from './explorationPersistence'

describe('explorationPersistence', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('round-trips the persisted era through sessionStorage', () => {
    expect(readPersistedEra()).toBeNull()
    writePersistedEra('ancient')
    expect(readPersistedEra()).toBe('ancient')
  })

  it('round-trips the era-map selection, merging rather than overwriting other eras', () => {
    writeEraMapSelection('primordial', 'omniverse')
    writeEraMapSelection('ancient', 'world-map')

    expect(readEraMapSelection()).toEqual({ primordial: 'omniverse', ancient: 'world-map' })
  })

  it('falls back to an empty selection when sessionStorage holds malformed JSON', () => {
    sessionStorage.setItem('aniannoth_era_map_selection', 'not-json{')

    expect(readEraMapSelection()).toEqual({})
  })
})
