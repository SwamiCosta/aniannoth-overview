import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { LanguageProvider } from '@/context/LanguageContext'
import type { Entity } from '@/types/universe'
import Sidebar from './Sidebar'

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

// Era ids are UUIDs in production (since the V8 migration) — entity.timeline
// holds the era's *name*, not its id. These fixtures intentionally use distinct
// id/name values to exercise that real-world mismatch.
const ERA_PRIMORDIAL = {
  id: 'e0a1b2c3-0000-4000-8000-000000000001',
  name: 'The Primordial Era',
  order: 0,
  type: 'ERA' as const,
  importance: null,
  description: '',
  translationGroupId: 'primordial-group',
}

const ERA_ANCIENT = {
  id: 'e0a1b2c3-0000-4000-8000-000000000002',
  name: 'The Ancient Era',
  order: 1,
  type: 'ERA' as const,
  importance: null,
  description: '',
  translationGroupId: 'ancient-group',
}

const ERA_MODERN = {
  id: 'e0a1b2c3-0000-4000-8000-000000000003',
  name: 'The Modern Era',
  order: 2,
  type: 'ERA' as const,
  importance: null,
  description: '',
  translationGroupId: 'modern-group',
}

const MAP_OMNIVERSE = {
  id: 'omniverse',
  name: 'The Omniverse',
  type: 'abstract' as const,
  image: '',
  availableInEras: [ERA_PRIMORDIAL.id],
}

const CHARACTER_ENTITY = {
  id: 'char-001',
  name: 'Aelindra the Wise',
  category: 'characters',
  images: [],
  summary: 'A powerful arcane scholar.',
  body: '',
  location: '',
  timeline: { founded: ERA_PRIMORDIAL.name, destroyed: null },
  status: 'canon' as const,
  links: [],
  members: [],
  translationGroupId: 'aelindra-group',
}

const LORE_ENTITY = {
  id: 'lore-001',
  name: 'The First Codex',
  category: 'lore',
  images: [],
  summary: 'A record from the beginning.',
  body: '',
  location: '',
  timeline: { founded: ERA_PRIMORDIAL.name, destroyed: null },
  status: 'canon' as const,
  links: [],
  members: [],
  translationGroupId: 'first-codex-group',
}

// Entity founded in a later era — must NOT appear in the primordial sidebar
const OTHER_ERA_ENTITY = {
  id: 'char-002',
  name: 'Later Character',
  category: 'characters',
  images: [],
  summary: 'From another era.',
  body: '',
  location: '',
  timeline: { founded: ERA_ANCIENT.name, destroyed: null },
  status: 'canon' as const,
  links: [],
  members: [],
  translationGroupId: 'later-character-group',
}

// Founded in the Primordial Era, destroyed in the Modern Era — must remain
// visible throughout the whole interval, including the era strictly between
// founded and destroyed (Ancient), not just the founded era itself. This is
// the regression case for the bug where only the founded era matched.
const SPANNING_ENTITY = {
  id: 'char-003',
  name: 'Thessaly the Ageless',
  category: 'characters',
  images: [],
  summary: 'Lived through three ages.',
  body: '',
  location: '',
  timeline: { founded: ERA_PRIMORDIAL.name, destroyed: ERA_MODERN.name },
  status: 'canon' as const,
  links: [],
  members: [],
  translationGroupId: 'thessaly-group',
}

const ALL_CATEGORIES = ['characters', 'places', 'factions', 'items', 'events', 'lore']

function setupEntityMock(entities: Entity[]) {
  mockFetchEntities.mockImplementation(async (category: string) => {
    return entities.filter(e => e.category === category)
  })
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider><AppProvider>{children}</AppProvider></LanguageProvider>
}

// Test-only helper — Sidebar itself has no era switcher; TimelineBar owns
// that UI. This lets tests drive `ctx.setEra` directly to exercise Sidebar's
// visibility filter against an era other than the default (lowest `order`).
function EraSwitcher({ eraId }: { eraId: string }) {
  const ctx = useAppContext()
  return <button onClick={() => ctx.setEra(eraId)}>switch-era</button>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  beforeEach(() => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL])
    mockFetchMaps.mockResolvedValue([MAP_OMNIVERSE])
  })

  it('renders entity cards for entities belonging to the current era', async () => {
    setupEntityMock([CHARACTER_ENTITY, LORE_ENTITY, OTHER_ERA_ENTITY])

    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>,
    )

    // Entities from the current era (primordial) should be visible
    expect(await screen.findByText('Aelindra the Wise')).toBeInTheDocument()
    expect(await screen.findByText('The First Codex')).toBeInTheDocument()

    // Entity from another era must NOT appear
    expect(screen.queryByText('Later Character')).not.toBeInTheDocument()
  })

  it('clicking an entity card updates selectedEntityId in context', async () => {
    setupEntityMock([CHARACTER_ENTITY])

    // Render a context inspector to observe selectedEntityId alongside Sidebar
    const Inspector = () => {
      const { useAppContext } = require('@/context/AppContext')
      const ctx = useAppContext()
      return <span data-testid="selected-entity">{ctx.selectedEntityId ?? 'null'}</span>
    }

    // Instead of a separate inspector, rely on the active card styling.
    // The button gets the active class (bg-primary-light border-l-2 border-primary)
    // when its entity id matches selectedEntityId.  We verify this by checking that
    // the button className changes after clicking.
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>,
    )

    const card = await screen.findByRole('button', { name: /Aelindra the Wise/i })

    // Before click — card is not active (does not contain bg-primary-light)
    expect(card.className).not.toContain('bg-primary-light')

    await act(async () => { card.click() })

    // After click — card is active
    expect(card.className).toContain('bg-primary-light')
  })

  it('activating a category filter shows only entities of that category', async () => {
    setupEntityMock([CHARACTER_ENTITY, LORE_ENTITY])

    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>,
    )

    // Both entities are visible initially (no filter)
    expect(await screen.findByText('Aelindra the Wise')).toBeInTheDocument()
    expect(await screen.findByText('The First Codex')).toBeInTheDocument()

    // Click the 'Characters' filter chip
    const charactersChip = screen.getByRole('button', { name: 'Characters' })
    await act(async () => { charactersChip.click() })

    // Only the character entity should remain visible
    expect(screen.getByText('Aelindra the Wise')).toBeInTheDocument()
    expect(screen.queryByText('The First Codex')).not.toBeInTheDocument()
  })

  it('keeps an entity visible for every era in its founded-to-destroyed interval, not just the founded era', async () => {
    // SPANNING_ENTITY is founded in Primordial and destroyed in Modern.
    // Explicitly select Ancient — strictly between the two — via EraSwitcher,
    // since the default selected era is always the lowest `order` (Primordial
    // here), which would trivially pass even with the old founded-only
    // equality check. Regression test for the bug where an entity only
    // appeared in its founded era instead of across the whole interval.
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, ERA_ANCIENT, ERA_MODERN])
    setupEntityMock([SPANNING_ENTITY])

    render(
      <Wrapper>
        <EraSwitcher eraId={ERA_ANCIENT.id} />
        <Sidebar />
      </Wrapper>,
    )

    await act(async () => { screen.getByRole('button', { name: 'switch-era' }).click() })

    expect(await screen.findByText('Thessaly the Ageless')).toBeInTheDocument()
  })

  it('hides an entity with no declared destroyed era once a later era is selected', async () => {
    // CHARACTER_ENTITY only declares `founded` (Primordial), no `destroyed`.
    // Regression test for the opposite bug: treating a missing `destroyed`
    // as "visible forever after founded" instead of "visible only in the
    // founded era unless an ending era is explicitly declared".
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, ERA_ANCIENT])
    setupEntityMock([CHARACTER_ENTITY])

    render(
      <Wrapper>
        <EraSwitcher eraId={ERA_ANCIENT.id} />
        <Sidebar />
      </Wrapper>,
    )

    // Visible in its founded era (Primordial — the default, lowest `order`)
    expect(await screen.findByText('Aelindra the Wise')).toBeInTheDocument()

    // Switch to a later era — must disappear, since no destroyed era was declared
    await act(async () => { screen.getByRole('button', { name: 'switch-era' }).click() })

    expect(screen.queryByText('Aelindra the Wise')).not.toBeInTheDocument()
  })
})
