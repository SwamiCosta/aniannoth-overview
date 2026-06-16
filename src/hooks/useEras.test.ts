import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEras } from './useEras'

// ---------------------------------------------------------------------------
// Mock the API module so tests run without a real backend.
// ---------------------------------------------------------------------------

vi.mock('@/api/eraApi', () => ({
  fetchEras: vi.fn(),
}))

import { fetchEras } from '@/api/eraApi'

const mockFetchEras = vi.mocked(fetchEras)

// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const MOCK_ERAS = [
  {
    id: 'primordial',
    name: 'The Primordial Era',
    order: 0,
    type: 'ERA' as const,
    importance: null,
    period: 'Before Creation',
    summary: 'The age before the material world.',
    mapType: 'abstract' as const,
    defaultMap: 'omniverse',
    color: '#7c3aed',
  },
  {
    id: 'ancient',
    name: 'The Ancient Era',
    order: 1,
    type: 'ERA' as const,
    importance: null,
    period: 'Anno 1 – 500',
    summary: 'The first age of the material world.',
    mapType: 'navigable' as const,
    defaultMap: 'world-map',
    color: '#b45309',
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useEras', () => {
  beforeEach(() => {
    mockFetchEras.mockResolvedValue(MOCK_ERAS)
  })

  it('returns a non-empty array once loading is complete', async () => {
    const { result } = renderHook(() => useEras())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it('each era has all required fields', async () => {
    const { result } = renderHook(() => useEras())
    await waitFor(() => expect(result.current.loading).toBe(false))
    for (const era of result.current.data) {
      expect(typeof era.id).toBe('string')
      expect(typeof era.name).toBe('string')
      expect(typeof era.order).toBe('number')
      expect(typeof era.period).toBe('string')
      expect(typeof era.defaultMap).toBe('string')
      expect(['navigable', 'abstract']).toContain(era.mapType)
    }
  })

  it('eras are returned with valid hex colors', async () => {
    const { result } = renderHook(() => useEras())
    await waitFor(() => expect(result.current.loading).toBe(false))
    for (const era of result.current.data) {
      expect(era.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('starts in loading state and resolves with no error on success', async () => {
    const { result } = renderHook(() => useEras())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('sets error and clears data when the API call fails', async () => {
    mockFetchEras.mockRejectedValue(new Error('Network failure'))
    const { result } = renderHook(() => useEras())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toEqual([])
  })
})
