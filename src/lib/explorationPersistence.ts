// Persists the explore view's era/map selection to sessionStorage so a page
// reload restores the same era and, per era, the same map the user had last
// selected for it. sessionStorage (not localStorage) is deliberate — this is
// same-session continuity, not a durable cross-visit preference.

const SELECTED_ERA_KEY = 'aniannoth_selected_era'
const ERA_MAP_SELECTION_KEY = 'aniannoth_era_map_selection'

export function readPersistedEra(): string | null {
  return sessionStorage.getItem(SELECTED_ERA_KEY)
}

export function writePersistedEra(eraId: string): void {
  sessionStorage.setItem(SELECTED_ERA_KEY, eraId)
}

export function readEraMapSelection(): Record<string, string> {
  const raw = sessionStorage.getItem(ERA_MAP_SELECTION_KEY)
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return isStringRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function writeEraMapSelection(eraId: string, mapId: string): void {
  const current = readEraMapSelection()
  if (current[eraId] === mapId) return
  sessionStorage.setItem(ERA_MAP_SELECTION_KEY, JSON.stringify({ ...current, [eraId]: mapId }))
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(v => typeof v === 'string')
  )
}
