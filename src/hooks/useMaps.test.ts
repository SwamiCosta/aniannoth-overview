import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMaps } from './useMaps'

// ---------------------------------------------------------------------------
// Mock the API module so tests run without a real backend.
// ---------------------------------------------------------------------------

vi.mock('@/api/mapApi', () => ({
  fetchMaps: vi.fn(),
}))

import { fetchMaps } from '@/api/mapApi'

const mockFetchMaps = vi.mocked(fetchMaps)

// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const MOCK_MAPS = [
  {
    id: 'omniverse',
    name: 'The Omniverse',
    type: 'abstract' as const,
    image: '',
    availableInEras: ['primordial'],
  },
  {
    id: 'world-map',
    name: 'World Map',
    type: 'navigable' as const,
    image: '',
    availableInEras: ['ancient', 'classical'],
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMaps', () => {
  beforeEach(() => {
    mockFetchMaps.mockResolvedValue(MOCK_MAPS)
  })

  it('returns a non-empty array once loading is complete', async () => {
    const { result } = renderHook(() => useMaps())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it('each map has all required fields', async () => {
    const { result } = renderHook(() => useMaps())
    await waitFor(() => expect(result.current.loading).toBe(false))
    for (const map of result.current.data) {
      expect(typeof map.id).toBe('string')
      expect(typeof map.name).toBe('string')
      expect(['navigable', 'abstract']).toContain(map.type)
      expect(Array.isArray(map.availableInEras)).toBe(true)
    }
  })

  it('availableInEras is non-empty for each map', async () => {
    const { result } = renderHook(() => useMaps())
    await waitFor(() => expect(result.current.loading).toBe(false))
    for (const map of result.current.data) {
      expect(map.availableInEras.length).toBeGreaterThan(0)
    }
  })

  it('starts in loading state and resolves with no error on success', async () => {
    const { result } = renderHook(() => useMaps())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('sets error and clears data when the API call fails', async () => {
    mockFetchMaps.mockRejectedValue(new Error('Network failure'))
    const { result } = renderHook(() => useMaps())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toEqual([])
  })
})
