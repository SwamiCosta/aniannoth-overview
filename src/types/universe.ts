export interface Era {
  id: string
  name: string
  order: number
  period: string
  summary: string
  mapType: 'navigable' | 'abstract'
  defaultMap: string
  color: string
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

export interface Entity {
  id: string
  name: string
  category: string
  tags: string[]
  images: string[]
  summary: string
  body: string
  location: string
  timeline: EntityTimeline
  status: 'canon' | 'draft' | 'deprecated'
}
