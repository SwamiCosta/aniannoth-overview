import { useState, useEffect } from 'react'
import { fetchEras } from '@/api/eraApi'
import { useLanguage } from '@/context/LanguageContext'
import type { Era } from '@/types/universe'

export interface UseErasResult {
  data: Era[]
  loading: boolean
  error: Error | null
}

export function useEras(): UseErasResult {
  const { language } = useLanguage()
  const [data, setData] = useState<Era[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchEras(language)
      .then(eras => { if (!cancelled) setData(eras) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [language])

  return { data, loading, error }
}
