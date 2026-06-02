import { apiFetch } from './keynorCoreClient'
import type { GameMap } from '@/types/universe'

interface ApiMap {
  id: string
  name: string
  mapType: string
  image: string
  eraIds: string[]
}

function toGameMap(api: ApiMap): GameMap {
  return {
    id: api.id,
    name: api.name,
    type: api.mapType.toLowerCase() as GameMap['type'],
    image: api.image,
    availableInEras: api.eraIds,
  }
}

export async function fetchMaps(): Promise<GameMap[]> {
  const data = await apiFetch<ApiMap[]>('/api/public/v1/maps')
  return data.map(toGameMap)
}

export async function fetchMapsByEra(eraId: string): Promise<GameMap[]> {
  const data = await apiFetch<ApiMap[]>(`/api/public/v1/maps?eraId=${encodeURIComponent(eraId)}`)
  return data.map(toGameMap)
}

export async function fetchMapById(id: string): Promise<GameMap> {
  const data = await apiFetch<ApiMap>(`/api/public/v1/maps/${id}`)
  return toGameMap(data)
}
