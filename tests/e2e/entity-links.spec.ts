import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for cross-entity links rendered in the DetailPanel.
 *
 * Covers:
 *   1. Happy path — opening a Lore entity's detail panel shows a
 *      "Related entities" section listing its linked entities.
 *   2. Cross-category navigation — clicking a CANON linked entity (a
 *      Character referenced from the Lore entry) navigates to that
 *      entity's detail view and updates the active category filter.
 *   3. Non-canon links — a DRAFT/DEPRECATED linked entity renders as
 *      disabled (non-clickable) with a tooltip instead of a dead link,
 *      since the public atlas only serves CANON entities.
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

const LINKED_CHARACTER = {
  id: 'char-aroneus',
  name: 'Aroneus',
  summary: 'A keeper of forgotten records.',
  body: '',
  tags: [],
  categories: ['characters'],
  status: 'CANON',
  images: [],
  timelineFoundedEra: 'primordial',
  timelineDestroyedEra: null,
}

const LORE_ENTITY = {
  id: 'lore-codex',
  name: 'The First Codex',
  summary: 'A record from the beginning.',
  body: '## Origins\n\nThe Codex predates the material world.',
  tags: ['ancient'],
  categories: ['lore'],
  status: 'CANON',
  images: [],
  timelineFoundedEra: 'primordial',
  timelineDestroyedEra: null,
  links: [
    { type: 'CHARACTER', id: LINKED_CHARACTER.id, name: LINKED_CHARACTER.name, status: 'CANON' },
    { type: 'CHARACTER', id: 'char-draft-001', name: 'An Unfinished Soul', status: 'DRAFT' },
  ],
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

  const entitiesByCategory: Record<string, unknown[]> = {
    characters: [LINKED_CHARACTER],
    places: [],
    factions: [],
    items: [],
    events: [],
    lore: [LORE_ENTITY],
  }

  for (const [category, entities] of Object.entries(entitiesByCategory)) {
    await page.route(`**/api/public/v1/${category}?size=100`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pagedOf(entities)),
      })
    })
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('DetailPanel — cross-entity links', () => {
  test('shows the Related entities section for a Lore entity with links', async ({ page }) => {
    await mockApiRoutes(page)
    await page.goto('/explore')

    // Switch to the Lore category and open the Lore entity
    await page.getByRole('button', { name: 'Lore', exact: true }).click()
    const loreCard = page.getByRole('button', { name: /The First Codex/ })
    await expect(loreCard).toBeVisible()
    await loreCard.click()

    await expect(page.getByRole('heading', { name: 'The First Codex' })).toBeVisible()
    await expect(page.getByText('Related entities')).toBeVisible()
    await expect(page.getByText(LINKED_CHARACTER.name)).toBeVisible()
  })

  test('clicking a CANON linked entity navigates to its detail view', async ({ page }) => {
    await mockApiRoutes(page)
    await page.goto('/explore')

    await page.getByRole('button', { name: 'Lore', exact: true }).click()
    const loreCard = page.getByRole('button', { name: /The First Codex/ })
    await expect(loreCard).toBeVisible()
    await loreCard.click()
    await expect(page.getByText('Related entities')).toBeVisible()

    // Click the linked Character — it is rendered as a clickable button
    await page.getByRole('button', { name: new RegExp(LINKED_CHARACTER.name) }).click()

    // The detail panel must now show the linked Character's detail
    await expect(page.getByRole('heading', { name: LINKED_CHARACTER.name })).toBeVisible()

    // The Sidebar category filter must have switched to "characters"
    await expect(page.getByRole('button', { name: 'Characters', exact: true })).toHaveClass(/bg-primary/)
  })

  test('a DRAFT linked entity is rendered disabled with a tooltip, not clickable', async ({ page }) => {
    await mockApiRoutes(page)
    await page.goto('/explore')

    await page.getByRole('button', { name: 'Lore', exact: true }).click()
    const loreCard = page.getByRole('button', { name: /The First Codex/ })
    await expect(loreCard).toBeVisible()
    await loreCard.click()
    await expect(page.getByText('Related entities')).toBeVisible()

    // The DRAFT link must not be an interactive button
    const draftLinkButton = page.getByRole('button', { name: /An Unfinished Soul/ })
    await expect(draftLinkButton).toHaveCount(0)

    // It must be visible as plain (disabled) text carrying the tooltip
    const draftLink = page.getByText('An Unfinished Soul')
    await expect(draftLink).toBeVisible()
    await expect(draftLink.locator('xpath=ancestor::*[@aria-disabled="true"]')).toHaveAttribute(
      'title',
      'Not available in the public atlas',
    )
  })
})
