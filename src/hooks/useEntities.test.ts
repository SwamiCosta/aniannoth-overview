import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { LanguageProvider } from '@/context/LanguageContext'
import { useEntities, useAllEntities, useAllEntitiesForAuthoring } from './useEntities'

// ---------------------------------------------------------------------------
// Mock the API module so tests run without a real backend.
// ---------------------------------------------------------------------------

vi.mock('@/api/entityApi', () => ({
  fetchEntities: vi.fn(),
  fetchEntitiesForAuthoring: vi.fn(),
}))

import { fetchEntities, fetchEntitiesForAuthoring } from '@/api/entityApi'

const mockFetchEntities = vi.mocked(fetchEntities)
const mockFetchEntitiesForAuthoring = vi.mocked(fetchEntitiesForAuthoring)

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const MOCK_CHARACTER = {
  id: 'omnia',
  name: 'Omnia',
  category: 'characters',
  images: [],
  summary: 'The first being.',
  body: '# Omnia\n\nThe origin of all things.',
  location: '',
  timeline: { founded: 'primordial', destroyed: null },
  status: 'canon' as const,
  links: [],
  members: [],
  translationGroupId: 'omnia-group',
}

const MOCK_LORE = {
  id: 'creation-myth',
  name: 'The Creation Myth',
  category: 'lore',
  images: [],
  summary: 'How the world began.',
  body: '# Creation\n\nIn the beginning...',
  location: '',
  timeline: { founded: 'primordial', destroyed: null },
  status: 'canon' as const,
  links: [],
  members: [],
  translationGroupId: 'creation-myth-group',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useEntities', () => {
  beforeEach(() => {
    mockFetchEntities.mockImplementation((category: string) => {
      if (category === 'characters') return Promise.resolve([MOCK_CHARACTER])
      return Promise.resolve([])
    })
  })

  it('returns entities for a known category once loading is complete', async () => {
    const { result } = renderHook(() => useEntities('characters'), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it('returns an empty array for an unknown category', async () => {
    const { result } = renderHook(() => useEntities('nonexistent'), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('each entity has all required fields', async () => {
    const { result } = renderHook(() => useEntities('characters'), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    for (const entity of result.current.data) {
      expect(typeof entity.id).toBe('string')
      expect(typeof entity.name).toBe('string')
      expect(typeof entity.category).toBe('string')
      expect(typeof entity.summary).toBe('string')
      expect(typeof entity.body).toBe('string')
      expect(['canon', 'draft', 'deprecated']).toContain(entity.status)
      expect(typeof entity.timeline.founded).toBe('string')
    }
  })

  it('starts in loading state and resolves with no error on success', async () => {
    const { result } = renderHook(() => useEntities('characters'), { wrapper: LanguageProvider })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('sets error and clears data when the API call fails', async () => {
    mockFetchEntities.mockRejectedValue(new Error('Network failure'))
    const { result } = renderHook(() => useEntities('characters'), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toEqual([])
  })
})

describe('useAllEntities', () => {
  beforeEach(() => {
    mockFetchEntities.mockImplementation((category: string) => {
      if (category === 'characters') return Promise.resolve([MOCK_CHARACTER])
      if (category === 'lore') return Promise.resolve([MOCK_LORE])
      return Promise.resolve([])
    })
  })

  it('returns entities from all categories once loading is complete', async () => {
    const { result } = renderHook(() => useAllEntities(), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it('includes entities from multiple categories', async () => {
    const { result } = renderHook(() => useAllEntities(), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    const categories = new Set(result.current.data.map(e => e.category))
    expect(categories.size).toBeGreaterThan(1)
  })

  it('starts in loading state and resolves with no error on success', async () => {
    const { result } = renderHook(() => useAllEntities(), { wrapper: LanguageProvider })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('sets error and clears data when any category fetch fails', async () => {
    mockFetchEntities.mockRejectedValue(new Error('Network failure'))
    const { result } = renderHook(() => useAllEntities(), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toEqual([])
  })
})

describe('useAllEntitiesForAuthoring', () => {
  const MOCK_HIDDEN_LORE = { ...MOCK_LORE, id: 'hidden-truth', name: 'The Hidden Truth' }

  beforeEach(() => {
    mockFetchEntitiesForAuthoring.mockClear()
    mockFetchEntitiesForAuthoring.mockImplementation((category: string) => {
      if (category === 'characters') return Promise.resolve([MOCK_CHARACTER])
      if (category === 'lore') return Promise.resolve([MOCK_LORE, MOCK_HIDDEN_LORE])
      return Promise.resolve([])
    })
  })

  it('returns entities from all categories, including hidden ones, when given a token', async () => {
    const { result } = renderHook(() => useAllEntitiesForAuthoring('token-123'), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.map(e => e.id)).toContain('hidden-truth')
    expect(mockFetchEntitiesForAuthoring).toHaveBeenCalledWith('lore', expect.any(String), 'token-123')
  })

  it('returns no data and makes no request when there is no access token', async () => {
    const { result } = renderHook(() => useAllEntitiesForAuthoring(null), { wrapper: LanguageProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
    expect(mockFetchEntitiesForAuthoring).not.toHaveBeenCalled()
  })
})
