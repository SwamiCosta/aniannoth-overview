import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AppProvider, useAppContext } from './AppContext'

// ---------------------------------------------------------------------------
// Mock the API modules so tests run without a real backend.
// ---------------------------------------------------------------------------

vi.mock('@/api/eraApi', () => ({
  fetchEras: vi.fn(),
}))

vi.mock('@/api/mapApi', () => ({
  fetchMaps: vi.fn(),
}))

import { fetchEras } from '@/api/eraApi'
import { fetchMaps } from '@/api/mapApi'

const mockFetchEras = vi.mocked(fetchEras)
const mockFetchMaps = vi.mocked(fetchMaps)

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  order: 0,
  type: 'ERA' as const,
  importance: null,
  period: 'Before Creation',
  summary: '',
  mapType: 'abstract' as const,
  defaultMap: 'omniverse',
  color: '#7c3aed',
}

const ERA_ANCIENT = {
  id: 'ancient',
  name: 'The Ancient Era',
  order: 1,
  type: 'ERA' as const,
  importance: null,
  period: 'Anno 1 – 500',
  summary: '',
  mapType: 'navigable' as const,
  defaultMap: 'world-map',
  color: '#b45309',
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
  return <AppProvider>{children}</AppProvider>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppContext', () => {
  beforeEach(() => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, ERA_ANCIENT])
    mockFetchMaps.mockResolvedValue([MAP_OMNIVERSE, MAP_WORLD])
  })

  it('initializes selectedEra with the first era by order', async () => {
    render(<Wrapper><Inspector /></Wrapper>)
    await waitFor(() => {
      expect(screen.getByTestId('era').textContent).toBe('primordial')
    })
  })

  it('initializes selectedMap with the default map of the first era', async () => {
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
    // Map must reset to ancient's defaultMap
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
