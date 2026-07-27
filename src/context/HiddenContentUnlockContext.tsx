import { createContext, useContext, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
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

export interface HiddenContentUnlockContextValue {
  token: string | null
  isUnlocked: (entityType: string, entityId: string) => boolean
  unlock: (entityType: string, entityId: string, password: string) => Promise<void>
}

const HiddenContentUnlockContext = createContext<HiddenContentUnlockContextValue | null>(null)

// A single, app-wide unlock state. Previously this was a plain hook with its
// own local useState, called independently from the map pin, the entity
// picker overlay, the related-entities links, and the hidden entity detail
// panel — each call site got its own isolated copy of `token`, so unlocking
// content in one place (which writes the new token to sessionStorage) never
// updated the `token` any of the other already-mounted call sites were
// holding onto. Two symptoms were reported from that: (1) re-clicking an
// already-unlocked black pin asked for the password again, because the map's
// own stale `token` never saw the unlock that happened inside the modal's
// separate hook instance, and (2) unlocking a hidden entity linked from
// another hidden entity failed to load ("unlock may have expired"), because
// the already-mounted detail panel kept the token captured when its own
// hidden entity was first opened, never the newer one returned after
// unlocking the link. A Context makes `token` one shared value that every
// consumer re-renders from, matching AuthContext/AppContext's own pattern in
// this app.
export function HiddenContentUnlockProvider({ children }: { children: ReactNode }) {
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

  return (
    <HiddenContentUnlockContext.Provider value={{ token, isUnlocked, unlock }}>
      {children}
    </HiddenContentUnlockContext.Provider>
  )
}

export function useHiddenContentUnlock(): HiddenContentUnlockContextValue {
  const ctx = useContext(HiddenContentUnlockContext)
  if (!ctx) throw new Error('useHiddenContentUnlock must be used inside HiddenContentUnlockProvider')
  return ctx
}
