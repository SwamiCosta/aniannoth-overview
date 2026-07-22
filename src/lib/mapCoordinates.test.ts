import { describe, it, expect } from 'vitest'
import { toLatLng, fromLatLng } from './mapCoordinates'

describe('mapCoordinates', () => {
  it('round-trips a normalized coordinate through toLatLng and back through fromLatLng', () => {
    const width = 2000
    const height = 1000

    const [lat, lng] = toLatLng(0.25, 0.75, width, height)
    const { normalizedX, normalizedY } = fromLatLng(lat, lng, width, height)

    expect(normalizedX).toBeCloseTo(0.25)
    expect(normalizedY).toBeCloseTo(0.75)
  })

  it('clamps fromLatLng output to the [0, 1] range when the lat/lng falls outside the image bounds', () => {
    const width = 2000
    const height = 1000

    const withinBounds = fromLatLng(500, 1000, width, height)
    expect(withinBounds.normalizedX).toBeGreaterThanOrEqual(0)
    expect(withinBounds.normalizedX).toBeLessThanOrEqual(1)

    const outOfBounds = fromLatLng(-500, 3000, width, height)
    expect(outOfBounds.normalizedX).toBe(1)
    expect(outOfBounds.normalizedY).toBe(1)
  })
})
