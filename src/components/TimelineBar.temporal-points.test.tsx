import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AppProvider, useAppContext } from '@/context/AppContext'
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
// Test fixtures — one ERA, one STANDARD point, one MAJOR point
// ---------------------------------------------------------------------------

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  order: 1,
  type: 'ERA' as const,
  importance: null,
  description: '',
  translationGroupId: 'primordial-group',
}

const POINT_STANDARD = {
  id: 'point-sundering',
  name: 'The First Silence',
  order: 2,
  type: 'POINT' as const,
  importance: 'STANDARD' as const,
  description: '',
  translationGroupId: 'first-silence-group',
}

const POINT_MAJOR = {
  id: 'point-sundering-major',
  name: 'The Great Sundering',
  order: 3,
  type: 'POINT' as const,
  importance: 'MAJOR' as const,
  description: '',
  translationGroupId: 'sundering-group',
}

const MAP_OMNIVERSE = {
  id: 'omniverse',
  name: 'The Omniverse',
  type: 'abstract' as const,
  image: '',
  availableInEras: ['primordial'],
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider><AppProvider>{children}</AppProvider></LanguageProvider>
}

function Inspector() {
  const ctx = useAppContext()
  return (
    <>
      <span data-testid="era">{ctx.selectedEra}</span>
      <span data-testid="detail-open">{String(ctx.eraDetailOpen)}</span>
      <span data-testid="detail-target">{ctx.timelineDetailId ?? 'null'}</span>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tests — three rendering variants
// ---------------------------------------------------------------------------

describe('TimelineBar — temporal points', () => {
  beforeEach(() => {
    mockFetchMaps.mockResolvedValue([MAP_OMNIVERSE])
    mockFetchEntities.mockResolvedValue([])
  })

  describe('ERA entry', () => {
    it('renders the era name as a button with aria-pressed', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      const eraButton = await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })
      expect(eraButton).toBeInTheDocument()
      expect(eraButton).toHaveAttribute('aria-pressed')
    })

    it('does not render any pin marker element for an ERA entry', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      // Wait for the era to render
      await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })

      // No STANDARD or MAJOR pin markers should be present
      expect(document.querySelector('[data-point-type]')).toBeNull()
    })
  })

  describe('POINT / STANDARD entry', () => {
    it('renders a STANDARD pin marker as a selectable button', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_STANDARD])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      // Wait for the era button to ensure the component has rendered
      await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })

      // The STANDARD point pin must be present and carry the correct data attribute
      const pin = document.querySelector('[data-point-type="STANDARD"]')
      expect(pin).not.toBeNull()

      // Temporal points are selectable, just like eras
      expect(pin?.tagName).toBe('BUTTON')
    })

    it('renders the STANDARD point name as visible text', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_STANDARD])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })
      expect(screen.getByText(POINT_STANDARD.name)).toBeInTheDocument()
    })

    it('clicking a STANDARD point opens its detail without changing the selected era', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_STANDARD])

      render(
        <Wrapper>
          <Inspector />
          <TimelineBar />
        </Wrapper>,
      )

      const eraButton = await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })
      await waitFor(() => expect(eraButton).toHaveAttribute('aria-pressed', 'true'))

      const pointButton = screen.getByRole('button', { name: POINT_STANDARD.name })
      await act(async () => { pointButton.click() })

      // The detail panel opens targeting the point, but the selected era is untouched
      expect(screen.getByTestId('era').textContent).toBe(ERA_PRIMORDIAL.id)
      expect(screen.getByTestId('detail-open').textContent).toBe('true')
      expect(screen.getByTestId('detail-target').textContent).toBe(POINT_STANDARD.id)
      expect(eraButton).toHaveAttribute('aria-pressed', 'true')
      expect(pointButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('POINT / MAJOR entry', () => {
    it('renders a MAJOR pin marker as a selectable button', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_MAJOR])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })

      // The MAJOR point pin must carry the distinct data attribute
      const pin = document.querySelector('[data-point-type="MAJOR"]')
      expect(pin).not.toBeNull()

      // Temporal points are selectable, just like eras
      expect(pin?.tagName).toBe('BUTTON')
    })

    it('clicking a MAJOR point opens its detail without changing the selected era', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_MAJOR])

      render(
        <Wrapper>
          <Inspector />
          <TimelineBar />
        </Wrapper>,
      )

      const eraButton = await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })
      await waitFor(() => expect(eraButton).toHaveAttribute('aria-pressed', 'true'))

      const pointButton = screen.getByRole('button', { name: POINT_MAJOR.name })
      await act(async () => { pointButton.click() })

      expect(screen.getByTestId('era').textContent).toBe(ERA_PRIMORDIAL.id)
      expect(screen.getByTestId('detail-open').textContent).toBe('true')
      expect(screen.getByTestId('detail-target').textContent).toBe(POINT_MAJOR.id)
      expect(eraButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('renders the MAJOR point name as visible text', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_MAJOR])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })
      expect(screen.getByText(POINT_MAJOR.name)).toBeInTheDocument()
    })

    it('renders MAJOR pin with a visually distinct class (bg-primary)', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_MAJOR])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })

      // The MAJOR pin wrapper must exist and the inner diamond span must carry bg-primary
      const pin = document.querySelector('[data-point-type="MAJOR"]')
      expect(pin).not.toBeNull()

      // The diamond shape inside the pin uses the bg-primary token class
      const diamond = pin?.querySelector('.bg-primary')
      expect(diamond).not.toBeNull()
    })

    it('MAJOR and STANDARD pins render differently — different data-point-type attributes', async () => {
      mockFetchEras.mockResolvedValue([ERA_PRIMORDIAL, POINT_STANDARD, POINT_MAJOR])

      render(
        <Wrapper>
          <TimelineBar />
        </Wrapper>,
      )

      await screen.findByRole('button', { name: ERA_PRIMORDIAL.name })

      expect(document.querySelector('[data-point-type="STANDARD"]')).not.toBeNull()
      expect(document.querySelector('[data-point-type="MAJOR"]')).not.toBeNull()
    })
  })
})
