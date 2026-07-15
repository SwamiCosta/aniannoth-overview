import { useState, useEffect } from 'react'
import { fetchEntitiesBatch } from '@/api/entityApi'
import { useLanguage } from '@/context/LanguageContext'
import type { FactionMember } from '@/types/universe'

export interface UseFactionMembersResult {
  data: FactionMember[]
  loading: boolean
  error: Error | null
}

export function useFactionMembers(memberIds: string[]): UseFactionMembersResult {
  const { language } = useLanguage()
  const [data, setData] = useState<FactionMember[]>([])
  const [loading, setLoading] = useState(memberIds.length > 0)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (memberIds.length === 0) {
      setData([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEntitiesBatch(memberIds, language)
      .then(members => { if (!cancelled) setData(members) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [memberIds, language])

  return { data, loading, error }
}
