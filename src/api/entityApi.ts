import { apiFetch } from './keynorCoreClient'
import type { PagedResponse } from './keynorCoreClient'
import type { Entity } from '@/types/universe'

interface ApiEntity {
  id: string
  name: string
  summary: string
  body: string
  tags: string[]
  categories: string[]
  status: string
  timelineFoundedEra: string | null
  timelineDestroyedEra: string | null
}

function toEntity(api: ApiEntity, category: string): Entity {
  return {
    id: api.id,
    name: api.name,
    category,
    tags: api.tags,
    image: '',
    summary: api.summary,
    body: api.body,
    location: '',
    timeline: {
      era: api.timelineFoundedEra ?? '',
    },
    status: api.status.toLowerCase() as Entity['status'],
  }
}

export async function fetchEntities(category: string): Promise<Entity[]> {
  const data = await apiFetch<PagedResponse<ApiEntity>>(
    `/api/public/v1/${encodeURIComponent(category)}?size=100`,
  )
  return data.content.map(item => toEntity(item, category))
}

export async function fetchEntityById(category: string, id: string): Promise<Entity> {
  const data = await apiFetch<ApiEntity>(`/api/public/v1/${encodeURIComponent(category)}/${id}`)
  return toEntity(data, category)
}
