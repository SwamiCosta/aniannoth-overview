import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for the Sidebar category filter chips.
 *
 * Covers: clicking a category filter chip in the Sidebar shows only entities
 * of that category; clicking "All" (or the same chip again) restores the full
 * entity list.
 *
 * API mocking:
 *   All HTTP calls are intercepted via page.route() so tests run without a
 *   real backend.  The filter chips currently available are: All, Characters,
 *   Lore (see Sidebar.tsx FILTER_CHIPS constant).
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

const CHARACTER_ENTITY = {
  id: 'char-001',
  name: 'Aelindra the Wise',
  summary: 'A powerful arcane scholar.',
  body: '',
  tags: ['mage'],
  categories: ['characters'],
  status: 'CANON',
  images: [],
  timelineFoundedEra: 'primordial',
  timelineDestroyedEra: null,
}

const LORE_ENTITY = {
  id: 'lore-001',
  name: 'The First Codex',
  summary: 'A record from the beginning.',
  body: '',
  tags: ['ancient'],
  categories: ['lore'],
  status: 'CANON',
  images: [],
  timelineFoundedEra: 'primordial',
  timelineDestroyedEra: null,
}

// ---------------------------------------------------------------------------
// Route setup helper
// ---------------------------------------------------------------------------

type EntityRecord = typeof CHARACTER_ENTITY

async function mockApiRoutes(
  page: import('@playwright/test').Page,
  entities: EntityRecord[],
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

test.describe('Sidebar — category filter chips', () => {
  test('all entities are visible when no filter is active', async ({ page }) => {
    await mockApiRoutes(page, [CHARACTER_ENTITY, LORE_ENTITY])
    await page.goto('/explore')

    // Both entities must be visible in the sidebar with no filter active
    await expect(page.getByRole('button', { name: /Aelindra the Wise/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /The First Codex/ })).toBeVisible()
  })

  test('clicking "Characters" shows only character entities', async ({ page }) => {
    await mockApiRoutes(page, [CHARACTER_ENTITY, LORE_ENTITY])
    await page.goto('/explore')

    // Wait for entities to load
    await expect(page.getByRole('button', { name: /Aelindra the Wise/ })).toBeVisible()

    // Click the Characters filter chip
    await page.getByRole('button', { name: 'Characters' }).click()

    // Only the character entity should remain visible
    await expect(page.getByRole('button', { name: /Aelindra the Wise/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /The First Codex/ })).not.toBeVisible()
  })

  test('clicking "Lore" shows only lore entities', async ({ page }) => {
    await mockApiRoutes(page, [CHARACTER_ENTITY, LORE_ENTITY])
    await page.goto('/explore')

    await expect(page.getByRole('button', { name: /The First Codex/ })).toBeVisible()

    // Click the Lore filter chip
    await page.getByRole('button', { name: 'Lore' }).click()

    // Only the lore entity should remain visible
    await expect(page.getByRole('button', { name: /The First Codex/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Aelindra the Wise/ })).not.toBeVisible()
  })

  test('clicking "All" after a category filter restores all entities', async ({ page }) => {
    await mockApiRoutes(page, [CHARACTER_ENTITY, LORE_ENTITY])
    await page.goto('/explore')

    await expect(page.getByRole('button', { name: /Aelindra the Wise/ })).toBeVisible()

    // Apply the Characters filter
    await page.getByRole('button', { name: 'Characters' }).click()
    await expect(page.getByRole('button', { name: /The First Codex/ })).not.toBeVisible()

    // Reset to All
    await page.getByRole('button', { name: 'All' }).click()

    // Both entities should be visible again
    await expect(page.getByRole('button', { name: /Aelindra the Wise/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /The First Codex/ })).toBeVisible()
  })
})
