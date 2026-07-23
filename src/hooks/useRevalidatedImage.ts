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
 * Requires the image's origin (R2 bucket) to send CORS headers — fetch(),
 * unlike <img src>/Image(), needs the server's explicit permission to let
 * script read the response. A prior version of this hook shipped without
 * confirming that first and broke image loading entirely for everyone
 * until the bucket's CORS policy was configured to allow this app's origin.
 *
 * Returns an object URL (not the original remote URL) — <img>/Leaflet's
 * ImageOverlay must use this, not the raw map.image string, or they'd go
 * straight to the browser's normal (long-lived) image cache and defeat the
 * whole point.
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
        if (!cancelled) {
          logger.error(
            `Failed to fetch map image (check the image host's CORS policy allows this origin): ${url}`,
            error,
          )
        }
      })

    return () => {
      cancelled = true
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    }
  }, [url])

  return image
}
