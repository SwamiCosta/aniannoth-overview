import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for the era detail panel feature.
 *
 * Covers:
 *   1. Happy path — clicking an era node in the TimelineBar opens the
 *      DetailPanel in era-detail mode, showing the era name and description.
 *   2. Era detail closes on entity selection — opening era detail then clicking
 *      an entity card switches the DetailPanel to entity view.
 *   3. Close button — clicking the close button on the era detail panel returns
 *      the DetailPanel to the placeholder state.
 *   4. Era switch while panel is open — clicking a different era node while the
 *      era detail panel is already open keeps the panel open and updates its
 *      content to the newly selected era.
 *
 * Backend assumption:
 *   All HTTP calls are intercepted via page.route() so these tests run without
 *   a real backend (keynor-core at localhost:8080 is NOT required).
 *   If you are running against a live backend, disable or remove the mocks.
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
  order: 0,
  type: 'ERA',
  importance: null,
  description: 'The age before the material world took shape.',
}

const ERA_ANCIENT = {
  id: 'ancient',
  name: 'The Ancient Era',
  order: 1,
  type: 'ERA',
  importance: null,
  description: 'The first age of the material world.',
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

const TEST_ENTITY = {
  id: 'verath-001',
  name: 'Verath the Unbound',
  summary: 'A being from before time.',
  body: '',
  tags: ['divine'],
  categories: ['characters'],
  status: 'CANON',
  images: [],
  // timelineFoundedEra is an era *name* in the real API contract, not an id —
  // it must match ERA_PRIMORDIAL.name for the Sidebar to surface this entity.
  timelineFoundedEra: ERA_PRIMORDIAL.name,
  timelineDestroyedEra: null,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApiEra = typeof ERA_PRIMORDIAL
type ApiMap = typeof MAP_OMNIVERSE
type ApiEntity = typeof TEST_ENTITY

// ---------------------------------------------------------------------------
// Route setup helper
// ---------------------------------------------------------------------------

async function mockApiRoutes(
  page: import('@playwright/test').Page,
  eras: ApiEra[],
  maps: ApiMap[],
  entities: ApiEntity[] = [],
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

  const categories = ['characters', 'places', 'factions', 'items', 'events', 'lore']
  for (const category of categories) {
    await page.route(`**/api/public/v1/${category}?size=100`, async route => {
      const matching = entities.filter(e => e.categories.includes(category))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pagedOf(matching)),
      })
    })
  }
}

// ---------------------------------------------------------------------------
// Locator helper
// ---------------------------------------------------------------------------

// Sidebar also renders the current era's name in its header, so a bare
// getByText(name) is ambiguous whenever the same era is both selected and
// open in the detail panel. Scope to the panel via its unique close button
// to disambiguate.
function timelineDetailPanel(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: 'Close timeline detail panel' }).locator('..')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Era detail panel', () => {
  test('clicking an era node opens the detail panel with era name and description', async ({ page }) => {
    await mockApiRoutes(page, [ERA_PRIMORDIAL], [MAP_OMNIVERSE])
    await page.goto('/explore')

    // The placeholder must be visible before any era node is clicked
    await expect(page.getByText('Select an entity to view details')).toBeVisible()

    // Click the Primordial Era node in the TimelineBar
    await page.getByRole('button', { name: ERA_PRIMORDIAL.name }).click()

    // The era detail panel must be visible with the correct content
    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).toBeVisible()
    await expect(timelineDetailPanel(page).getByText(ERA_PRIMORDIAL.description)).toBeVisible()

    // The placeholder must no longer be visible
    await expect(page.getByText('Select an entity to view details')).not.toBeVisible()
  })

  test('selecting an entity while era detail is open switches the panel to entity view', async ({ page }) => {
    await mockApiRoutes(page, [ERA_PRIMORDIAL], [MAP_OMNIVERSE], [TEST_ENTITY])
    await page.goto('/explore')

    // Open the era detail panel by clicking the era node
    await page.getByRole('button', { name: ERA_PRIMORDIAL.name }).click()
    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).toBeVisible()

    // Click the entity card in the Sidebar
    const entityCard = page.getByRole('button', { name: /Verath the Unbound/ })
    await expect(entityCard).toBeVisible()
    await entityCard.click()

    // The panel must switch to entity view
    await expect(page.getByRole('heading', { name: 'Verath the Unbound' })).toBeVisible()

    // The era detail content must no longer be visible
    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).not.toBeVisible()

    // The placeholder must not be visible either
    await expect(page.getByText('Select an entity to view details')).not.toBeVisible()
  })

  test('clicking an era node while an entity is selected switches the panel to era view', async ({ page }) => {
    await mockApiRoutes(page, [ERA_PRIMORDIAL], [MAP_OMNIVERSE], [TEST_ENTITY])
    await page.goto('/explore')

    // Select the entity card in the Sidebar first
    const entityCard = page.getByRole('button', { name: /Verath the Unbound/ })
    await expect(entityCard).toBeVisible()
    await entityCard.click()
    await expect(page.getByRole('heading', { name: 'Verath the Unbound' })).toBeVisible()

    // Click the era node — the panel must switch to era view
    await page.getByRole('button', { name: ERA_PRIMORDIAL.name }).click()

    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).toBeVisible()
    await expect(page.getByText(ERA_PRIMORDIAL.description)).toBeVisible()

    // The entity detail content must no longer be visible
    await expect(page.getByRole('heading', { name: 'Verath the Unbound' })).not.toBeVisible()
  })

  test('clicking the close button returns the panel to the placeholder state', async ({ page }) => {
    await mockApiRoutes(page, [ERA_PRIMORDIAL], [MAP_OMNIVERSE])
    await page.goto('/explore')

    // Open the era detail panel
    await page.getByRole('button', { name: ERA_PRIMORDIAL.name }).click()
    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).toBeVisible()

    // Click the close button specific to the timeline detail panel
    await page.getByRole('button', { name: 'Close timeline detail panel' }).click()

    // The era detail must be gone and the placeholder must be restored
    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).not.toBeVisible()
    await expect(page.getByText('Select an entity to view details')).toBeVisible()
  })

  test('clicking a different era node while the panel is open updates the panel content', async ({ page }) => {
    // Two eras that share MAP_OMNIVERSE so no map reset occurs (which would
    // distract from the panel-update assertion with a toast)
    const sharedMap = { ...MAP_OMNIVERSE, eraIds: ['primordial', 'ancient'] }

    await mockApiRoutes(page, [ERA_PRIMORDIAL, ERA_ANCIENT], [sharedMap])
    await page.goto('/explore')

    // Open the era detail panel for the Primordial Era
    const primordialButton = page.getByRole('button', { name: ERA_PRIMORDIAL.name })
    const ancientButton = page.getByRole('button', { name: ERA_ANCIENT.name })

    await primordialButton.click()
    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).toBeVisible()

    // Click the Ancient Era node — the panel must stay open and update
    await ancientButton.click()

    // The Ancient Era's content must now be visible
    await expect(page.getByRole('heading', { name: ERA_ANCIENT.name })).toBeVisible()
    await expect(timelineDetailPanel(page).getByText(ERA_ANCIENT.description)).toBeVisible()

    // The Primordial Era's content must no longer be visible
    await expect(page.getByRole('heading', { name: ERA_PRIMORDIAL.name })).not.toBeVisible()

    // The placeholder must not be visible
    await expect(page.getByText('Select an entity to view details')).not.toBeVisible()
  })
})
