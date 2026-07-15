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
  name: string
  status: 'canon' | 'draft' | 'deprecated'
}

export interface FactionMember {
  id: string
  name: string
  status: 'canon' | 'draft' | 'deprecated'
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
