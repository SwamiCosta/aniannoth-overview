import { useState, useEffect, useCallback } from 'react'
import { fetchMapPins, createMapPin, updateMapPin, deleteMapPin } from '@/api/mapPinApi'
import type { CreateMapPinInput, UpdateMapPinInput } from '@/api/mapPinApi'
import type { MapPin } from '@/types/universe'

export interface UseMapPinsResult {
  data: MapPin[]
  loading: boolean
  error: Error | null
  addPin: (input: CreateMapPinInput, accessToken: string) => Promise<void>
  movePin: (pinId: string, input: UpdateMapPinInput, accessToken: string) => Promise<void>
  removePin: (pinId: string, accessToken: string) => Promise<void>
}

export function useMapPins(mapId: string): UseMapPinsResult {
  const [data, setData] = useState<MapPin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!mapId) {
      setData([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchMapPins(mapId)
      .then(pins => { if (!cancelled) setData(pins) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mapId])

  const addPin = useCallback(async (input: CreateMapPinInput, accessToken: string) => {
    const pin = await createMapPin(mapId, input, accessToken)
    setData(prev => [...prev, pin])
  }, [mapId])

  const movePin = useCallback(async (pinId: string, input: UpdateMapPinInput, accessToken: string) => {
    const updated = await updateMapPin(mapId, pinId, input, accessToken)
    setData(prev => prev.map(p => (p.id === pinId ? updated : p)))
  }, [mapId])

  const removePin = useCallback(async (pinId: string, accessToken: string) => {
    await deleteMapPin(mapId, pinId, accessToken)
    setData(prev => prev.filter(p => p.id !== pinId))
  }, [mapId])

  return { data, loading, error, addPin, movePin, removePin }
}
