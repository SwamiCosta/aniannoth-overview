import { useCallback, useState } from 'react'
import { unlockHiddenContent } from '@/api/hiddenContentApi'
import { logger } from '@/lib/logger'

const STORAGE_KEY = 'hiddenUnlockToken'

interface TokenPayload {
  unlockedKeys: string[]
  all: boolean
  expiresAtEpochMilli: number
}

function unlockedKey(entityType: string, entityId: string): string {
  return `${entityType.toUpperCase()}:${entityId}`
}

// Decodes the token's own payload for a client-side UI hint only (e.g. "is
// this already unlocked, show it without prompting again") — this never
// substitutes for server-side verification, which is what actually gates
// GET /api/public/v1/hidden/**. A tampered token would still be rejected
// there, it just wouldn't show up as "unlocked" here first.
function decodePayload(token: string): TokenPayload | null {
  try {
    const [encodedPayload] = token.split('.')
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as TokenPayload
  } catch (error) {
    logger.error('Failed to decode hidden unlock token payload', error)
    return null
  }
}

function readStoredToken(): string | null {
  const token = sessionStorage.getItem(STORAGE_KEY)
  if (!token) return null
  const payload = decodePayload(token)
  if (!payload || Date.now() >= payload.expiresAtEpochMilli) {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
  return token
}

export interface UseHiddenContentUnlockResult {
  token: string | null
  isUnlocked: (entityType: string, entityId: string) => boolean
  unlock: (entityType: string, entityId: string, password: string) => Promise<void>
}

export function useHiddenContentUnlock(): UseHiddenContentUnlockResult {
  const [token, setToken] = useState<string | null>(() => readStoredToken())

  const isUnlocked = useCallback(
    (entityType: string, entityId: string) => {
      if (!token) return false
      const payload = decodePayload(token)
      if (!payload || Date.now() >= payload.expiresAtEpochMilli) return false
      return payload.all || payload.unlockedKeys.includes(unlockedKey(entityType, entityId))
    },
    [token],
  )

  const unlock = useCallback(async (entityType: string, entityId: string, password: string) => {
    const result = await unlockHiddenContent(entityType, entityId, password, readStoredToken())
    sessionStorage.setItem(STORAGE_KEY, result.token)
    setToken(result.token)
  }, [])

  return { token, isUnlocked, unlock }
}
