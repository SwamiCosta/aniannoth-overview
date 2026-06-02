const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

export async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`)
  }
  return response.json() as Promise<T>
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
}
