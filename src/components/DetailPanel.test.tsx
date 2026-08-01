import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { HiddenContentUnlockProvider } from '@/context/HiddenContentUnlockContext'
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
  fetchEntitiesBatch: vi.fn(),
}))

import { fetchEras } from '@/api/eraApi'
import { fetchMaps } from '@/api/mapApi'
import { fetchEntities, fetchEntitiesBatch } from '@/api/entityApi'

const mockFetchEras = vi.mocked(fetchEras)
const mockFetchMaps = vi.mocked(fetchMaps)
const mockFetchEntities = vi.mocked(fetchEntities)
const mockFetchEntitiesBatch = vi.mocked(fetchEntitiesBatch)

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  order: 0,
  type: 'ERA' as const,
  importance: null,
  description: '',
  translationGroupId: 'primordial-group',
  links: [],
}

const POINT_SUNDERING = {
  id: 'point-sundering',
  name: 'The Great Sundering',
  order: 1,
  type: 'POINT' as const,
  importance: 'MAJOR' as const,
  description: 'The moment the material world split from the Omniverse.',
  translationGroupId: 'sundering-group',
  links: [],
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
  images: [],
  summary: 'A being from before time.',
  body: '## Origins\n\nVerath existed before the first dawn.',
  location: '',
  timeline: { founded: 'primordial', destroyed: null },
  status: 'canon' as const,
  links: [],
  members: [],
  translationGroupId: 'verath-group',
}

const LINKED_CANON_PLACE = {
  type: 'PLACE',
  id: 'place-001',
  name: 'The Hollow Spire',
  status: 'canon' as const,
  hidden: false,
}

const LINKED_DRAFT_CHARACTER = {
  type: 'CHARACTER',
  id: 'char-draft-001',
  name: 'An Unfinished Soul',
  status: 'draft' as const,
  hidden: false,
}

const POINT_WITH_LINKS = {
  ...POINT_SUNDERING,
  id: 'point-with-links',
  links: [LINKED_CANON_PLACE],
}

const ENTITY_WITH_LINKS = {
  ...TEST_ENTITY,
  id: 'entity-with-links',
  name: 'Lore of the Hollow Spire',
  category: 'lore',
  links: [LINKED_CANON_PLACE, LINKED_DRAFT_CHARACTER],
}

const ENTITY_WITH_IMAGES = {
  ...TEST_ENTITY,
  id: 'entity-with-images',
  name: 'The Hollow Spire',
  category: 'places',
  images: ['https://example.com/spire-1.jpg', 'https://example.com/spire-2.jpg'],
}

const ENTITY_WITH_ONE_IMAGE = {
  ...TEST_ENTITY,
  id: 'entity-with-one-image',
  name: 'The Lone Watcher',
  category: 'places',
  images: ['https://example.com/watcher-1.jpg'],
}

const LINKED_RESOLVABLE_CHARACTER = {
  type: 'CHARACTER',
  id: TEST_ENTITY.id,
  name: TEST_ENTITY.name,
  status: 'canon' as const,
  hidden: false,
}

const ENTITY_WITH_RESOLVABLE_LINK = {
  ...TEST_ENTITY,
  id: 'entity-with-resolvable-link',
  name: 'Lore Pointing to Verath',
  category: 'lore',
  links: [LINKED_RESOLVABLE_CHARACTER],
}

const FACTION_MEMBER_CANON = { id: 'member-canon', name: 'Kessa Ironvow', status: 'canon' as const }
const FACTION_MEMBER_DRAFT = { id: 'member-draft', name: 'An Unnamed Recruit', status: 'draft' as const }

const ENTITY_FACTION_WITH_MEMBERS = {
  ...TEST_ENTITY,
  id: 'entity-faction-with-members',
  name: 'The Hollow Concord',
  category: 'factions',
  members: [FACTION_MEMBER_CANON.id, FACTION_MEMBER_DRAFT.id],
}

const ENTITY_FACTION_NO_MEMBERS = {
  ...TEST_ENTITY,
  id: 'entity-faction-no-members',
  name: 'The Silent Order',
  category: 'factions',
  members: [],
}

// ---------------------------------------------------------------------------
// Helper — renders the DetailPanel alongside a control button
// that lets a test set/clear selectedEntityId in context.
// ---------------------------------------------------------------------------

function ControlledWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AppProvider>
        <HiddenContentUnlockProvider>{children}</HiddenContentUnlockProvider>
      </AppProvider>
    </LanguageProvider>
  )
}

function SelectEntityButton({ entityId }: { entityId: string | null }) {
  const ctx = useAppContext()
  const label = entityId ? `select-${entityId}` : 'clear-entity'
  return (
    <button onClick={() => ctx.setSelectedEntity(entityId)}>{label}</button>
  )
}

function OpenTimelineDetailButton({ entryId }: { entryId: string }) {
  const ctx = useAppContext()
  return (
    <button onClick={() => ctx.openTimelineDetail(entryId)}>{`open-detail-${entryId}`}</button>
  )
}

function EraInspector() {
  const ctx = useAppContext()
  return <span data-testid="selected-era">{ctx.selectedEra}</span>
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
      if (category === 'lore') return [ENTITY_WITH_LINKS, ENTITY_WITH_RESOLVABLE_LINK]
      if (category === 'places') return [ENTITY_WITH_IMAGES, ENTITY_WITH_ONE_IMAGE]
      if (category === 'factions') return [ENTITY_FACTION_WITH_MEMBERS, ENTITY_FACTION_NO_MEMBERS]
      return []
    })
    mockFetchEntitiesBatch.mockResolvedValue([FACTION_MEMBER_CANON, FACTION_MEMBER_DRAFT])
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

  it('renders the Related entities section only when the entity has links', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={TEST_ENTITY.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${TEST_ENTITY.id}`).click()
    })

    // TEST_ENTITY has no links, so the section must not render
    expect(await screen.findByText('Verath the Unbound')).toBeInTheDocument()
    expect(screen.queryByText('Related entities')).not.toBeInTheDocument()
  })

  it('shows linked entities and calls setSelectedEntity with the right id on click', async () => {
    function Inspector() {
      const ctx = useAppContext()
      return (
        <span data-testid="context-state">
          {JSON.stringify({ selectedEntityId: ctx.selectedEntityId, category: ctx.filters.category })}
        </span>
      )
    }

    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_WITH_LINKS.id} />
        <Inspector />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_LINKS.id}`).click()
    })

    expect(await screen.findByText('Related entities')).toBeInTheDocument()
    expect(screen.getByText(LINKED_CANON_PLACE.name)).toBeInTheDocument()
    expect(screen.getByText(LINKED_DRAFT_CHARACTER.name)).toBeInTheDocument()

    // Click the canon (available) linked entity
    const canonLink = screen.getByRole('button', { name: new RegExp(LINKED_CANON_PLACE.name) })
    await act(async () => { canonLink.click() })

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId('context-state').textContent ?? '{}')
      expect(state.selectedEntityId).toBe(LINKED_CANON_PLACE.id)
      expect(state.category).toBe('places')
    })
  })

  it('renders non-canon linked entities as disabled with a tooltip, not clickable', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_WITH_LINKS.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_LINKS.id}`).click()
    })

    const draftLink = await screen.findByText(LINKED_DRAFT_CHARACTER.name)

    // The draft link must not be a button (not clickable) and must carry a tooltip
    expect(draftLink.closest('button')).toBeNull()
    const disabledElement = draftLink.closest('[aria-disabled="true"]')
    expect(disabledElement).not.toBeNull()
    expect(disabledElement).toHaveAttribute('title', 'Not available in the public atlas')
  })

  it('renders faction members as clickable pills and calls setSelectedEntity on click', async () => {
    function Inspector() {
      const ctx = useAppContext()
      return <span data-testid="context-state">{JSON.stringify({ selectedEntityId: ctx.selectedEntityId })}</span>
    }

    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_FACTION_WITH_MEMBERS.id} />
        <Inspector />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_FACTION_WITH_MEMBERS.id}`).click()
    })

    expect(await screen.findByText('Members')).toBeInTheDocument()
    const canonMemberPill = await screen.findByRole('button', { name: FACTION_MEMBER_CANON.name })

    await act(async () => { canonMemberPill.click() })

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId('context-state').textContent ?? '{}')
      expect(state.selectedEntityId).toBe(FACTION_MEMBER_CANON.id)
    })
  })

  it('renders non-canon faction members as disabled with a tooltip, not clickable', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_FACTION_WITH_MEMBERS.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_FACTION_WITH_MEMBERS.id}`).click()
    })

    const draftMemberPill = await screen.findByText(FACTION_MEMBER_DRAFT.name)
    expect(draftMemberPill.closest('button')).toBeNull()
    const disabledElement = draftMemberPill.closest('[aria-disabled="true"]')
    expect(disabledElement).not.toBeNull()
    expect(disabledElement).toHaveAttribute('title', 'Not available in the public atlas')
  })

  it('does not render the Members section when the faction has no members', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_FACTION_NO_MEMBERS.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_FACTION_NO_MEMBERS.id}`).click()
    })

    expect(await screen.findByText('The Silent Order')).toBeInTheDocument()
    expect(screen.queryByText('Members')).not.toBeInTheDocument()
  })

  it('shows the era detail when openTimelineDetail is called with an era id', async () => {
    render(
      <ControlledWrapper>
        <OpenTimelineDetailButton entryId={ERA_PRIMORDIAL.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`open-detail-${ERA_PRIMORDIAL.id}`).click()
    })

    expect(await screen.findByText(ERA_PRIMORDIAL.name)).toBeInTheDocument()
  })

  it('shows the point detail when openTimelineDetail is called with a point id, without changing the selected era', async () => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_SUNDERING])

    render(
      <ControlledWrapper>
        <EraInspector />
        <OpenTimelineDetailButton entryId={POINT_SUNDERING.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await waitFor(() => expect(screen.getByTestId('selected-era').textContent).toBe(ERA_PRIMORDIAL.id))

    await act(async () => {
      screen.getByText(`open-detail-${POINT_SUNDERING.id}`).click()
    })

    // The point's own name and description are shown
    expect(await screen.findByText(POINT_SUNDERING.name)).toBeInTheDocument()
    expect(screen.getByText(POINT_SUNDERING.description)).toBeInTheDocument()

    // The map-driving era selection is untouched
    expect(screen.getByTestId('selected-era').textContent).toBe(ERA_PRIMORDIAL.id)
  })

  it('shows related entities below a timeline entry description when it has links', async () => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_WITH_LINKS])

    render(
      <ControlledWrapper>
        <OpenTimelineDetailButton entryId={POINT_WITH_LINKS.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`open-detail-${POINT_WITH_LINKS.id}`).click()
    })

    expect(await screen.findByText(LINKED_CANON_PLACE.name)).toBeInTheDocument()
  })

  it('clicking the close button hides the timeline detail panel', async () => {
    render(
      <ControlledWrapper>
        <OpenTimelineDetailButton entryId={ERA_PRIMORDIAL.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`open-detail-${ERA_PRIMORDIAL.id}`).click()
    })
    expect(await screen.findByText(ERA_PRIMORDIAL.name)).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: 'Close timeline detail panel' })
    await act(async () => { closeButton.click() })

    await waitFor(() => {
      expect(screen.queryByText(ERA_PRIMORDIAL.name)).not.toBeInTheDocument()
      expect(screen.getByText('Select an entity to view details')).toBeInTheDocument()
    })
  })

  it('expanding the reading view shows the full body and collapses back', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={TEST_ENTITY.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${TEST_ENTITY.id}`).click()
    })

    await screen.findByText('Verath existed before the first dawn.')
    expect(screen.getAllByText('Verath existed before the first dawn.')).toHaveLength(1)

    const expandButton = screen.getByRole('button', { name: 'Expand reading view' })
    await act(async () => { expandButton.click() })

    expect(screen.getAllByText('Verath existed before the first dawn.')).toHaveLength(2)
    const collapseButton = screen.getByRole('button', { name: 'Collapse reading view' })

    await act(async () => { collapseButton.click() })

    expect(screen.getAllByText('Verath existed before the first dawn.')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Collapse reading view' })).not.toBeInTheDocument()
  })

  it('clicking the main image opens a fullscreen image viewer', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_WITH_IMAGES.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_IMAGES.id}`).click()
    })

    const expandImageButton = await screen.findByRole('button', { name: 'Expand image' })
    await act(async () => { expandImageButton.click() })

    expect(screen.getByRole('button', { name: 'Close image viewer' })).toBeInTheDocument()
    // The lightbox image renders alongside the gallery's own (now-hidden-behind-overlay) image
    const fullscreenImages = screen.getAllByAltText(`${ENTITY_WITH_IMAGES.name} — image 1 of 2`)
    expect(fullscreenImages.some(img => img.className.includes('object-contain'))).toBe(true)
  })

  it('navigates between images inside the fullscreen viewer and closes it', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_WITH_IMAGES.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_IMAGES.id}`).click()
    })

    const expandImageButton = await screen.findByRole('button', { name: 'Expand image' })
    await act(async () => { expandImageButton.click() })

    const nextButton = screen.getByRole('button', { name: 'Next image (fullscreen)' })
    await act(async () => { nextButton.click() })

    const fullscreenImages = screen.getAllByAltText(`${ENTITY_WITH_IMAGES.name} — image 2 of 2`)
    expect(fullscreenImages.some(img => img.className.includes('object-contain'))).toBe(true)

    const closeButton = screen.getByRole('button', { name: 'Close image viewer' })
    await act(async () => { closeButton.click() })

    expect(screen.queryByRole('button', { name: 'Close image viewer' })).not.toBeInTheDocument()
  })

  it('resets the image index when switching to a different entity with fewer images', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_WITH_IMAGES.id} />
        <SelectEntityButton entityId={ENTITY_WITH_ONE_IMAGE.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_IMAGES.id}`).click()
    })

    const nextButton = await screen.findByRole('button', { name: 'Next image' })
    await act(async () => { nextButton.click() })
    expect(screen.getByAltText(`${ENTITY_WITH_IMAGES.name} — image 2 of 2`)).toBeInTheDocument()

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_ONE_IMAGE.id}`).click()
    })

    const resetImage = await screen.findByAltText(`${ENTITY_WITH_ONE_IMAGE.name} — image 1 of 1`)
    expect(resetImage).toHaveAttribute('src', ENTITY_WITH_ONE_IMAGE.images[0])
    expect(screen.queryByAltText(/image 2 of 1/)).not.toBeInTheDocument()
  })

  it('shows Related entities inside the expanded reading view and keeps it expanded after navigating to one', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_WITH_RESOLVABLE_LINK.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_RESOLVABLE_LINK.id}`).click()
    })

    const expandButton = await screen.findByRole('button', { name: 'Expand reading view' })
    await act(async () => { expandButton.click() })

    // "Related entities" renders both in the (now-hidden-behind-overlay) collapsed view
    // and in the expanded view itself — either instance triggers the same navigation.
    expect(screen.getAllByText('Related entities').length).toBeGreaterThan(0)

    const relatedLinks = screen.getAllByRole('button', { name: new RegExp(TEST_ENTITY.name) })
    await act(async () => { relatedLinks[0].click() })

    // Same coexistence pattern: the resolved entity's body renders in both the
    // collapsed view (hidden behind the overlay) and the still-expanded overlay.
    await waitFor(() => {
      expect(screen.getAllByText('Verath existed before the first dawn.').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Collapse reading view' })).toBeInTheDocument()
  })

  it('shows an image gallery beside the text in the expanded reading view', async () => {
    render(
      <ControlledWrapper>
        <SelectEntityButton entityId={ENTITY_WITH_IMAGES.id} />
        <DetailPanel />
      </ControlledWrapper>,
    )

    await act(async () => {
      screen.getByText(`select-${ENTITY_WITH_IMAGES.id}`).click()
    })

    const expandButton = await screen.findByRole('button', { name: 'Expand reading view' })
    await act(async () => { expandButton.click() })

    const expandImageButtons = screen.getAllByRole('button', { name: 'Expand image' })
    expect(expandImageButtons).toHaveLength(2)
  })
})
