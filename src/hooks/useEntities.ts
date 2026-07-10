import { useState, useEffect } from 'react'
import { fetchEntities } from '@/api/entityApi'
import { useLanguage } from '@/context/LanguageContext'
import type { Entity } from '@/types/universe'

export interface UseEntitiesResult {
  data: Entity[]
  loading: boolean
  error: Error | null
}

const CATEGORIES = ['characters', 'places', 'factions', 'items', 'events', 'lore']

export function useEntities(category: string): UseEntitiesResult {
  const { language } = useLanguage()
  const [data, setData] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEntities(category, language)
      .then(entities => { if (!cancelled) setData(entities) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [category, language])

  return { data, loading, error }
}

export function useAllEntities(): UseEntitiesResult {
  const { language } = useLanguage()
  const [data, setData] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all(CATEGORIES.map(cat => fetchEntities(cat, language)))
      .then(results => { if (!cancelled) setData(results.flat()) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [language])

  return { data, loading, error }
}
