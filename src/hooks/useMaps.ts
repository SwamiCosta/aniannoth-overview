import { useState, useEffect } from 'react'
import { fetchMaps } from '@/api/mapApi'
import type { GameMap } from '@/types/universe'

export interface UseMapsResult {
  data: GameMap[]
  loading: boolean
  error: Error | null
}

export function useMaps(): UseMapsResult {
  const [data, setData] = useState<GameMap[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchMaps()
      .then(maps => { if (!cancelled) setData(maps) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
