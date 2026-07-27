import { useState, useEffect } from 'react'
import { fetchEntities, fetchEntitiesForAuthoring } from '@/api/entityApi'
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

// Same as useAllEntities, but for the map-pin-target picker (inputter, edit
// mode only) — uses the authenticated internal listing so hidden entities
// are included. See fetchEntitiesForAuthoring for why the public listing
// can't be reused here. No-ops (empty, not loading) without a token, since
// the picker only ever renders inside an authenticated edit-mode session.
export function useAllEntitiesForAuthoring(accessToken: string | null): UseEntitiesResult {
  const { language } = useLanguage()
  const [data, setData] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accessToken) {
      setData([])
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all(CATEGORIES.map(cat => fetchEntitiesForAuthoring(cat, language, accessToken)))
      .then(results => { if (!cancelled) setData(results.flat()) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [language, accessToken])

  return { data, loading, error }
}
