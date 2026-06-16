import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for the DetailPanel entity view.
 *
 * Covers:
 *   - The panel shows a placeholder ("Select an entity to view details") when
 *     no entity is selected.
 *   - Clicking an entity card in the Sidebar opens the detail panel with the
 *     correct entity name.
 *   - Clicking the close button (aria-label="Close detail panel") hides the
 *     panel and restores the placeholder.
 *
 * API mocking:
 *   All HTTP calls are intercepted via page.route() so tests run without a
 *   real backend.
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

const TEST_ENTITY = {
  id: 'verath-001',
  name: 'Verath the Unbound',
  summary: 'A being from before time.',
  body: '## Origins\n\nVerath existed before the first dawn.',
  tags: ['divine', 'ancient'],
  categories: ['characters'],
  status: 'CANON',
  images: [],
  timelineFoundedEra: 'primordial',
  timelineDestroyedEra: null,
}

// ---------------------------------------------------------------------------
// Route setup helper
// ---------------------------------------------------------------------------

async function mockApiRoutes(
  page: import('@playwright/test').Page,
  entities: typeof TEST_ENTITY[],
) {
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
// Tests
// ---------------------------------------------------------------------------

test.describe('DetailPanel', () => {
  test('shows the placeholder when no entity is selected on initial load', async ({ page }) => {
    await mockApiRoutes(page, [TEST_ENTITY])
    await page.goto('/explore')

    // The panel renders the collapsed placeholder bar until an entity is selected
    await expect(page.getByText('Select an entity to view details')).toBeVisible()
  })

  test('opens and shows the entity name when a sidebar card is clicked', async ({ page }) => {
    await mockApiRoutes(page, [TEST_ENTITY])
    await page.goto('/explore')

    // Wait for the entity card to appear in the sidebar
    const entityCard = page.getByRole('button', { name: /Verath the Unbound/ })
    await expect(entityCard).toBeVisible()

    // Click the card to select the entity
    await entityCard.click()

    // The detail panel must show the entity name in a heading
    await expect(page.getByRole('heading', { name: 'Verath the Unbound' })).toBeVisible()

    // The placeholder must no longer be visible
    await expect(page.getByText('Select an entity to view details')).not.toBeVisible()
  })

  test('clicking the close button hides the panel and restores the placeholder', async ({ page }) => {
    await mockApiRoutes(page, [TEST_ENTITY])
    await page.goto('/explore')

    // Open the detail panel
    const entityCard = page.getByRole('button', { name: /Verath the Unbound/ })
    await expect(entityCard).toBeVisible()
    await entityCard.click()
    await expect(page.getByRole('heading', { name: 'Verath the Unbound' })).toBeVisible()

    // Click the close button (aria-label="Close detail panel")
    await page.getByRole('button', { name: 'Close detail panel' }).click()

    // Panel must close: entity name gone, placeholder visible
    await expect(page.getByRole('heading', { name: 'Verath the Unbound' })).not.toBeVisible()
    await expect(page.getByText('Select an entity to view details')).toBeVisible()
  })
})
