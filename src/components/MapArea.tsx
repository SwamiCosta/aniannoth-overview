import { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, ImageOverlay } from 'react-leaflet'
import L from 'leaflet'
import { useAppContext } from '@/context/AppContext'
import { useMaps } from '@/hooks/useMaps'
import { cn } from '@/lib/utils'
import type { GameMap } from '@/types/universe'

export default function MapArea() {
  const ctx = useAppContext()
  const maps = useMaps()

  const selectedMap = maps.find(m => m.id === ctx.selectedMap)
  const availableMaps = maps.filter(m => m.availableInEras.includes(ctx.selectedEra))

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Toast on map reset — cleanup lives in a separate unmount-only effect
  // to prevent the re-render triggered by clearMapResetTrigger() from cancelling the timer
  useEffect(() => {
    if (!ctx.mapResetTriggered) return
    if (toastTimeoutRef.current !== null) clearTimeout(toastTimeoutRef.current)
    setShowToast(true)
    ctx.clearMapResetTrigger()
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 2500)
  }, [ctx.mapResetTriggered])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  function handleMapSelect(mapId: string) {
    ctx.setMap(mapId)
    setDropdownOpen(false)
  }

  return (
    <div className="flex-1 relative min-h-[500px] bg-background">
      {/* Top-left: map name badge */}
      <div className="absolute top-3 left-3 z-10 bg-surface border border-border text-sm px-3 py-1 rounded-full flex items-center gap-1.5 text-foreground select-none">
        <MapPin size={14} />
        <span>{selectedMap?.name ?? '—'}</span>
      </div>

      {/* Top-right: map selector */}
      <div ref={dropdownRef} className="absolute top-3 right-3 z-10">
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="bg-surface border border-border text-sm px-3 py-1 rounded-full flex items-center gap-1.5 text-foreground cursor-pointer hover:border-primary-border transition-colors"
        >
          <span>{selectedMap?.name ?? '—'}</span>
          <ChevronDown
            size={14}
            className={cn('transition-transform', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1 bg-surface border border-border rounded-lg overflow-hidden min-w-[160px]">
            {availableMaps.length > 0 ? (
              availableMaps.map(map => (
                <button
                  key={map.id}
                  onClick={() => handleMapSelect(map.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm transition-colors',
                    map.id === ctx.selectedMap
                      ? 'bg-primary-light text-primary font-medium'
                      : 'text-foreground hover:bg-background'
                  )}
                >
                  {map.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted">No maps available</div>
            )}
          </div>
        )}
      </div>

      {/* Map surface */}
      <MapSurface map={selectedMap} />

      {/* Toast notification */}
      <div
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-foreground text-background text-sm px-4 py-2 rounded-lg transition-opacity duration-300 whitespace-nowrap pointer-events-none',
          showToast ? 'opacity-100' : 'opacity-0'
        )}
      >
        Map unavailable for this era. Redirected to default.
      </div>
    </div>
  )
}

interface MapSurfaceProps {
  map: GameMap | undefined
}

function MapSurface({ map }: MapSurfaceProps) {
  if (!map) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-map-land">
        <span className="text-muted text-sm">No map selected</span>
      </div>
    )
  }

  if (map.type === 'abstract') {
    if (!map.image) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-map-land">
          <span className="text-muted text-sm">No map image available</span>
        </div>
      )
    }
    return (
      <img
        src={map.image}
        alt={map.name}
        className="w-full h-full object-cover"
      />
    )
  }

  // navigable map — Leaflet
  return <NavigableMap map={map} />
}

function NavigableMap({ map }: { map: GameMap }) {
  const bounds = L.latLngBounds([[-90, -180], [90, 180]])

  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      className="w-full h-full"
      style={{ background: 'var(--color-map-water)' }}
    >
      {map.image && (
        <ImageOverlay url={map.image} bounds={bounds} />
      )}
    </MapContainer>
  )
}
