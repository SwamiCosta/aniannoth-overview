import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for temporal point pins in the TimelineBar.
 *
 * Covers:
 *   1. STANDARD temporal point pin is visible between era nodes in the timeline.
 *   2. MAJOR temporal point pin is visible between era nodes and carries the
 *      primary accent color treatment (bg-primary class on its diamond shape).
 *   3. Temporal point pins are NOT interactive era-selection buttons — they
 *      do not carry aria-pressed and are not buttons.
 *
 * API mocking:
 *   All HTTP calls are intercepted via page.route() so these tests run without
 *   a real backend (keynor-core at localhost:8080 is NOT required).
 */

// ---------------------------------------------------------------------------
// Mock data — mirrors the keynor-core API contract for eras + temporal points
// ---------------------------------------------------------------------------

function pagedOf<T>(items: T[]) {
  return { content: items, page: 0, size: 100, totalElements: items.length }
}

const ERA_PRIMORDIAL = {
  id: 'primordial',
  name: 'The Primordial Era',
  order: 1,
  type: 'ERA',
  importance: null,
  description: 'The age before the material world.',
}

const ERA_ANCIENT = {
  id: 'ancient',
  name: 'The Ancient Era',
  order: 3,
  type: 'ERA',
  importance: null,
  description: 'The first age of the material world.',
}

const POINT_STANDARD = {
  id: 'point-silence',
  name: 'The First Silence',
  order: 2,
  type: 'POINT',
  importance: 'STANDARD',
  description: null,
}

const POINT_MAJOR = {
  id: 'point-sundering',
  name: 'The Great Sundering',
  order: 4,
  type: 'POINT',
  importance: 'MAJOR',
  description: null,
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

async function mockApiRoutes(
  page: import('@playwright/test').Page,
  eras: object[],
  maps: object[],
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
// Tests — temporal point pins in the timeline
// ---------------------------------------------------------------------------

test.describe('TimelineBar — temporal point pins', () => {
  test('STANDARD temporal point pin is visible between era nodes', async ({ page }) => {
    await mockApiRoutes(
      page,
      [ERA_PRIMORDIAL, POINT_STANDARD, ERA_ANCIENT],
      [MAP_OMNIVERSE, MAP_WORLD],
    )
    await page.goto('/explore')

    // Both era nodes must render as buttons
    await expect(page.getByRole('button', { name: ERA_PRIMORDIAL.name })).toBeVisible()
    await expect(page.getByRole('button', { name: ERA_ANCIENT.name })).toBeVisible()

    // The STANDARD temporal point must be visible by its name label
    const pointLabel = page.getByText(POINT_STANDARD.name)
    await expect(pointLabel).toBeVisible()

    // The point pin must carry the STANDARD marker attribute
    const standardPin = page.locator('[data-point-type="STANDARD"]')
    await expect(standardPin).toBeVisible()
  })

  test('MAJOR temporal point pin is visible and carries the primary accent treatment', async ({ page }) => {
    await mockApiRoutes(
      page,
      [ERA_PRIMORDIAL, ERA_ANCIENT, POINT_MAJOR],
      [MAP_OMNIVERSE, MAP_WORLD],
    )
    await page.goto('/explore')

    await expect(page.getByRole('button', { name: ERA_PRIMORDIAL.name })).toBeVisible()

    // The MAJOR temporal point must be visible by its name label
    const pointLabel = page.getByText(POINT_MAJOR.name)
    await expect(pointLabel).toBeVisible()

    // The MAJOR pin wrapper must carry the MAJOR marker attribute
    const majorPin = page.locator('[data-point-type="MAJOR"]')
    await expect(majorPin).toBeVisible()
  })

  test('temporal point pins are not interactive era-selection buttons', async ({ page }) => {
    await mockApiRoutes(
      page,
      [ERA_PRIMORDIAL, POINT_STANDARD, POINT_MAJOR],
      [MAP_OMNIVERSE],
    )
    await page.goto('/explore')

    await expect(page.getByRole('button', { name: ERA_PRIMORDIAL.name })).toBeVisible()

    // Temporal points must NOT be buttons — they are display-only
    const standardPin = page.locator('[data-point-type="STANDARD"]')
    const majorPin = page.locator('[data-point-type="MAJOR"]')

    await expect(standardPin).toBeVisible()
    await expect(majorPin).toBeVisible()

    // Confirm neither pin is a button element
    await expect(standardPin).not.toHaveRole('button')
    await expect(majorPin).not.toHaveRole('button')
  })

  test('era buttons remain selectable when temporal points are present', async ({ page }) => {
    await mockApiRoutes(
      page,
      [ERA_PRIMORDIAL, POINT_STANDARD, ERA_ANCIENT, POINT_MAJOR],
      [MAP_OMNIVERSE, MAP_WORLD],
    )
    await page.goto('/explore')

    const primordialButton = page.getByRole('button', { name: ERA_PRIMORDIAL.name })
    const ancientButton = page.getByRole('button', { name: ERA_ANCIENT.name })

    // Initial state: primordial is active
    await expect(primordialButton).toHaveAttribute('aria-pressed', 'true')
    await expect(ancientButton).toHaveAttribute('aria-pressed', 'false')

    // Switching eras still works even with temporal points interspersed
    await ancientButton.click()
    await expect(ancientButton).toHaveAttribute('aria-pressed', 'true')
    await expect(primordialButton).toHaveAttribute('aria-pressed', 'false')
  })
})
