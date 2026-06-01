import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEras } from './useEras'

describe('useEras', () => {
  it('returns a non-empty array', () => {
    const { result } = renderHook(() => useEras())
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('each era has all required fields', () => {
    const { result } = renderHook(() => useEras())
    for (const era of result.current) {
      expect(typeof era.id).toBe('string')
      expect(typeof era.name).toBe('string')
      expect(typeof era.order).toBe('number')
      expect(typeof era.period).toBe('string')
      expect(typeof era.defaultMap).toBe('string')
      expect(['navigable', 'abstract']).toContain(era.mapType)
    }
  })

  it('eras are returned with valid hex colors', () => {
    const { result } = renderHook(() => useEras())
    for (const era of result.current) {
      expect(era.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})
