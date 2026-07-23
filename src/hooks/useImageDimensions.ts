import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export interface ImageDimensions {
  width: number
  height: number
}

/**
 * Loads an image via the browser's native Image() (not fetch()) purely to
 * read its natural dimensions. Deliberately NOT fetch()-based: an earlier
 * version routed this through fetch(url, { cache: 'no-cache' }) to force
 * cache revalidation, but fetch() requires the server to send CORS headers
 * for cross-origin requests — R2's public bucket URL doesn't, so that broke
 * loading entirely (Image()/<img src> don't have this requirement; only
 * script-readable requests like fetch() do). Cache freshness for a
 * same-URL image replacement is a manual cache-busting query param on the
 * stored URL, not something handled here.
 */
export function useImageDimensions(url: string | undefined): ImageDimensions | null {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null)

  useEffect(() => {
    setDimensions(null)
    if (!url) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      if (!cancelled) logger.error(`Failed to load map image for dimension detection: ${url}`)
    }
    img.src = url
    return () => { cancelled = true }
  }, [url])

  return dimensions
}
