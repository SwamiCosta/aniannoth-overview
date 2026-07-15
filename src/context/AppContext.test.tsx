import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AppProvider, useAppContext } from './AppContext'
import { LanguageProvider, useLanguage } from './LanguageContext'

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
// Shared test fixtures
// ---------------------------------------------------------------------------

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  order: 0,
  type: 'ERA' as const,
  importance: null,
  description: '',
  translationGroupId: 'primordial-group',
}

const ERA_ANCIENT = {
  id: 'ancient',
  name: 'The Ancient Era',
  order: 1,
  type: 'ERA' as const,
  importance: null,
  description: '',
  translationGroupId: 'ancient-group',
}

const MAP_OMNIVERSE = {
  id: 'omniverse',
  name: 'The Omniverse',
  type: 'abstract' as const,
  image: '',
  availableInEras: ['primordial'],
}

const MAP_WORLD = {
  id: 'world-map',
  name: 'World Map',
  type: 'navigable' as const,
  image: '',
  availableInEras: ['ancient'],
}

// ---------------------------------------------------------------------------
// Inspector component — reads all context values and provides action buttons.
// Extended with extra buttons needed for the new test cases.
// ---------------------------------------------------------------------------

function Inspector() {
  const ctx = useAppContext()
  return (
    <>
      <span data-testid="era">{ctx.selectedEra}</span>
      <span data-testid="map">{ctx.selectedMap}</span>
      <span data-testid="triggered">{String(ctx.mapResetTriggered)}</span>
      <span data-testid="filter">{ctx.filters.category ?? 'null'}</span>
      <span data-testid="entity">{ctx.selectedEntityId ?? 'null'}</span>
      <span data-testid="detail-open">{String(ctx.eraDetailOpen)}</span>
      <span data-testid="detail-target">{ctx.timelineDetailId ?? 'null'}</span>
      <button onClick={() => ctx.setEra('primordial')}>set-era-primordial</button>
      <button onClick={() => ctx.setEra('ancient')}>set-era-ancient</button>
      <button onClick={() => ctx.setMap('world-map')}>set-map-world</button>
      <button onClick={() => ctx.setFilter('characters')}>set-filter</button>
      <button onClick={() => ctx.clearMapResetTrigger()}>clear-trigger</button>
      <button onClick={() => ctx.setSelectedEntity('entity-123')}>set-entity</button>
      <button onClick={() => ctx.setSelectedEntity(null)}>clear-entity</button>
      <button onClick={() => ctx.openTimelineDetail('ancient')}>open-detail-ancient</button>
    </>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider><AppProvider>{children}</AppProvider></LanguageProvider>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppContext', () => {
  beforeEach(() => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, ERA_ANCIENT])
    mockFetchMaps.mockResolvedValue([MAP_OMNIVERSE, MAP_WORLD])
    mockFetchEntities.mockResolvedValue([])
  })

  it('initializes selectedEra with the first era by order', async () => {
    render(<Wrapper><Inspector /></Wrapper>)
    await waitFor(() => {
      expect(screen.getByTestId('era').textContent).toBe('primordial')
    })
  })

  it('initializes selectedMap with the first available map of the first era', async () => {
    render(<Wrapper><Inspector /></Wrapper>)
    await waitFor(() => {
      expect(screen.getByTestId('map').textContent).toBe('omniverse')
    })
  })

  it('initializes mapResetTriggered as false', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    expect(screen.getByTestId('triggered').textContent).toBe('false')
  })

  it('setEra updates selectedEra (same-era, no map reset)', async () => {
    render(<Wrapper><Inspector /></Wrapper>)
    await waitFor(() => expect(screen.getByTestId('era').textContent).toBe('primordial'))
    act(() => { screen.getByText('set-era-primordial').click() })
    expect(screen.getByTestId('era').textContent).toBe('primordial')
    expect(screen.getByTestId('triggered').textContent).toBe('false')
  })

  // 1a — setEra with map reset (critical business rule)
  it('setEra resets selectedMap and sets mapResetTriggered when current map is not in the new era', async () => {
    render(<Wrapper><Inspector /></Wrapper>)

    // Wait for initial state: primordial era / omniverse map
    await waitFor(() => expect(screen.getByTestId('era').textContent).toBe('primordial'))
    expect(screen.getByTestId('map').textContent).toBe('omniverse')

    // Switch to 'ancient' era — 'omniverse' is NOT in ancient's availableInEras
    await act(async () => { screen.getByText('set-era-ancient').click() })

    expect(screen.getByTestId('era').textContent).toBe('ancient')
    // Map must reset to a map available in the ancient era
    expect(screen.getByTestId('map').textContent).toBe('world-map')
    // mapResetTriggered must be true
    expect(screen.getByTestId('triggered').textContent).toBe('true')
  })

  // 1b — setMap
  it('setMap updates selectedMap', async () => {
    render(<Wrapper><Inspector /></Wrapper>)
    await waitFor(() => expect(screen.getByTestId('map').textContent).toBe('omniverse'))

    act(() => { screen.getByText('set-map-world').click() })

    expect(screen.getByTestId('map').textContent).toBe('world-map')
  })

  // 1c — setSelectedEntity: set and clear
  it('setSelectedEntity updates selectedEntityId', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    expect(screen.getByTestId('entity').textContent).toBe('null')

    act(() => { screen.getByText('set-entity').click() })
    expect(screen.getByTestId('entity').textContent).toBe('entity-123')

    act(() => { screen.getByText('clear-entity').click() })
    expect(screen.getByTestId('entity').textContent).toBe('null')
  })

  it('setFilter updates the category filter', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    act(() => { screen.getByText('set-filter').click() })
    expect(screen.getByTestId('filter').textContent).toBe('characters')
  })

  it('clearMapResetTrigger resets the flag to false', () => {
    render(<Wrapper><Inspector /></Wrapper>)
    act(() => { screen.getByText('clear-trigger').click() })
    expect(screen.getByTestId('triggered').textContent).toBe('false')
  })

  it('openTimelineDetail sets the detail target and opens the panel without touching selectedEra', async () => {
    render(<Wrapper><Inspector /></Wrapper>)
    await waitFor(() => expect(screen.getByTestId('era').textContent).toBe('primordial'))

    act(() => { screen.getByText('open-detail-ancient').click() })

    expect(screen.getByTestId('detail-open').textContent).toBe('true')
    expect(screen.getByTestId('detail-target').textContent).toBe('ancient')
    // selectedEra (and therefore the map) is unaffected by opening a detail target
    expect(screen.getByTestId('era').textContent).toBe('primordial')
  })

  it('openTimelineDetail clears a previously selected entity, so the panel can show the era', () => {
    render(<Wrapper><Inspector /></Wrapper>)

    act(() => { screen.getByText('set-entity').click() })
    expect(screen.getByTestId('entity').textContent).toBe('entity-123')

    act(() => { screen.getByText('open-detail-ancient').click() })

    expect(screen.getByTestId('detail-open').textContent).toBe('true')
    expect(screen.getByTestId('entity').textContent).toBe('null')
  })

  it('throws when useAppContext is used outside AppProvider', () => {
    const original = console.error
    console.error = () => {}
    expect(() => render(<Inspector />)).toThrow('useAppContext must be used inside AppProvider')
    console.error = original
  })
})

// ---------------------------------------------------------------------------
// Language switch remapping — era/entity ids are per-language rows (one row
// per translation, linked by translationGroupId — see keynor-core
// EraResponse/CharacterResponse etc). Switching language replaces the
// underlying eras/entities dataset with a new set of ids, so a selection made
// before the switch must be re-resolved by translationGroupId instead of
// being left pointing at an id that only existed in the previous language.
// ---------------------------------------------------------------------------

function LanguageSwitcher() {
  const { setLanguage } = useLanguage()
  return (
    <>
      <button onClick={() => setLanguage('en')}>lang-en</button>
      <button onClick={() => setLanguage('pt')}>lang-pt</button>
    </>
  )
}

function SetEraButton({ eraId }: { eraId: string }) {
  const ctx = useAppContext()
  return <button onClick={() => ctx.setEra(eraId)}>{`set-era-${eraId}`}</button>
}

function SetEntityButton({ entityId }: { entityId: string }) {
  const ctx = useAppContext()
  return <button onClick={() => ctx.setSelectedEntity(entityId)}>{`set-entity-${entityId}`}</button>
}

describe('AppContext — language switch remapping', () => {
  const ERA_PRIMORDIAL_EN = {
    id: 'primordial-en',
    name: 'The Primordial Era',
    order: 0,
    type: 'ERA' as const,
    importance: null,
    description: '',
    translationGroupId: 'primordial-group',
  }

  const ERA_ANCIENT_EN = {
    id: 'ancient-en',
    name: 'The Ancient Era',
    order: 1,
    type: 'ERA' as const,
    importance: null,
    description: '',
    translationGroupId: 'ancient-group',
  }

  const ERA_PRIMORDIAL_PT = {
    id: 'primordial-pt',
    name: 'A Era Primordial',
    order: 0,
    type: 'ERA' as const,
    importance: null,
    description: '',
    translationGroupId: 'primordial-group',
  }

  const ENTITY_EN = {
    id: 'entity-en',
    name: 'Omnia',
    category: 'characters',
    images: [],
    summary: '',
    body: '',
    location: '',
    timeline: { era: 'The Primordial Era' },
    status: 'canon' as const,
    links: [],
    translationGroupId: 'omnia-group',
  }

  const ENTITY_PT = {
    ...ENTITY_EN,
    id: 'entity-pt',
    name: 'Omnia (PT)',
  }

  beforeEach(() => {
    // LanguageProvider reads its initial language from localStorage, which
    // otherwise leaks the 'pt' selection from one test into the next.
    localStorage.clear()
    mockFetchMaps.mockResolvedValue([])
  })

  it('remaps selectedEra to the new-language id once the language switch resolves', async () => {
    mockFetchEras.mockImplementation(async (language: string) =>
      language === 'pt' ? [ERA_PRIMORDIAL_PT] : [ERA_PRIMORDIAL_EN, ERA_ANCIENT_EN],
    )
    mockFetchEntities.mockResolvedValue([])

    render(
      <Wrapper>
        <LanguageSwitcher />
        <Inspector />
      </Wrapper>,
    )

    await waitFor(() => expect(screen.getByTestId('era').textContent).toBe(ERA_PRIMORDIAL_EN.id))

    await act(async () => { screen.getByText('lang-pt').click() })

    await waitFor(() => expect(screen.getByTestId('era').textContent).toBe(ERA_PRIMORDIAL_PT.id))
  })

  it('falls back to the default era when the selected era has no translation in the new language', async () => {
    mockFetchEras.mockImplementation(async (language: string) =>
      language === 'pt' ? [ERA_PRIMORDIAL_PT] : [ERA_PRIMORDIAL_EN, ERA_ANCIENT_EN],
    )
    mockFetchEntities.mockResolvedValue([])

    render(
      <Wrapper>
        <LanguageSwitcher />
        <SetEraButton eraId={ERA_ANCIENT_EN.id} />
        <Inspector />
      </Wrapper>,
    )

    await waitFor(() => expect(screen.getByTestId('era').textContent).toBe(ERA_PRIMORDIAL_EN.id))
    act(() => { screen.getByText(`set-era-${ERA_ANCIENT_EN.id}`).click() })
    expect(screen.getByTestId('era').textContent).toBe(ERA_ANCIENT_EN.id)

    // 'ancient' has no PT translation in this dataset — the switch must fall
    // back to the default era instead of leaving selectedEra pointing at an
    // id ('ancient-en') that no longer exists in the PT dataset.
    await act(async () => { screen.getByText('lang-pt').click() })

    await waitFor(() => expect(screen.getByTestId('era').textContent).toBe(ERA_PRIMORDIAL_PT.id))
  })

  it('remaps selectedEntityId to the new-language id once the language switch resolves', async () => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL_EN])
    mockFetchEntities.mockImplementation(async (_category: string, language: string) =>
      language === 'pt' ? [ENTITY_PT] : [ENTITY_EN],
    )

    render(
      <Wrapper>
        <LanguageSwitcher />
        <SetEntityButton entityId={ENTITY_EN.id} />
        <Inspector />
      </Wrapper>,
    )

    await waitFor(() => expect(screen.getByTestId('entity').textContent).toBe('null'))
    act(() => { screen.getByText(`set-entity-${ENTITY_EN.id}`).click() })
    expect(screen.getByTestId('entity').textContent).toBe(ENTITY_EN.id)

    await act(async () => { screen.getByText('lang-pt').click() })

    await waitFor(() => expect(screen.getByTestId('entity').textContent).toBe(ENTITY_PT.id))
  })

  it('clears selectedEntityId when the selected entity has no translation in the new language', async () => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL_EN])
    mockFetchEntities.mockImplementation(async (_category: string, language: string) =>
      language === 'pt' ? [] : [ENTITY_EN],
    )

    render(
      <Wrapper>
        <LanguageSwitcher />
        <SetEntityButton entityId={ENTITY_EN.id} />
        <Inspector />
      </Wrapper>,
    )

    await waitFor(() => expect(screen.getByTestId('entity').textContent).toBe('null'))
    act(() => { screen.getByText(`set-entity-${ENTITY_EN.id}`).click() })
    expect(screen.getByTestId('entity').textContent).toBe(ENTITY_EN.id)

    // No PT translation exists for this entity — the switch must clear the
    // selection instead of leaving it pointing at an id that no longer exists.
    await act(async () => { screen.getByText('lang-pt').click() })

    await waitFor(() => expect(screen.getByTestId('entity').textContent).toBe('null'))
  })
})
