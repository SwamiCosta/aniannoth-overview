import type { Era, EntityTimeline } from '@/types/universe'

// An entity is visible in the selected era if that era falls anywhere in the
// [founded, destroyed] interval. A missing `destroyed` does NOT mean "still
// active forever" — unless an entity explicitly declares the era it ends in,
// it is only ever shown in the era it began in (a single-era window).
export function isEntityVisibleInEra(timeline: EntityTimeline, currentEra: Era | undefined, eras: Era[]): boolean {
  if (!currentEra || !timeline.founded) return false

  const foundedEra = eras.find(era => era.name === timeline.founded)
  if (!foundedEra) return false

  if (!timeline.destroyed) {
    return currentEra.order === foundedEra.order
  }

  const destroyedEra = eras.find(era => era.name === timeline.destroyed)
  if (!destroyedEra) return false

  return currentEra.order >= foundedEra.order && currentEra.order <= destroyedEra.order
}
