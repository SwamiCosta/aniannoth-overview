/**
 * Converts between normalized pin coordinates (0-1, origin top-left, matching
 * how the click handler captures offsetX/offsetY against the rendered image)
 * and Leaflet L.CRS.Simple lat/lng space, where [0,0] is bottom-left and
 * [height, width] is top-right — the standard convention for an ImageOverlay
 * with bounds [[0,0],[height,width]].
 */
export function toLatLng(normalizedX: number, normalizedY: number, width: number, height: number): [number, number] {
  const lat = (1 - normalizedY) * height
  const lng = normalizedX * width
  return [lat, lng]
}

export function fromLatLng(lat: number, lng: number, width: number, height: number): { normalizedX: number; normalizedY: number } {
  const normalizedX = clamp01(lng / width)
  const normalizedY = clamp01(1 - lat / height)
  return { normalizedX, normalizedY }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
