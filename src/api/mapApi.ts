import { apiFetch } from './keynorCoreClient'
import type { GameMap } from '@/types/universe'
import { logger } from '@/lib/logger'

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
  try {
    const data = await apiFetch<ApiMap[]>('/api/public/v1/maps')
    return data.map(toGameMap)
  } catch (error) {
    logger.error('Failed to fetch maps', error)
    throw error
  }
}

export async function fetchMapsByEra(eraId: string): Promise<GameMap[]> {
  try {
    const data = await apiFetch<ApiMap[]>(`/api/public/v1/maps?eraId=${encodeURIComponent(eraId)}`)
    return data.map(toGameMap)
  } catch (error) {
    logger.error(`Failed to fetch maps by era — eraId: ${eraId}`, error)
    throw error
  }
}

export async function fetchMapById(id: string): Promise<GameMap> {
  try {
    const data = await apiFetch<ApiMap>(`/api/public/v1/maps/${id}`)
    return toGameMap(data)
  } catch (error) {
    logger.error(`Failed to fetch map by id — id: ${id}`, error)
    throw error
  }
}
