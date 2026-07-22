import { StrictMode } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

function RoleProbe() {
  const auth = useAuth()
  return <span data-testid="role">{auth.role}</span>
}

function renderWithAuth() {
  return render(
    <MemoryRouter initialEntries={['/explore']}>
      <AuthProvider>
        <RoleProbe />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('defaults to the reader role when no access token is present', () => {
    renderWithAuth()
    expect(screen.getByTestId('role')).toHaveTextContent('reader')
  })

  it('resolves to the inputter role when a session already holds an access token', () => {
    sessionStorage.setItem('aniannoth_access_token', 'a-valid-token')
    renderWithAuth()
    expect(screen.getByTestId('role')).toHaveTextContent('inputter')
  })
})

describe('AuthContext PKCE callback', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    window.history.pushState({}, '', '/')
  })

  // Rendered under StrictMode because the real bug this guards against (a
  // second effect invocation consuming an already-cleared PKCE verifier from
  // sessionStorage) is a StrictMode double-invoke effect. Note: this test
  // passes even without the processedCodeRef guard in AuthContext.tsx —
  // Vitest/jsdom does not reproduce React's dev-mode double-invoke here, so
  // this only confirms the callback still succeeds normally; it does not by
  // itself prove the double-invoke race is fixed. That needs a real browser check.
  it('completes the token exchange on a normal (single) callback invocation', async () => {
    sessionStorage.setItem('aniannoth_pkce_verifier', 'test-verifier')
    sessionStorage.setItem('aniannoth_pkce_state', 'test-state')
    window.history.pushState({}, '', '/auth/callback?code=test-code&state=test-state')

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'issued-token' }),
    }) as unknown as typeof fetch

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/auth/callback?code=test-code&state=test-state']}>
          <AuthProvider>
            <RoleProbe />
          </AuthProvider>
        </MemoryRouter>
      </StrictMode>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('inputter')
    })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
})
