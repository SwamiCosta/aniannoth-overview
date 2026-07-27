import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HiddenContentUnlockProvider, useHiddenContentUnlock } from './HiddenContentUnlockContext'

vi.mock('@/api/hiddenContentApi', () => ({
  unlockHiddenContent: vi.fn(),
}))

import { unlockHiddenContent } from '@/api/hiddenContentApi'

const mockUnlockHiddenContent = vi.mocked(unlockHiddenContent)

function makeToken(unlockedKeys: string[], expiresInMs = 2 * 60 * 60 * 1000): string {
  const payload = { unlockedKeys, all: false, expiresAtEpochMilli: Date.now() + expiresInMs }
  const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_')
  return `${encoded}.fake-signature`
}

// Two independent consumers under the same provider — this is what a
// black-pin click (one component tree) and the modal that unlocks it
// (a different component tree) actually look like in the app.
function UnlockedProbe({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { isUnlocked } = useHiddenContentUnlock()
  return <span data-testid="unlocked">{String(isUnlocked(entityType, entityId))}</span>
}

function UnlockButton({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { unlock } = useHiddenContentUnlock()
  return <button onClick={() => { void unlock(entityType, entityId, 'correct-password') }}>unlock</button>
}

describe('HiddenContentUnlockContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('shares the unlocked state across independent consumers under the same provider', async () => {
    mockUnlockHiddenContent.mockResolvedValue({
      token: makeToken(['CHARACTER:punic']),
      unlockedAll: false,
      expiresAt: new Date().toISOString(),
    })

    render(
      <HiddenContentUnlockProvider>
        <UnlockedProbe entityType="character" entityId="punic" />
        <UnlockButton entityType="character" entityId="punic" />
      </HiddenContentUnlockProvider>,
    )

    expect(screen.getByTestId('unlocked')).toHaveTextContent('false')
    fireEvent.click(screen.getByRole('button', { name: 'unlock' }))

    // The probe never re-mounts and never calls unlock() itself — it can only
    // observe the flip if the two components share one token, not two.
    await waitFor(() => expect(screen.getByTestId('unlocked')).toHaveTextContent('true'))
  })

  it('does not report a different, never-unlocked entity as unlocked', async () => {
    mockUnlockHiddenContent.mockResolvedValue({
      token: makeToken(['CHARACTER:punic']),
      unlockedAll: false,
      expiresAt: new Date().toISOString(),
    })

    render(
      <HiddenContentUnlockProvider>
        <UnlockedProbe entityType="lore" entityId="black-pages-book" />
        <UnlockButton entityType="character" entityId="punic" />
      </HiddenContentUnlockProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'unlock' }))

    await waitFor(() => expect(mockUnlockHiddenContent).toHaveBeenCalled())
    expect(screen.getByTestId('unlocked')).toHaveTextContent('false')
  })

  it('throws when used outside HiddenContentUnlockProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<UnlockedProbe entityType="character" entityId="punic" />)).toThrow(
      'useHiddenContentUnlock must be used inside HiddenContentUnlockProvider',
    )
    consoleError.mockRestore()
  })
})
