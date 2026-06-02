import { useState, useEffect } from 'react'
import { fetchEntities } from '@/api/entityApi'
import type { Entity } from '@/types/universe'

export interface UseEntitiesResult {
  data: Entity[]
  loading: boolean
  error: Error | null
}

const CATEGORIES = ['characters', 'places', 'factions', 'items', 'events', 'lore']

export function useEntities(category: string): UseEntitiesResult {
  const [data, setData] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEntities(category)
      .then(entities => { if (!cancelled) setData(entities) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [category])

  return { data, loading, error }
}

export function useAllEntities(): UseEntitiesResult {
  const [data, setData] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(CATEGORIES.map(cat => fetchEntities(cat)))
      .then(results => { if (!cancelled) setData(results.flat()) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
