export interface Era {
  id: string
  name: string
  order: number
  type: 'ERA' | 'POINT'
  importance: 'STANDARD' | 'MAJOR' | null
  description: string
  translationGroupId: string
  links: LinkedEntity[]
}

export interface GameMap {
  id: string
  name: string
  type: 'navigable' | 'abstract'
  image: string
  availableInEras: string[]
}

export interface EntityTimeline {
  founded: string | null
  destroyed: string | null
}

export interface LinkedEntity {
  type: string
  id: string
  // Empty string / 'draft' when hidden is true and still locked (the API
  // redacts the real name/status until unlocked) — components must branch on
  // `hidden` first, never assume `name`/`status` are meaningful on their own.
  name: string
  status: 'canon' | 'draft' | 'deprecated'
  hidden: boolean
}

export interface HiddenEntity {
  id: string
  type: string
  name: string
  summary: string
  body: string
  images: string[]
  links: LinkedEntity[]
}

export interface FactionMember {
  id: string
  name: string
  status: 'canon' | 'draft' | 'deprecated'
}

export interface MapPin {
  id: string
  mapId: string
  // The effective label to render — the pin's own custom name if set,
  // otherwise the linked entity's live name. Null when the target entity is
  // still-locked hidden content (black pin — see MapArea's createHiddenPinIcon)
  // or, in principle, an entity-less pin created with a blank name (rejected
  // server-side, so this should not happen in practice).
  name: string | null
  // Null when the pin has no linked entity yet (see change 3 — a pin can be
  // created before the element it points to exists).
  entity: LinkedEntity | null
  // Null means the pin is shown regardless of the selected era (default,
  // preserves pre-existing behavior). A specific era id scopes the pin to
  // that era only — see MapArea's era filtering of `pins`.
  eraId: string | null
  normalizedX: number
  normalizedY: number
}

export interface Entity {
  id: string
  name: string
  category: string
  images: string[]
  summary: string
  body: string
  location: string
  timeline: EntityTimeline
  status: 'canon' | 'draft' | 'deprecated'
  links: LinkedEntity[]
  members: string[]
  translationGroupId: string
}
