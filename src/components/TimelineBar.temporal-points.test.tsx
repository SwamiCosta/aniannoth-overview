import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProvider } from '@/context/AppContext'
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

import { fetchEras } from '@/api/eraApi'
import { fetchMaps } from '@/api/mapApi'

const mockFetchEras = vi.mocked(fetchEras)
const mockFetchMaps = vi.mocked(fetchMaps)

// ---------------------------------------------------------------------------
// Test fixtures — one ERA, one STANDARD point, one MAJOR point
// ---------------------------------------------------------------------------

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  order: 1,
  type: 'ERA' as const,
  importance: null,
  period: 'Before Creation',
  summary: '',
  mapType: 'abstract' as const,
  defaultMap: 'omniverse',
  color: '#7c3aed',
}

const POINT_STANDARD = {
  id: 'point-sundering',
  name: 'The First Silence',
  order: 2,
  type: 'POINT' as const,
  importance: 'STANDARD' as const,
  period: '',
  summary: '',
  mapType: 'abstract' as const,
  defaultMap: '',
  color: '',
}

const POINT_MAJOR = {
  id: 'point-sundering-major',
  name: 'The Great Sundering',
  order: 3,
  type: 'POINT' as const,
  importance: 'MAJOR' as const,
  period: '',
  summary: '',
  mapType: 'abstract' as const,
  defaultMap: '',
  color: '',
}

const MAP_OMNIVERSE = {
  id: 'omniverse',
  name: 'The Omniverse',
  type: 'abstract' as const,
  image: '',
  availableInEras: ['primordial'],
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}

// ---------------------------------------------------------------------------
// Tests — three rendering variants
// ---------------------------------------------------------------------------

describe('TimelineBar — temporal points', () => {
  beforeEach(() => {
    mockFetchMaps.mockResolvedValue([MAP_OMNIVERSE])
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
    it('renders a STANDARD pin marker and not a button', async () => {
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

      // It must NOT be an interactive button — temporal points are not selectable
      expect(pin?.tagName).not.toBe('BUTTON')
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
  })

  describe('POINT / MAJOR entry', () => {
    it('renders a MAJOR pin marker and not a button', async () => {
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

      // It must NOT be an interactive button
      expect(pin?.tagName).not.toBe('BUTTON')
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
