import { test, expect } from '@playwright/test'

/**
 * End-to-end specs for multi-image entity support (AO-2, AO-3).
 *
 * These tests mock the keynor-core API so they run independently of the
 * backend. They will pass once:
 *   1. @playwright/test is installed (protected action — needs authorization).
 *   2. The keynor-core feat/feat-entity-images PR has been merged AND the
 *      corresponding aniannoth-overview PR (this branch) has been merged.
 *
 * The mocked API shape follows the keynor-core contract: `images: string[]`.
 */

const IMAGE_A = 'https://placehold.co/400x400/534AB7/ffffff?text=A'
const IMAGE_B = 'https://placehold.co/400x400/D85A30/ffffff?text=B'

/** Minimal paged response helper. */
function pagedOf<T>(items: T[]) {
  return { content: items, page: 0, size: 100, totalElements: items.length }
}

const entityWithImages = {
  id: 'hero-entity',
  name: 'Hero Entity',
  summary: 'An entity with multiple images.',
  body: '## Hero\n\nThis entity has images.',
  tags: ['test'],
  categories: ['characters'],
  status: 'CANON',
  images: [IMAGE_A, IMAGE_B],
  timelineFoundedEra: 'primordial',
  timelineDestroyedEra: null,
}

const entityWithoutImages = {
  id: 'bare-entity',
  name: 'Bare Entity',
  summary: 'An entity with no images.',
  body: '## Bare\n\nNo images here.',
  tags: ['test'],
  categories: ['characters'],
  status: 'CANON',
  images: [],
  timelineFoundedEra: 'primordial',
  timelineDestroyedEra: null,
}

/**
 * Intercept all category API calls.
 * Only 'characters' returns data; all others return an empty page.
 */
async function mockApiRoutes(
  page: import('@playwright/test').Page,
  entities: typeof entityWithImages[],
) {
  const categories = ['characters', 'places', 'factions', 'items', 'events', 'lore']

  for (const category of categories) {
    await page.route(`**/api/public/v1/${category}?size=100`, async route => {
      const items = category === 'characters' ? entities : []
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pagedOf(items)),
      })
    })
  }
}

test.describe('DetailPanel — image gallery', () => {
  test('displays all images in a gallery when entity has multiple images', async ({ page }) => {
    await mockApiRoutes(page, [entityWithImages])
    await page.goto('/explore')

    // Click the entity card in the sidebar to open the detail panel
    await page.getByRole('button', { name: /Hero Entity/ }).click()

    // The first image should be visible as the active gallery slide
    const mainImage = page.getByAltText(/Hero Entity — image 1 of 2/)
    await expect(mainImage).toBeVisible()

    // Navigate to the second image
    await page.getByRole('button', { name: 'Next image' }).click()
    const secondImage = page.getByAltText(/Hero Entity — image 2 of 2/)
    await expect(secondImage).toBeVisible()

    // The thumbnail strip should show two thumbnails
    const thumbnails = page.getByRole('button', { name: /View image \d/ })
    await expect(thumbnails).toHaveCount(2)
  })

  test('displays empty state without broken images when entity has no images', async ({ page }) => {
    await mockApiRoutes(page, [entityWithoutImages])
    await page.goto('/explore')

    await page.getByRole('button', { name: /Bare Entity/ }).click()

    // The empty state placeholder should appear
    const emptyState = page.locator('[aria-label="No images available"]')
    await expect(emptyState).toBeVisible()

    // No <img> tags should be rendered in the left column (no broken images)
    const galleryImages = page.locator('[aria-label="No images available"] img')
    await expect(galleryImages).toHaveCount(0)
  })
})

test.describe('Sidebar — entity card thumbnail', () => {
  test('shows the first image as a thumbnail when images[0] is available', async ({ page }) => {
    await mockApiRoutes(page, [entityWithImages])
    await page.goto('/explore')

    // The thumbnail img inside the hero entity card should have a src matching IMAGE_A
    const card = page.getByRole('button', { name: /Hero Entity/ })
    const thumbnail = card.locator('img').first()
    await expect(thumbnail).toHaveAttribute('src', IMAGE_A)
  })

  test('shows a neutral placeholder when entity has no images', async ({ page }) => {
    await mockApiRoutes(page, [entityWithoutImages])
    await page.goto('/explore')

    const card = page.getByRole('button', { name: /Bare Entity/ })

    // No <img> element inside the card thumbnail area (only the User icon SVG is rendered)
    const thumbnailImg = card.locator('div.shrink-0 img')
    await expect(thumbnailImg).toHaveCount(0)
  })
})
