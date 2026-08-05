import { apiFetch, apiFetchAuthenticated } from './keynorCoreClient'
import type { PagedResponse } from './keynorCoreClient'
import type { Entity, FactionMember, LinkedEntity } from '@/types/universe'
import type { Language } from '@/context/LanguageContext'
import { logger } from '@/lib/logger'

interface ApiLinkedEntity {
  type: string
  id: string
  name: string | null
  status: string | null
  hidden: boolean
}

interface ApiEntity {
  id: string
  name: string
  summary: string
  body: string
  categories: string[]
  status: string
  images: string[] | null | undefined
  timelineFoundedEra: string | null
  timelineDestroyedEra: string | null
  links?: ApiLinkedEntity[] | null
  // Only present on faction entities — list of member entity UUIDs, resolved
  // separately via fetchEntitiesBatch. See PR description for the pending
  // keynor-core PR #70 (Imperium) that introduces this field.
  members?: string[] | null
  translationGroupId: string
}

interface ApiBatchEntity {
  type: string
  id: string
  name: string
  status: string
}

function toLinkedEntity(apiLink: ApiLinkedEntity): LinkedEntity {
  return {
    type: apiLink.type,
    id: apiLink.id,
    name: apiLink.name ?? '',
    status: (apiLink.status?.toLowerCase() ?? 'draft') as LinkedEntity['status'],
    hidden: apiLink.hidden,
  }
}

function toEntity(api: ApiEntity, category: string): Entity {
  return {
    id: api.id,
    name: api.name,
    category,
    images: api.images ?? [],
    summary: api.summary,
    body: api.body,
    location: '',
    timeline: {
      founded: api.timelineFoundedEra,
      destroyed: api.timelineDestroyedEra,
    },
    status: api.status.toLowerCase() as Entity['status'],
    links: (api.links ?? []).map(toLinkedEntity),
    members: api.members ?? [],
    translationGroupId: api.translationGroupId,
  }
}

export async function fetchEntities(category: string, language: Language): Promise<Entity[]> {
  try {
    const data = await apiFetch<PagedResponse<ApiEntity>>(
      `/api/public/v1/${encodeURIComponent(category)}?size=100&language=${language}`,
    )
    return data.content.map(item => toEntity(item, category))
  } catch (error) {
    logger.error(`Failed to fetch entities — category: ${category}`, error)
    throw error
  }
}

// Same shape as fetchEntities, but hits the internal (/api/v1) listing
// instead of /api/public/v1 — the public endpoint deliberately excludes
// hidden entities (excludeHidden: true server-side, see keynor-core's
// hidden-content-implementation skill), which is correct for public browsing
// but wrong for the map-pin-target picker: a black pin's only purpose is to
// point at a hidden entity, so the picker needs to see it. Requires an
// authenticated admin session, matching the pin-creation call itself.
export async function fetchEntitiesForAuthoring(category: string, language: Language, accessToken: string): Promise<Entity[]> {
  try {
    const data = await apiFetchAuthenticated<PagedResponse<ApiEntity>>(
      `/api/v1/${encodeURIComponent(category)}?size=100&language=${language}`,
      { method: 'GET', accessToken },
    )
    return (data?.content ?? []).map(item => toEntity(item, category))
  } catch (error) {
    logger.error(`Failed to fetch entities for authoring — category: ${category}`, error)
    throw error
  }
}

export async function fetchEntityById(category: string, id: string): Promise<Entity> {
  try {
    const data = await apiFetch<ApiEntity>(`/api/public/v1/${encodeURIComponent(category)}/${id}`)
    return toEntity(data, category)
  } catch (error) {
    logger.error(`Failed to fetch entity by id — category: ${category}, id: ${id}`, error)
    throw error
  }
}

// Confirmed contract (keynor-core PR #71, Imaws): batch-resolves Character ids
// only — Faction.members is the only field this currently backs. No language
// param — each id already pins a specific language row, unlike fetchEntities.
export async function fetchEntitiesBatch(ids: string[]): Promise<FactionMember[]> {
  try {
    const query = ids.map(id => encodeURIComponent(id)).join(',')
    const data = await apiFetch<ApiBatchEntity[]>(`/api/public/v1/characters/batch?ids=${query}`)
    return data.map(item => ({
      id: item.id,
      name: item.name,
      status: item.status.toLowerCase() as FactionMember['status'],
    }))
  } catch (error) {
    logger.error(`Failed to fetch entity batch — ids: ${ids.join(',')}`, error)
    throw error
  }
}
