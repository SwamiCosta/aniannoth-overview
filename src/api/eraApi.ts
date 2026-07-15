import { apiFetch } from './keynorCoreClient'
import type { Era } from '@/types/universe'
import type { Language } from '@/context/LanguageContext'
import { logger } from '@/lib/logger'

interface ApiEra {
  id: string
  name: string
  order: number
  type: string
  importance: string | null
  description: string
  translationGroupId: string
}

function toEra(api: ApiEra): Era {
  return {
    id: api.id,
    name: api.name,
    order: api.order,
    type: (api.type as Era['type']) ?? 'ERA',
    importance: (api.importance ?? null) as Era['importance'],
    description: api.description,
    translationGroupId: api.translationGroupId,
  }
}

export async function fetchEras(language: Language): Promise<Era[]> {
  try {
    const data = await apiFetch<ApiEra[]>(`/api/public/v1/eras?language=${language}`)
    return data.map(toEra)
  } catch (error) {
    logger.error('Failed to fetch eras', error)
    throw error
  }
}

export async function fetchEraById(id: string): Promise<Era> {
  try {
    const data = await apiFetch<ApiEra>(`/api/public/v1/eras/${id}`)
    return toEra(data)
  } catch (error) {
    logger.error(`Failed to fetch era by id — id: ${id}`, error)
    throw error
  }
}
