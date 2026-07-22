import { apiFetch, apiFetchAuthenticated } from './keynorCoreClient'
import type { MapPin, LinkedEntity } from '@/types/universe'
import { logger } from '@/lib/logger'

interface ApiLinkedEntity {
  type: string
  id: string
  name: string
  status: string
}

interface ApiMapPin {
  id: string
  mapId: string
  entity: ApiLinkedEntity
  normalizedX: number
  normalizedY: number
}

function toLinkedEntity(api: ApiLinkedEntity): LinkedEntity {
  return {
    type: api.type,
    id: api.id,
    name: api.name,
    status: api.status.toLowerCase() as LinkedEntity['status'],
  }
}

function toMapPin(api: ApiMapPin): MapPin {
  return {
    id: api.id,
    mapId: api.mapId,
    entity: toLinkedEntity(api.entity),
    normalizedX: api.normalizedX,
    normalizedY: api.normalizedY,
  }
}

export async function fetchMapPins(mapId: string): Promise<MapPin[]> {
  try {
    const data = await apiFetch<ApiMapPin[]>(`/api/public/v1/maps/${encodeURIComponent(mapId)}/pins`)
    return data.map(toMapPin)
  } catch (error) {
    logger.error(`Failed to fetch map pins — mapId: ${mapId}`, error)
    throw error
  }
}

export interface CreateMapPinInput {
  entityType: string
  entityId: string
  normalizedX: number
  normalizedY: number
}

export async function createMapPin(mapId: string, input: CreateMapPinInput, accessToken: string): Promise<MapPin> {
  try {
    const data = await apiFetchAuthenticated<ApiMapPin>(`/api/v1/maps/${encodeURIComponent(mapId)}/pins`, {
      method: 'POST',
      accessToken,
      body: input,
    })
    return toMapPin(data!)
  } catch (error) {
    logger.error(`Failed to create map pin — mapId: ${mapId}`, error)
    throw error
  }
}

export async function deleteMapPin(mapId: string, pinId: string, accessToken: string): Promise<void> {
  try {
    await apiFetchAuthenticated<void>(`/api/v1/maps/${encodeURIComponent(mapId)}/pins/${pinId}`, {
      method: 'DELETE',
      accessToken,
    })
  } catch (error) {
    logger.error(`Failed to delete map pin — mapId: ${mapId}, pinId: ${pinId}`, error)
    throw error
  }
}
