import type { Era } from '@/types/universe'

const modules = import.meta.glob('/content/eras.json', { eager: true })
const erasData = (Object.values(modules)[0] as { default: Era[] }).default

export function useEras(): Era[] {
  return erasData
}
