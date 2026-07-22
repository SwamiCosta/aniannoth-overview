import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
