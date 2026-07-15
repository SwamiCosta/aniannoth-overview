import { apiFetch } from './keynorCoreClient'
import type { PagedResponse } from './keynorCoreClient'
import type { Entity, FactionMember, LinkedEntity } from '@/types/universe'
import type { Language } from '@/context/LanguageContext'
import { logger } from '@/lib/logger'

interface ApiLinkedEntity {
  type: string
  id: string
  name: string
  status: string
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
  id: string
  name: string
  status: string
}

function toLinkedEntity(apiLink: ApiLinkedEntity): LinkedEntity {
  return {
    type: apiLink.type,
    id: apiLink.id,
    name: apiLink.name,
    status: apiLink.status.toLowerCase() as LinkedEntity['status'],
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
      era: api.timelineFoundedEra ?? '',
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

export async function fetchEntityById(category: string, id: string): Promise<Entity> {
  try {
    const data = await apiFetch<ApiEntity>(`/api/public/v1/${encodeURIComponent(category)}/${id}`)
    return toEntity(data, category)
  } catch (error) {
    logger.error(`Failed to fetch entity by id — category: ${category}, id: ${id}`, error)
    throw error
  }
}

// Endpoint contract is a proposal pending confirmation from Imaws (keynor-core) —
// batch-resolves entity ids to display-only summaries, regardless of category.
export async function fetchEntitiesBatch(ids: string[], language: Language): Promise<FactionMember[]> {
  try {
    const query = ids.map(id => encodeURIComponent(id)).join(',')
    const data = await apiFetch<ApiBatchEntity[]>(`/api/public/v1/entities/batch?ids=${query}&language=${language}`)
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
