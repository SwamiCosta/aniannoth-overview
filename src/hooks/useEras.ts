import { useState, useEffect } from 'react'
import { fetchEras } from '@/api/eraApi'
import type { Era } from '@/types/universe'

export interface UseErasResult {
  data: Era[]
  loading: boolean
  error: Error | null
}

export function useEras(): UseErasResult {
  const [data, setData] = useState<Era[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchEras()
      .then(eras => { if (!cancelled) setData(eras) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
