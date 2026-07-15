import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFactionMembers } from './useFactionMembers'

// ---------------------------------------------------------------------------
// Mock the API module so tests run without a real backend.
// ---------------------------------------------------------------------------

vi.mock('@/api/entityApi', () => ({
  fetchEntitiesBatch: vi.fn(),
}))

import { fetchEntitiesBatch } from '@/api/entityApi'

const mockFetchEntitiesBatch = vi.mocked(fetchEntitiesBatch)

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const MEMBER_CANON = { id: 'member-canon', name: 'Kessa Ironvow', status: 'canon' as const }
const MEMBER_DRAFT = { id: 'member-draft', name: 'An Unnamed Recruit', status: 'draft' as const }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFactionMembers', () => {
  beforeEach(() => {
    mockFetchEntitiesBatch.mockReset()
    mockFetchEntitiesBatch.mockResolvedValue([MEMBER_CANON, MEMBER_DRAFT])
  })

  it('resolves member ids into member summaries once loading is complete', async () => {
    const { result } = renderHook(() => useFactionMembers([MEMBER_CANON.id, MEMBER_DRAFT.id]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([MEMBER_CANON, MEMBER_DRAFT])
    expect(result.current.error).toBeNull()
    expect(mockFetchEntitiesBatch).toHaveBeenCalledWith([MEMBER_CANON.id, MEMBER_DRAFT.id])
  })

  it('does not call the batch endpoint and returns no data for an empty id list', async () => {
    const { result } = renderHook(() => useFactionMembers([]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
    expect(mockFetchEntitiesBatch).not.toHaveBeenCalled()
  })

  it('sets error and clears data when the batch endpoint fails', async () => {
    mockFetchEntitiesBatch.mockRejectedValue(new Error('Network failure'))
    const { result } = renderHook(() => useFactionMembers([MEMBER_CANON.id]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toEqual([])
  })
})
