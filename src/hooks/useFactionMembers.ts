import { useState, useEffect } from 'react'
import { fetchEntitiesBatch } from '@/api/entityApi'
import type { FactionMember } from '@/types/universe'

export interface UseFactionMembersResult {
  data: FactionMember[]
  loading: boolean
  error: Error | null
}

export function useFactionMembers(memberIds: string[]): UseFactionMembersResult {
  const [data, setData] = useState<FactionMember[]>([])
  const [loading, setLoading] = useState(memberIds.length > 0)
  const [error, setError] = useState<Error | null>(null)

  // Depend on the ids' content, not the array reference — callers commonly pass
  // a freshly created array each render (e.g. an inline literal or `?? []`),
  // which would otherwise re-trigger this effect on every render indefinitely.
  const memberIdsKey = memberIds.join(',')

  useEffect(() => {
    if (memberIds.length === 0) {
      setData([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEntitiesBatch(memberIds)
      .then(members => { if (!cancelled) setData(members) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- memberIdsKey is memberIds' stable identity; depending on memberIds itself reintroduces the reference-identity loop this key exists to avoid
  }, [memberIdsKey])

  return { data, loading, error }
}
