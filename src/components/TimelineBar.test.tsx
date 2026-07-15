import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider } from '@/context/AppContext'
import { LanguageProvider } from '@/context/LanguageContext'
import TimelineBar from './TimelineBar'

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

function Wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider><AppProvider>{children}</AppProvider></LanguageProvider>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TimelineBar', () => {
  beforeEach(() => {
    mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, ERA_ANCIENT])
    mockFetchMaps.mockResolvedValue([MAP_OMNIVERSE, MAP_WORLD])
    mockFetchEntities.mockResolvedValue([])
  })

  it('renders all era names', async () => {
    render(
      <Wrapper>
        <TimelineBar />
      </Wrapper>,
    )

    // Both era names must appear as buttons with aria-label
    expect(await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: ERA_ANCIENT.name })).toBeInTheDocument()
  })

  it('marks the initially selected era as active (aria-pressed=true)', async () => {
    render(
      <Wrapper>
        <TimelineBar />
      </Wrapper>,
    )

    const primordialButton = await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })
    const ancientButton = await screen.findByRole('button', { name: ERA_ANCIENT.name })

    // The first era by order is selected on init — its button is aria-pressed=true
    expect(primordialButton).toHaveAttribute('aria-pressed', 'true')
    expect(ancientButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking a different era updates the active era (aria-pressed flips)', async () => {
    render(
      <Wrapper>
        <TimelineBar />
      </Wrapper>,
    )

    const ancientButton = await screen.findByRole('button', { name: ERA_ANCIENT.name })
    const primordialButton = await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })

    // Initially primordial is active
    expect(primordialButton).toHaveAttribute('aria-pressed', 'true')
    expect(ancientButton).toHaveAttribute('aria-pressed', 'false')

    // Click the ancient era button
    await act(async () => { ancientButton.click() })

    // Now ancient is active and primordial is not
    expect(ancientButton).toHaveAttribute('aria-pressed', 'true')
    expect(primordialButton).toHaveAttribute('aria-pressed', 'false')
  })
})
