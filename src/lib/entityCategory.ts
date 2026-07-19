/**
 * Maps an entity link's `type` (as returned by the keynor-core API, e.g.
 * "CHARACTER", "LORE") to the category slug used for filtering and routing
 * in this app (e.g. "characters", "lore").
 *
 * Keep this map in sync with the categories iterated in `useEntities.ts`
 * (`CATEGORIES`) and the API path segments used in `entityApi.ts`.
 */
const ENTITY_TYPE_TO_CATEGORY: Record<string, string> = {
  CHARACTER: 'characters',
  PLACE: 'places',
  FACTION: 'factions',
  ITEM: 'items',
  EVENT: 'events',
  LORE: 'lore',
}

export function categoryForType(type: string): string | undefined {
  return ENTITY_TYPE_TO_CATEGORY[type.toUpperCase()]
}

/**
 * Character portraits are commonly framed from the waist up, so a centered
 * crop tends to cut off the head. Every other category (places, factions,
 * items, events, lore) reads fine center-cropped.
 */
export function imageAlignmentClass(category: string): 'object-top' | 'object-center' {
  return category === 'characters' ? 'object-top' : 'object-center'
}
