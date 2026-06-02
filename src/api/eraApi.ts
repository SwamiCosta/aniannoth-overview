import { apiFetch } from './keynorCoreClient'
import type { Era } from '@/types/universe'

interface ApiEra {
  id: string
  name: string
  eraOrder: number
  period: string
  summary: string
  mapType: string
  defaultMap: string
  color: string
}

function toEra(api: ApiEra): Era {
  return {
    id: api.id,
    name: api.name,
    order: api.eraOrder,
    period: api.period,
    summary: api.summary,
    mapType: api.mapType.toLowerCase() as Era['mapType'],
    defaultMap: api.defaultMap,
    color: api.color,
  }
}

export async function fetchEras(): Promise<Era[]> {
  const data = await apiFetch<ApiEra[]>('/api/public/v1/eras')
  return data.map(toEra)
}

export async function fetchEraById(id: string): Promise<Era> {
  const data = await apiFetch<ApiEra>(`/api/public/v1/eras/${id}`)
  return toEra(data)
}
