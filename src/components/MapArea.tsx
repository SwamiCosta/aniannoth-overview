import { useState, useEffect, useRef, useMemo } from 'react'
import { MapPin, ChevronDown, Pencil, LogIn, LogOut } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, ImageOverlay, Marker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useAppContext } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useMaps } from '@/hooks/useMaps'
import { useMapPins } from '@/hooks/useMapPins'
import { useAllEntities } from '@/hooks/useEntities'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { toLatLng, fromLatLng } from '@/lib/mapCoordinates'
import { typeForCategory } from '@/lib/entityCategory'
import { logger } from '@/lib/logger'
import type { GameMap, MapPin as MapPinData, Entity } from '@/types/universe'

export default function MapArea() {
  const ctx = useAppContext()
  const auth = useAuth()
  const t = useTranslation()
  const { data: maps } = useMaps()

  const selectedMap = maps.find(m => m.id === ctx.selectedMap)
  const availableMaps = maps.filter(m => m.availableInEras.includes(ctx.selectedEra))

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Edit mode only ever makes sense for an inputter session — drop out of it
  // automatically if the token disappears (logout) mid-edit.
  useEffect(() => {
    if (auth.role !== 'inputter' && editMode) setEditMode(false)
  }, [auth.role, editMode])

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

      {/* Top-right: map selector + auth/edit controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {auth.role === 'inputter' && (
          <button
            onClick={() => setEditMode(prev => !prev)}
            className={cn(
              'text-sm px-3 py-1 rounded-full flex items-center gap-1.5 border transition-colors cursor-pointer',
              editMode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface border-border text-foreground hover:border-primary-border'
            )}
          >
            <Pencil size={14} />
            <span>{t(editMode ? 'map_edit_mode_exit' : 'map_edit_mode_enter')}</span>
          </button>
        )}

        <AuthControl />

        <div ref={dropdownRef} className="relative">
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
                <div className="px-3 py-2 text-sm text-muted">{t('map_no_maps_available')}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full whitespace-nowrap pointer-events-none">
          {t('map_edit_mode_on')}
        </div>
      )}

      {/* Map surface */}
      <MapSurface map={selectedMap} editMode={editMode} />

      {/* Toast notification */}
      <div
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-foreground text-background text-sm px-4 py-2 rounded-lg transition-opacity duration-300 whitespace-nowrap pointer-events-none',
          showToast ? 'opacity-100' : 'opacity-0'
        )}
      >
        {t('map_reset_toast')}
      </div>
    </div>
  )
}

function AuthControl() {
  const auth = useAuth()
  const t = useTranslation()

  if (auth.role === 'inputter') {
    return (
      <button
        onClick={auth.logout}
        title={t('auth_logout')}
        className="bg-primary-light border border-primary-border text-primary text-sm px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer"
      >
        <LogOut size={14} />
        <span>{t('auth_inputter_badge')}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => { void auth.login() }}
      disabled={auth.isAuthenticating}
      title={t('auth_login')}
      className="bg-surface border border-border text-sm px-3 py-1 rounded-full flex items-center gap-1.5 text-muted cursor-pointer hover:border-primary-border transition-colors disabled:opacity-50"
    >
      <LogIn size={14} />
    </button>
  )
}

interface MapSurfaceProps {
  map: GameMap | undefined
  editMode: boolean
}

function MapSurface({ map, editMode }: MapSurfaceProps) {
  const t = useTranslation()

  if (!map) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-map-land">
        <span className="text-muted text-sm">{t('map_no_map_selected')}</span>
      </div>
    )
  }

  if (map.type === 'abstract') {
    if (!map.image) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-map-land">
          <span className="text-muted text-sm">{t('map_no_image_available')}</span>
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
  return <NavigableMap map={map} editMode={editMode} />
}

function useImageDimensions(url: string | undefined): { width: number; height: number } | null {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

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

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:var(--color-primary);border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function NavigableMap({ map, editMode }: { map: GameMap; editMode: boolean }) {
  const auth = useAuth()
  const t = useTranslation()
  const dimensions = useImageDimensions(map.image)
  const { data: pins, addPin, removePin } = useMapPins(map.id)
  const [pendingLatLng, setPendingLatLng] = useState<[number, number] | null>(null)

  // Map changed out from under an in-progress pin placement — discard it
  // rather than let it apply against the wrong map.
  useEffect(() => {
    setPendingLatLng(null)
  }, [map.id])

  if (!dimensions) {
    return <div className="w-full h-full bg-map-water" />
  }

  const bounds = L.latLngBounds([0, 0], [dimensions.height, dimensions.width])

  async function handlePickEntity(entity: Entity) {
    if (!pendingLatLng || !auth.accessToken) return
    const { normalizedX, normalizedY } = fromLatLng(pendingLatLng[0], pendingLatLng[1], dimensions!.width, dimensions!.height)
    const entityType = typeForCategory(entity.category)
    setPendingLatLng(null)
    if (!entityType) {
      logger.error(`No EntityType mapping for category: ${entity.category}`)
      return
    }
    try {
      await addPin({ entityType, entityId: entity.id, normalizedX, normalizedY }, auth.accessToken)
    } catch (error) {
      logger.error('Failed to create map pin from picker', error)
    }
  }

  async function handleDeletePin(pinId: string) {
    if (!auth.accessToken) return
    if (!window.confirm(t('map_pin_delete_confirm'))) return
    try {
      await removePin(pinId, auth.accessToken)
    } catch (error) {
      logger.error('Failed to delete map pin', error)
    }
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        crs={L.CRS.Simple}
        center={[dimensions.height / 2, dimensions.width / 2]}
        zoom={0}
        minZoom={-3}
        // Finer-grained zoom steps than Leaflet's default (zoomSnap/zoomDelta=1,
        // wheelPxPerZoomLevel=60) — the default felt like each wheel tick jumped
        // a full zoom level, too aggressive for a CRS.Simple image overlay.
        zoomSnap={0.25}
        zoomDelta={0.25}
        wheelPxPerZoomLevel={180}
        className="w-full h-full"
        style={{ background: 'var(--color-map-water)' }}
      >
        {map.image && <ImageOverlay url={map.image} bounds={bounds} />}

        {/* Stop listening once a pin is pending — otherwise a click on the
            picker overlay below (rendered outside MapContainer, but Leaflet
            still owns pointer events inside its own container bounds) could
            leak through and silently move pendingLatLng before onPick runs. */}
        {editMode && !pendingLatLng && <MapClickCapture onMapClick={setPendingLatLng} />}

        {pins.map(pin => (
          <PinMarker
            key={pin.id}
            pin={pin}
            dimensions={dimensions}
            editMode={editMode}
            onDelete={() => { void handleDeletePin(pin.id) }}
          />
        ))}
      </MapContainer>

      {/* Rendered as a sibling of MapContainer, not a child — a picker
          nested inside MapContainer sits in the same DOM subtree Leaflet
          attaches its own native click handling to, and this is exactly what
          caused the reported bug: selecting an entity from the list could
          register as a second map click, silently overwriting pendingLatLng
          with wherever the list happened to render on screen before onPick
          ever ran, so the pin landed at that spot instead of the original click. */}
      {editMode && pendingLatLng && (
        <EntityPickerOverlay
          onCancel={() => setPendingLatLng(null)}
          onPick={entity => { void handlePickEntity(entity) }}
        />
      )}
    </div>
  )
}

function MapClickCapture({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

interface PinMarkerProps {
  pin: MapPinData
  dimensions: { width: number; height: number }
  editMode: boolean
  onDelete: () => void
}

function PinMarker({ pin, dimensions, editMode, onDelete }: PinMarkerProps) {
  const ctx = useAppContext()
  const position = toLatLng(pin.normalizedX, pin.normalizedY, dimensions.width, dimensions.height)

  return (
    <Marker
      position={position}
      icon={pinIcon}
      eventHandlers={{
        click: () => {
          if (editMode) {
            onDelete()
            return
          }
          ctx.setSelectedEntity(pin.entity.id)
        },
      }}
    >
      <Tooltip permanent direction="top" offset={[0, -10]} className="!bg-surface !border-border !text-foreground !text-xs !px-1.5 !py-0.5">
        {pin.entity.name}
      </Tooltip>
    </Marker>
  )
}

interface EntityPickerOverlayProps {
  onPick: (entity: Entity) => void
  onCancel: () => void
}

function EntityPickerOverlay({ onPick, onCancel }: EntityPickerOverlayProps) {
  const t = useTranslation()
  const { data: entities } = useAllEntities()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return entities.slice(0, 50)
    return entities.filter(e => e.name.toLowerCase().includes(query)).slice(0, 50)
  }, [entities, search])

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        className="bg-surface border border-border rounded-lg shadow-xl w-80 max-h-96 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border">
          <p className="text-sm font-medium text-foreground mb-2">{t('map_pin_pick_entity')}</p>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('map_pin_search_placeholder')}
            className="w-full text-sm px-2 py-1 rounded border border-border bg-background text-foreground"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">{t('map_pin_no_matches')}</p>
          ) : (
            filtered.map(entity => (
              <button
                key={entity.id}
                onClick={() => onPick(entity)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between gap-2"
              >
                <span className="text-foreground truncate">{entity.name}</span>
                <span className="text-primary text-[10px] tracking-widest font-medium uppercase shrink-0">
                  {entity.category}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t border-border">
          <button
            onClick={onCancel}
            className="w-full text-sm px-3 py-1.5 rounded text-muted hover:bg-background transition-colors"
          >
            {t('map_pin_cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
