import type { Era, EntityTimeline } from '@/types/universe'

// An entity is visible in the selected era if that era falls anywhere in the
// [founded, destroyed] interval, not only in the founded era itself. A null
// `destroyed` means the entity is still active — visible from `founded`
// onward with no upper bound.
export function isEntityVisibleInEra(timeline: EntityTimeline, currentEra: Era | undefined, eras: Era[]): boolean {
  if (!currentEra || !timeline.founded) return false

  const foundedEra = eras.find(era => era.name === timeline.founded)
  if (!foundedEra) return false
  if (currentEra.order < foundedEra.order) return false

  if (timeline.destroyed) {
    const destroyedEra = eras.find(era => era.name === timeline.destroyed)
    if (destroyedEra && currentEra.order > destroyedEra.order) return false
  }

  return true
}
