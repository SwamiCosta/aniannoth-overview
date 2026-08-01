import { describe, it, expect } from 'vitest'
import { isEntityVisibleInEra } from './entityTimeline'
import type { Era } from '@/types/universe'

function era(name: string, order: number): Era {
  return { id: name, name, order, type: 'ERA', importance: null, description: '', translationGroupId: name, links: [] }
}

const PRIMORDIAL = era('Primordial', 0)
const ANCIENT = era('Ancient', 1)
const MODERN = era('Modern', 2)
const ERAS = [PRIMORDIAL, ANCIENT, MODERN]

describe('isEntityVisibleInEra', () => {
  it('is visible in every era within the founded-to-destroyed interval, not just the founded era', () => {
    const timeline = { founded: 'Primordial', destroyed: 'Modern' }

    expect(isEntityVisibleInEra(timeline, PRIMORDIAL, ERAS)).toBe(true)
    expect(isEntityVisibleInEra(timeline, ANCIENT, ERAS)).toBe(true)
    expect(isEntityVisibleInEra(timeline, MODERN, ERAS)).toBe(true)
  })

  it('is not visible before it was founded', () => {
    const timeline = { founded: 'Ancient', destroyed: null }

    expect(isEntityVisibleInEra(timeline, PRIMORDIAL, ERAS)).toBe(false)
  })

  it('is visible only in the founded era when destroyed is not declared', () => {
    const timeline = { founded: 'Primordial', destroyed: null }

    expect(isEntityVisibleInEra(timeline, PRIMORDIAL, ERAS)).toBe(true)
    expect(isEntityVisibleInEra(timeline, ANCIENT, ERAS)).toBe(false)
    expect(isEntityVisibleInEra(timeline, MODERN, ERAS)).toBe(false)
  })

  it('is not visible after it was destroyed', () => {
    const timeline = { founded: 'Primordial', destroyed: 'Ancient' }

    expect(isEntityVisibleInEra(timeline, MODERN, ERAS)).toBe(false)
  })
})
