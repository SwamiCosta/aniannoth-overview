import type { Entity } from '@/types/universe'

const modules = import.meta.glob('/content/*/*.json', { eager: true })

function buildEntityIndex(): Map<string, Entity[]> {
  const index = new Map<string, Entity[]>()
  for (const [path, mod] of Object.entries(modules)) {
    const category = path.split('/')[2]
    const entity = (mod as { default: Entity }).default
    index.set(category, [...(index.get(category) ?? []), entity])
  }
  return index
}

const entityIndex = buildEntityIndex()

export function useEntities(category: string): Entity[] {
  return entityIndex.get(category) ?? []
}

export function useAllEntities(): Entity[] {
  return Array.from(entityIndex.values()).flat()
}
