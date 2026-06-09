import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import DetailPanel from './DetailPanel'

// ---------------------------------------------------------------------------
// Mock the API modules so tests run without a real backend.
// ---------------------------------------------------------------------------

vi.mock('@/api/eraApi', () => ({
  fetchEras: vi.fn(),
}))

vi.mock('@/api/mapApi', () => ({
  fetchMaps: vi.fn(),
}))

vi.mock('@/api/entityApi', () => ({
  fetchEntities: vi.fn(),
}))

import { fetchEras } from '@/api/eraApi'
import { fetchMaps } from '@/api/mapApi'
import { fetchEntities } from '@/api/entityApi'

const mockFetchEras = vi.mocked(fetchEras)
const mockFetchMaps = vi.mocked(fetchMaps)
const mockFetchEntities = vi.mocked(fetchEntities)

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  order: 0,
  period: 'Before Creation',
  summary: '',
  mapType: 'abstract' as const,
  defaultMap: 'omniverse',
  color: '#7c3aed',
}

const MAP_OMNIVERSE = {
  id: 'omniverse',
  name: 'The Omniverse',
  type: 'abstract' as const,
  image: '',
  availableInEras: ['primordial'],
}

const TEST_ENTITY = {
  id: 'entity-999',
  name: 'Verath the Unbound',
  category: 'characters',
  tags: ['ancient', 'divine'],
  images: [],
  summary: 'A being from before time.',
  body: '## Origins\n\nVerath existed before the first dawn.',
  location: '',
  timeline: { era: 'primordial' },
  status: 'canon' as const,
}

// ---------------------------------------------------------------------------
// Helper — renders the DetailPanel alongside a control button
// that lets a test set/clear selectedEntityId in context.
// ---------------------------------------------------------------------------

function ControlledWrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}

function SelectEntityButton({ entityId }: { entityId: string | null }) {
  const ctx = useAppContext()
  const label = entityId ? `select-${entityId}` : 'clear-entity'
  return (
    <button onClick={() => ctx.setSelectedEntity(entityId)}>{label}</button>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DetailPanel', () => {
  beforeEach(() => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL])
    mockFetchMaps.mockResolvedValue([MAP_OMNIVERSE])
    mockFetchEntities.mockImplementation(async (category: string) => {
      if (category === 'characters') return [TEST_ENTITY]
      return []
    })
  })

  it('shows the collapsed placeholder when selectedEntityId is null', async () => {
    render(
      <ControlledWrapper>
        <DetailPanel />
      </ControlledWrapper>,
    )

    // When no entity is selected, the panel renders a short placeholder bar
    // with the text "Select an entity to view details"
    expect(await screen.findByText('Select an entity to view details')).toBeInTheDocument()
  })

  it('renders the entity name when selectedEntityId is set to a known entity', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={TEST_ENTITY.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    // Set the selected entity via the control button
    await act(async () => {
      screen.getByText(`select-${TEST_ENTITY.id}`).click()
    })

    // The entity name must appear in the panel
    expect(await screen.findByText('Verath the Unbound')).toBeInTheDocument()
  })

  it('clicking the close button calls setSelectedEntity(null) and hides the panel', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={TEST_ENTITY.id} />
        <SelectEntityButton entityId={null} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    // Open the panel
    await act(async () => {
      screen.getByText(`select-${TEST_ENTITY.id}`).click()
    })
    expect(await screen.findByText('Verath the Unbound')).toBeInTheDocument()

    // Click the close button (aria-label="Close detail panel")
    const closeButton = screen.getByRole('button', { name: 'Close detail panel' })
    await act(async () => { closeButton.click() })

    // The panel should now show the placeholder instead of the entity name
    await waitFor(() => {
      expect(screen.queryByText('Verath the Unbound')).not.toBeInTheDocument()
      expect(screen.getByText('Select an entity to view details')).toBeInTheDocument()
    })
  })
})
