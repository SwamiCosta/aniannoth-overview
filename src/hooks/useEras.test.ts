import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { LanguageProvider } from '@/context/LanguageContext'
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
    description: 'The age before the material world.',
    translationGroupId: 'primordial-group',
  },
  {
    id: 'ancient',
    name: 'The Ancient Era',
    order: 1,
    type: 'ERA' as const,
    importance: null,
    description: 'The first age of the material world.',
    translationGroupId: 'ancient-group',
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
    const { result } = renderHook(() => useEras(), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it('each era has all required fields', async () => {
    const { result } = renderHook(() => useEras(), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    for (const era of result.current.data) {
      expect(typeof era.id).toBe('string')
      expect(typeof era.name).toBe('string')
      expect(typeof era.order).toBe('number')
      expect(typeof era.description).toBe('string')
    }
  })

  it('starts in loading state and resolves with no error on success', async () => {
    const { result } = renderHook(() => useEras(), { wrapper: LanguageProvider })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('sets error and clears data when the API call fails', async () => {
    mockFetchEras.mockRejectedValue(new Error('Network failure'))
    const { result } = renderHook(() => useEras(), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toEqual([])
  })
})
