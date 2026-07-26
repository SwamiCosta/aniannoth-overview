export interface Era {
  id: string
  name: string
  order: number
  type: 'ERA' | 'POINT'
  importance: 'STANDARD' | 'MAJOR' | null
  description: string
  translationGroupId: string
}

export interface GameMap {
  id: string
  name: string
  type: 'navigable' | 'abstract'
  image: string
  availableInEras: string[]
}

export interface EntityTimeline {
  era: string
  born?: number
  died?: number
  founded?: number
  destroyed?: number
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
  entity: LinkedEntity
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
