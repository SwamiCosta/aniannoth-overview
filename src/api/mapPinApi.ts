import { apiFetch, apiFetchAuthenticated } from './keynorCoreClient'
import type { MapPin, LinkedEntity } from '@/types/universe'
import { logger } from '@/lib/logger'

interface ApiLinkedEntity {
  type: string
  id: string
  name: string | null
  status: string | null
  hidden: boolean
}

interface ApiMapPin {
  id: string
  mapId: string
  name: string | null
  entity: ApiLinkedEntity | null
  eraId: string | null
  normalizedX: number
  normalizedY: number
}

function toLinkedEntity(api: ApiLinkedEntity): LinkedEntity {
  return {
    type: api.type,
    id: api.id,
    name: api.name ?? '',
    status: (api.status?.toLowerCase() ?? 'draft') as LinkedEntity['status'],
    hidden: api.hidden,
  }
}

function toMapPin(api: ApiMapPin): MapPin {
  return {
    id: api.id,
    mapId: api.mapId,
    name: api.name,
    entity: api.entity ? toLinkedEntity(api.entity) : null,
    eraId: api.eraId,
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
  entityType?: string
  entityId?: string
  name?: string
  // Omitted (or undefined) means "all eras" — the pin persists across every
  // era the map is available in. A value scopes it to that era only.
  eraId?: string
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

export interface UpdateMapPinInput {
  normalizedX: number
  normalizedY: number
  // Full-replace: blank/omitted clears a custom name override (falls back to
  // the linked entity's name, if any). entityType/entityId omitted together
  // leaves the current link untouched; both present attaches/re-targets it.
  name?: string
  entityType?: string
  entityId?: string
  // Full-replace, same as normalizedX/normalizedY — always send the pin's
  // intended era scope explicitly (null for "all eras"), never omit it, or
  // the server will interpret the omission as null and clear the scope.
  eraId: string | null
}

export async function updateMapPin(mapId: string, pinId: string, input: UpdateMapPinInput, accessToken: string): Promise<MapPin> {
  try {
    const data = await apiFetchAuthenticated<ApiMapPin>(`/api/v1/maps/${encodeURIComponent(mapId)}/pins/${pinId}`, {
      method: 'PATCH',
      accessToken,
      body: input,
    })
    return toMapPin(data!)
  } catch (error) {
    logger.error(`Failed to update map pin — mapId: ${mapId}, pinId: ${pinId}`, error)
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
