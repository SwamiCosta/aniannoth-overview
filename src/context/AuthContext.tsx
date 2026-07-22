import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce'
import { logger } from '@/lib/logger'

const AUTH_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'
const ADMIN_CLIENT_ID = (import.meta.env.VITE_ADMIN_CLIENT_ID as string | undefined) ?? 'aniannoth-admin'
const REDIRECT_PATH = '/auth/callback'

const VERIFIER_KEY = 'aniannoth_pkce_verifier'
const STATE_KEY = 'aniannoth_pkce_state'
const TOKEN_KEY = 'aniannoth_access_token'

// Single fixed inputter (see project-map-pins design decision): possessing a
// valid access token — obtainable only through the ADMIN human login flow —
// is itself what makes this session "inputter" rather than "reader". There is
// no separate role lookup call; the token's mere presence is the signal.
export type UserRole = 'inputter' | 'reader'

interface AuthContextValue {
  role: UserRole
  accessToken: string | null
  isAuthenticating: boolean
  login: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function redirectUri(): string {
  return `${window.location.origin}${REDIRECT_PATH}`
}

async function exchangeCodeForToken(code: string, verifier: string): Promise<string> {
  const response = await fetch(`${AUTH_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: ADMIN_CLIENT_ID,
      code_verifier: verifier,
    }),
  })
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`)
  }
  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY))
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const navigate = useNavigate()
  // React StrictMode (dev only) intentionally runs this effect twice. Without
  // this guard, the first run consumes and clears the PKCE verifier/state from
  // sessionStorage, then the second run reads an already-empty sessionStorage
  // and rejects a callback the first run was already correctly processing.
  const processedCodeRef = useRef<string | null>(null)

  useEffect(() => {
    if (window.location.pathname !== REDIRECT_PATH) return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    if (code && processedCodeRef.current === code) return
    if (code) processedCodeRef.current = code

    const storedState = sessionStorage.getItem(STATE_KEY)
    const verifier = sessionStorage.getItem(VERIFIER_KEY)
    sessionStorage.removeItem(STATE_KEY)
    sessionStorage.removeItem(VERIFIER_KEY)

    if (!code || !state || !verifier || state !== storedState) {
      logger.error('PKCE callback rejected: missing code/state or state mismatch')
      navigate('/explore', { replace: true })
      return
    }

    setIsAuthenticating(true)
    exchangeCodeForToken(code, verifier)
      .then(token => {
        setAccessToken(token)
        sessionStorage.setItem(TOKEN_KEY, token)
      })
      .catch(err => logger.error('Failed to exchange authorization code for token', err))
      .finally(() => {
        setIsAuthenticating(false)
        navigate('/explore', { replace: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()
    sessionStorage.setItem(VERIFIER_KEY, verifier)
    sessionStorage.setItem(STATE_KEY, state)

    const authorizeUrl = new URL(`${AUTH_BASE_URL}/oauth2/authorize`)
    authorizeUrl.searchParams.set('response_type', 'code')
    authorizeUrl.searchParams.set('client_id', ADMIN_CLIENT_ID)
    authorizeUrl.searchParams.set('redirect_uri', redirectUri())
    authorizeUrl.searchParams.set('scope', 'openid')
    authorizeUrl.searchParams.set('code_challenge', challenge)
    authorizeUrl.searchParams.set('code_challenge_method', 'S256')
    authorizeUrl.searchParams.set('state', state)

    window.location.href = authorizeUrl.toString()
  }, [])

  const logout = useCallback(() => {
    setAccessToken(null)
    sessionStorage.removeItem(TOKEN_KEY)
  }, [])

  const role: UserRole = accessToken ? 'inputter' : 'reader'

  return (
    <AuthContext.Provider value={{ role, accessToken, isAuthenticating, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
