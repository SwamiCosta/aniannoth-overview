import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for top-level route navigation.
 *
 * Covers: navigating to each of the five routes renders without a visible
 * runtime error and displays expected content.  No deep assertions — each
 * test simply confirms the route loaded, something was rendered, and no
 * "Something went wrong" error message appeared.
 *
 * Routes under test:
 *   /          → redirects to /explore (atlas layout)
 *   /explore   → atlas layout (map + sidebar + detail panel)
 *   /characters → placeholder page
 *   /places    → placeholder page
 *   /items     → placeholder page
 *   /lore      → placeholder page
 *
 * API mocking:
 *   All HTTP calls are intercepted via page.route() so tests run without a
 *   real backend.  The app loads era and map data on startup regardless of the
 *   active route, so all mocks are set up before every test.
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
  summary: '',
  mapType: 'ABSTRACT',
  defaultMap: 'omniverse',
  color: '#7c3aed',
}

const MAP_OMNIVERSE = {
  id: 'omniverse',
  name: 'The Omniverse',
  mapType: 'ABSTRACT',
  image: '',
  eraIds: ['primordial'],
}

// ---------------------------------------------------------------------------
// Route setup helper
// ---------------------------------------------------------------------------

async function mockApiRoutes(page: import('@playwright/test').Page) {
  await page.route('**/api/public/v1/eras', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([ERA_PRIMORDIAL]),
    })
  })

  await page.route('**/api/public/v1/maps', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([MAP_OMNIVERSE]),
    })
  })

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

/** Asserts no visible runtime error is present on the page. */
async function assertNoRuntimeError(page: import('@playwright/test').Page) {
  await expect(page.getByText('Something went wrong')).not.toBeVisible()
  await expect(page.getByText('Unexpected Application Error')).not.toBeVisible()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Route navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page)
  })

  test('/ redirects to /explore and renders the atlas layout', async ({ page }) => {
    await page.goto('/')

    // Should land on /explore after the Navigate redirect
    await expect(page).toHaveURL(/\/explore/)

    // The TopBar "Atlas" logo must be visible (present on all routes)
    await expect(page.getByText('Atlas')).toBeVisible()

    // The sidebar placeholder confirms the atlas layout rendered
    await expect(page.getByText('Select an entity to view details')).toBeVisible()

    await assertNoRuntimeError(page)
  })

  test('/explore renders the full atlas layout without errors', async ({ page }) => {
    await page.goto('/explore')

    // The detail panel placeholder is always visible on /explore before an entity is selected
    await expect(page.getByText('Select an entity to view details')).toBeVisible()

    // The timeline "timeline" label is visible
    await expect(page.getByText('timeline')).toBeVisible()

    await assertNoRuntimeError(page)
  })

  test('/characters renders without errors', async ({ page }) => {
    await page.goto('/characters')

    await expect(page.getByText('Characters — coming soon')).toBeVisible()
    await assertNoRuntimeError(page)
  })

  test('/places renders without errors', async ({ page }) => {
    await page.goto('/places')

    await expect(page.getByText('Places — coming soon')).toBeVisible()
    await assertNoRuntimeError(page)
  })

  test('/items renders without errors', async ({ page }) => {
    await page.goto('/items')

    await expect(page.getByText('Items — coming soon')).toBeVisible()
    await assertNoRuntimeError(page)
  })

  test('/lore renders without errors', async ({ page }) => {
    await page.goto('/lore')

    await expect(page.getByText('Lore — coming soon')).toBeVisible()
    await assertNoRuntimeError(page)
  })
})
