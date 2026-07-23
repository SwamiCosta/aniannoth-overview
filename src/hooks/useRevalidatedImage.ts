import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export interface RevalidatedImage {
  objectUrl: string
  width: number
  height: number
}

/**
 * Loads an image via fetch() with cache: 'no-cache', which forces the
 * browser to always revalidate with the server (a conditional request using
 * ETag/Last-Modified) instead of blindly trusting a long-lived cached copy
 * indefinitely. If the image changed server-side, the new bytes are picked
 * up automatically on the very next load — no manual cache-busting URL bump
 * needed. If unchanged, the server replies 304 and the browser reuses its
 * cached body, so this doesn't force a full re-download every time either.
 *
 * Returns an object URL (not the original remote URL) — <img>/Leaflet's
 * ImageOverlay must use this, not the raw map.image string, or they'd go
 * straight to the browser's normal (long-lived) image cache and defeat the
 * whole point.
 *
 * Why this exists: a plain `new Image(); img.src = url` (the browser's
 * default image loading) is a *implicit* fetch outside our control — it
 * follows normal HTTP caching rules, and critically, dynamically-triggered
 * loads like this don't reliably get bypassed even by a user's hard reload
 * (Ctrl+Shift+R), unlike resources tied to the page's initial navigation.
 * Routing the load through our own fetch() call is what lets us force the
 * revalidation behavior explicitly, every time, regardless of how the page
 * was loaded.
 */
export function useRevalidatedImage(url: string | undefined): RevalidatedImage | null {
  const [image, setImage] = useState<RevalidatedImage | null>(null)

  useEffect(() => {
    setImage(null)
    if (!url) return
    let cancelled = false
    let createdObjectUrl: string | null = null

    fetch(url, { cache: 'no-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`)
        return response.blob()
      })
      .then(blob => {
        if (cancelled) return
        createdObjectUrl = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          if (cancelled || !createdObjectUrl) return
          setImage({ objectUrl: createdObjectUrl, width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = () => {
          if (!cancelled) logger.error(`Failed to decode map image: ${url}`)
        }
        img.src = createdObjectUrl
      })
      .catch(error => {
        if (!cancelled) logger.error(`Failed to fetch map image: ${url}`, error)
      })

    return () => {
      cancelled = true
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    }
  }, [url])

  return image
}
