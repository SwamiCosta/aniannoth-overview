import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for era selection behavior in the TimelineBar.
 *
 * Covers: clicking an era in the TimelineBar updates the active era.
 *
 * NOTE — Map reset scenario:
 *   The map-reset flow (switching to an era where the current map is
 *   unavailable triggers a toast + map selector reset) requires at least
 *   two eras where some map exists in era A but NOT in era B.
 *
 *   As of the time these specs were written, content/eras.json contains only
 *   ONE era ("The Primordial Era"), so the map-reset path cannot be exercised
 *   with real content data.  When a second era is added to content, a new test
 *   case should be added here.
 *
 * API mocking:
 *   The app fetches all data from keynor-core REST endpoints.  All HTTP calls
 *   are intercepted via page.route() so these tests run without a real backend.
 */

// ---------------------------------------------------------------------------
// Mock data — mirrors the keynor-core API contract
// ---------------------------------------------------------------------------

function pagedOf<T>(items: T[]) {
  return { content: items, page: 0, size: 100, totalElements: items.length }
}

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  eraOrder: 0,
  period: 'Before Creation',
  summary: 'The age before the material world.',
  mapType: 'ABSTRACT',
  defaultMap: 'omniverse',
  color: '#7c3aed',
}

const ERA_ANCIENT = {
  id: 'ancient',
  name: 'The Ancient Era',
  eraOrder: 1,
  period: 'Anno 1 – 500',
  summary: 'The first age of the material world.',
  mapType: 'NAVIGABLE',
  defaultMap: 'world-map',
  color: '#b45309',
}

const MAP_OMNIVERSE = {
  id: 'omniverse',
  name: 'The Omniverse',
  mapType: 'ABSTRACT',
  image: '',
  eraIds: ['primordial'],
}

const MAP_WORLD = {
  id: 'world-map',
  name: 'World Map',
  mapType: 'NAVIGABLE',
  image: '',
  eraIds: ['ancient'],
}

// ---------------------------------------------------------------------------
// Route setup helpers
// ---------------------------------------------------------------------------

type MockEra = typeof ERA_PRIMORDIAL
type MockMap = typeof MAP_OMNIVERSE

async function mockApiRoutes(
  page: import('@playwright/test').Page,
  eras: MockEra[],
  maps: MockMap[],
) {
  await page.route('**/api/public/v1/eras', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(eras),
    })
  })

  await page.route('**/api/public/v1/maps', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(maps),
    })
  })

  // Return empty entity lists for all categories
  const categories = ['characters', 'places', 'factions', 'items', 'events', 'lore']
  for (const category of categories) {
    await page.route(`**/api/public/v1/${category}?size=100`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pagedOf([])),
      })
    })
  }
}

// ---------------------------------------------------------------------------
// Tests — single era (current content state)
// ---------------------------------------------------------------------------

test.describe('TimelineBar — era selection (single era)', () => {
  test('renders the era button and marks it as active on load', async ({ page }) => {
    await mockApiRoutes(page, [ERA_PRIMORDIAL], [MAP_OMNIVERSE])
    await page.goto('/explore')

    const eraButton = page.getByRole('button', { name: ERA_PRIMORDIAL.name })
    await expect(eraButton).toBeVisible()

    // The active era button must have aria-pressed="true"
    await expect(eraButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('clicking the active era again does not reset state', async ({ page }) => {
    await mockApiRoutes(page, [ERA_PRIMORDIAL], [MAP_OMNIVERSE])
    await page.goto('/explore')

    const eraButton = page.getByRole('button', { name: ERA_PRIMORDIAL.name })
    await eraButton.click()

    // Still active — no map reset toast should appear
    await expect(eraButton).toHaveAttribute('aria-pressed', 'true')
    const toastText = 'Map unavailable for this era. Redirected to default.'
    await expect(page.getByText(toastText)).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — two eras with disjoint maps (map reset scenario)
// ---------------------------------------------------------------------------

test.describe('TimelineBar — era change with map reset (two eras)', () => {
  test('switching to an era where the current map is unavailable resets the map and shows a toast', async ({ page }) => {
    // ERA_PRIMORDIAL uses MAP_OMNIVERSE; ERA_ANCIENT uses MAP_WORLD.
    // The two maps share NO eras — switching from primordial to ancient must
    // trigger the map-reset path.
    await mockApiRoutes(
      page,
      [ERA_PRIMORDIAL, ERA_ANCIENT],
      [MAP_OMNIVERSE, MAP_WORLD],
    )
    await page.goto('/explore')

    // Confirm starting state: primordial era is active
    const primordialButton = page.getByRole('button', { name: ERA_PRIMORDIAL.name })
    const ancientButton = page.getByRole('button', { name: ERA_ANCIENT.name })

    await expect(primordialButton).toHaveAttribute('aria-pressed', 'true')
    await expect(ancientButton).toHaveAttribute('aria-pressed', 'false')

    // Switch to The Ancient Era — omniverse is NOT in its availableInEras
    await ancientButton.click()

    // Ancient era is now active
    await expect(ancientButton).toHaveAttribute('aria-pressed', 'true')
    await expect(primordialButton).toHaveAttribute('aria-pressed', 'false')

    // The map-reset toast should appear because omniverse is not available in ancient.
    // MapArea renders the toast text "Map unavailable for this era. Redirected to default."
    // via an absolutely positioned div that transitions to opacity-100.
    const toastText = 'Map unavailable for this era. Redirected to default.'
    const toast = page.getByText(toastText)
    await expect(toast).toBeVisible()
  })

  test('switching to an era without a map reset does not show the map-unavailable toast', async ({ page }) => {
    // Both eras share MAP_OMNIVERSE: no reset should occur when switching.
    const sharedMap = { ...MAP_OMNIVERSE, eraIds: ['primordial', 'ancient'] }

    await mockApiRoutes(
      page,
      [ERA_PRIMORDIAL, ERA_ANCIENT],
      [sharedMap],
    )
    await page.goto('/explore')

    const ancientButton = page.getByRole('button', { name: ERA_ANCIENT.name })
    await ancientButton.click()

    await expect(ancientButton).toHaveAttribute('aria-pressed', 'true')

    // The toast element is always present in the DOM but opacity-0 when not triggered.
    // We assert it is NOT visible (i.e. it has opacity-0 / is not visually shown).
    const toastText = 'Map unavailable for this era. Redirected to default.'
    const toast = page.getByText(toastText)
    await expect(toast).not.toBeVisible()
  })
})
