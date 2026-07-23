import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export interface AspectRatioBox {
  width: number
  height: number
}

/**
 * Measures the element `containerRef` is attached to and returns the largest
 * box of the given aspect ratio that fits entirely within it — letterboxed
 * on whichever axis has room to spare, the same way a video player fits a
 * fixed-ratio video into a resizable window instead of stretching it.
 */
export function useAspectRatioBox(ratio: number): { containerRef: RefObject<HTMLDivElement | null>; box: AspectRatioBox | null } {
  const containerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<AspectRatioBox | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    function computeBox(availableWidth: number, availableHeight: number) {
      if (availableWidth <= 0 || availableHeight <= 0) return
      const widthFromHeight = availableHeight * ratio
      if (widthFromHeight <= availableWidth) {
        setBox({ width: widthFromHeight, height: availableHeight })
      } else {
        setBox({ width: availableWidth, height: availableWidth / ratio })
      }
    }

    // Synchronous initial measurement (useLayoutEffect, before paint) avoids
    // a visible flash of the un-letterboxed full-size box on first render —
    // the ResizeObserver callback below only fires asynchronously.
    computeBox(el.clientWidth, el.clientHeight)

    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      computeBox(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ratio])

  return { containerRef, box }
}
