import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMaps } from './useMaps'

describe('useMaps', () => {
  it('returns a non-empty array', () => {
    const { result } = renderHook(() => useMaps())
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('each map has all required fields', () => {
    const { result } = renderHook(() => useMaps())
    for (const map of result.current) {
      expect(typeof map.id).toBe('string')
      expect(typeof map.name).toBe('string')
      expect(['navigable', 'abstract']).toContain(map.type)
      expect(Array.isArray(map.availableInEras)).toBe(true)
    }
  })

  it('availableInEras is non-empty for each map', () => {
    const { result } = renderHook(() => useMaps())
    for (const map of result.current) {
      expect(map.availableInEras.length).toBeGreaterThan(0)
    }
  })
})
