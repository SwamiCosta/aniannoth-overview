import type { GameMap } from '@/types/universe'

const modules = import.meta.glob('/content/maps.json', { eager: true })
const mapsData = (Object.values(modules)[0] as { default: GameMap[] }).default

export function useMaps(): GameMap[] {
  return mapsData
}
