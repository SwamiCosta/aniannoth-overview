import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEntities, useAllEntities } from './useEntities'

describe('useEntities', () => {
  it('returns entities for a known category', () => {
    const { result } = renderHook(() => useEntities('characters'))
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('returns an empty array for an unknown category', () => {
    const { result } = renderHook(() => useEntities('nonexistent'))
    expect(result.current).toEqual([])
  })

  it('each entity has all required fields', () => {
    const { result } = renderHook(() => useEntities('characters'))
    for (const entity of result.current) {
      expect(typeof entity.id).toBe('string')
      expect(typeof entity.name).toBe('string')
      expect(typeof entity.category).toBe('string')
      expect(Array.isArray(entity.tags)).toBe(true)
      expect(typeof entity.summary).toBe('string')
      expect(typeof entity.body).toBe('string')
      expect(['canon', 'draft', 'deprecated']).toContain(entity.status)
      expect(typeof entity.timeline.era).toBe('string')
    }
  })
})

describe('useAllEntities', () => {
  it('returns entities from all categories', () => {
    const { result } = renderHook(() => useAllEntities())
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('includes entities from multiple categories', () => {
    const { result } = renderHook(() => useAllEntities())
    const categories = new Set(result.current.map(e => e.category))
    expect(categories.size).toBeGreaterThan(1)
  })
})
