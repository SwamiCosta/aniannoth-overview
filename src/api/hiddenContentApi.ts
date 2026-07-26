import { logger } from '@/lib/logger'
import type { HiddenEntity, LinkedEntity } from '@/types/universe'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

export class HiddenContentAccessDeniedError extends Error {}
export class InvalidHiddenContentPasswordError extends Error {}

interface ApiLinkedEntity {
  type: string
  id: string
  name: string | null
  status: string | null
  hidden: boolean
}

interface ApiHiddenEntity {
  id: string
  name: string
  summary: string
  body: string
  images: string[] | null
  links?: ApiLinkedEntity[] | null
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

function toHiddenEntity(api: ApiHiddenEntity, type: string): HiddenEntity {
  return {
    id: api.id,
    type,
    name: api.name,
    summary: api.summary,
    body: api.body,
    images: api.images ?? [],
    links: (api.links ?? []).map(toLinkedEntity),
  }
}

export async function fetchHiddenContentRiddle(entityType: string, entityId: string): Promise<string> {
  const path = `/api/public/v1/hidden/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/riddle`
  try {
    const response = await fetch(`${BASE_URL}${path}`)
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${path}`)
    }
    const data = (await response.json()) as { riddleText: string }
    return data.riddleText
  } catch (error) {
    logger.error(`Failed to fetch hidden content riddle — entityType: ${entityType}, entityId: ${entityId}`, error)
    throw error
  }
}

export interface UnlockResult {
  token: string
  unlockedAll: boolean
  expiresAt: string
}

export async function unlockHiddenContent(
  entityType: string,
  entityId: string,
  password: string,
  existingToken: string | null,
): Promise<UnlockResult> {
  const path = `/api/public/v1/hidden/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/unlock`
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(existingToken ? { 'X-Hidden-Unlock-Token': existingToken } : {}),
      },
      body: JSON.stringify({ password }),
    })
    if (response.status === 401) {
      throw new InvalidHiddenContentPasswordError('The provided password does not unlock this hidden content')
    }
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${path}`)
    }
    return (await response.json()) as UnlockResult
  } catch (error) {
    if (!(error instanceof InvalidHiddenContentPasswordError)) {
      logger.error(`Failed to unlock hidden content — entityType: ${entityType}, entityId: ${entityId}`, error)
    }
    throw error
  }
}

export async function fetchHiddenEntity(entityType: string, entityId: string, token: string): Promise<HiddenEntity> {
  const path = `/api/public/v1/hidden/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-Hidden-Unlock-Token': token },
    })
    if (response.status === 403) {
      throw new HiddenContentAccessDeniedError('The unlock token is missing, invalid, or expired')
    }
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${path}`)
    }
    const data = (await response.json()) as ApiHiddenEntity
    return toHiddenEntity(data, entityType)
  } catch (error) {
    if (!(error instanceof HiddenContentAccessDeniedError)) {
      logger.error(`Failed to fetch hidden entity — entityType: ${entityType}, entityId: ${entityId}`, error)
    }
    throw error
  }
}
