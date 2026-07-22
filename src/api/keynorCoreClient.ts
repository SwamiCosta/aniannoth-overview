const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(status: number, path: string) {
    super(`API error ${status}: ${path}`)
    this.status = status
  }
}

export async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`)
  }
  return response.json() as Promise<T>
}

interface AuthenticatedFetchOptions {
  method: 'POST' | 'DELETE'
  accessToken: string
  body?: unknown
}

/**
 * For internal (/api/v1/**) endpoints that require a Bearer JWT — currently
 * only the map pin create/delete endpoints, restricted server-side to ADMIN.
 * Hiding the calling UI from readers is not what enforces this; the server does.
 */
export async function apiFetchAuthenticated<T>(path: string, options: AuthenticatedFetchOptions): Promise<T | undefined> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!response.ok) {
    throw new ApiError(response.status, path)
  }
  if (response.status === 204) return undefined
  return response.json() as Promise<T>
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
}
