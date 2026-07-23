import { useState, useEffect, useRef, useMemo } from 'react'
import { MapPin, ChevronDown, Pencil, LogIn, LogOut } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, ImageOverlay, Marker, useMap, useMapEvents } from 'react-leaflet'
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
import { ApiError } from '@/api/keynorCoreClient'
import { useAspectRatioBox } from '@/hooks/useAspectRatioBox'
import type { AspectRatioBox } from '@/hooks/useAspectRatioBox'
import { useImageDimensions } from '@/hooks/useImageDimensions'
import type { GameMap, MapPin as MapPinData, Entity } from '@/types/universe'

// Lets map images be authored at a known, fixed ratio (e.g. 1920x1080)
// instead of whatever the browser window happens to be. The Leaflet
// CRS.Simple + real-pixel-bounds setup (see NavigableMap) already handles
// any image ratio via pan/zoom — this is purely about how much of the panel
// the map viewport itself occupies, not a Leaflet concern.
const MAP_ASPECT_RATIO = 16 / 9

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
  const { containerRef, box } = useAspectRatioBox(MAP_ASPECT_RATIO)

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
    <div
      ref={containerRef}
      className="flex-1 relative min-h-[500px] bg-background overflow-hidden flex items-center justify-center"
    >
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

      {/* Map surface — letterboxed to a fixed 16:9 box within the panel, so
          authored map images can target a known ratio instead of whatever
          the browser window happens to be. Falls back to filling the panel
          until the first measurement lands (see useAspectRatioBox).
          z-0 is load-bearing, not decorative: Leaflet's internal panes use
          z-index values up to 700 (marker/popup panes), and without an
          explicit (non-auto) z-index here this div never becomes its own
          stacking context — Leaflet's high z-index then compares directly
          against the badges below (z-10) and covers them. z-0 contains it. */}
      <div
        className="relative z-0 overflow-hidden"
        style={box ? { width: box.width, height: box.height } : { width: '100%', height: '100%' }}
      >
        <MapSurface map={selectedMap} editMode={editMode} containerSize={box} />
      </div>

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
  containerSize: AspectRatioBox | null
}

function MapSurface({ map, editMode, containerSize }: MapSurfaceProps) {
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
  return <NavigableMap map={map} editMode={editMode} containerSize={containerSize} />
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Label lives inside the same divIcon as the dot (rather than a separate
// Leaflet Tooltip) so it shares the dot's already-working click target
// instead of introducing a second Leaflet primitive with its own pane and
// interaction behavior. pointer-events: none on the label keeps it purely
// visual — the dot itself remains the only clickable area.
function createPinIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:12px;height:12px;">
        <div style="width:12px;height:12px;border-radius:50%;background:var(--color-primary);border:2px solid white;box-shadow:0 1px 2px rgba(0,0,0,0.35);"></div>
        <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:10px;line-height:1;color:var(--color-foreground);opacity:0.8;white-space:nowrap;pointer-events:none;user-select:none;text-shadow:0 1px 2px rgba(255,255,255,0.85),0 -1px 2px rgba(255,255,255,0.85),1px 0 2px rgba(255,255,255,0.85),-1px 0 2px rgba(255,255,255,0.85);">${escapeHtml(name)}</span>
      </div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function NavigableMap({ map, editMode, containerSize }: { map: GameMap; editMode: boolean; containerSize: AspectRatioBox | null }) {
  const auth = useAuth()
  const t = useTranslation()
  const dimensions = useImageDimensions(map.image)
  const { data: pins, addPin, movePin, removePin } = useMapPins(map.id)
  const [pendingLatLng, setPendingLatLng] = useState<[number, number] | null>(null)
  // Memoized: L.latLngBounds(...) creates a new object identity on every
  // call. Without this, a plain `const bounds = ...` recreated on every
  // render kept FitImageToViewport's effect (which depends on `bounds`)
  // re-running on every unrelated re-render (creating/moving/deleting any
  // pin, toggling editMode, anything) — each re-run called map.fitBounds()
  // again, silently resetting the user's manual pan/zoom back to the fitted
  // view every time. Memoizing on `dimensions` (stable identity from
  // useState, only changes when the image actually reloads) keeps bounds's
  // identity stable otherwise.
  const bounds = useMemo(() => {
    if (!dimensions) return null
    return L.latLngBounds([0, 0], [dimensions.height, dimensions.width])
  }, [dimensions])

  // Map changed out from under an in-progress pin placement — discard it
  // rather than let it apply against the wrong map.
  useEffect(() => {
    setPendingLatLng(null)
  }, [map.id])

  if (!dimensions || !bounds) {
    return <div className="w-full h-full bg-map-water" />
  }

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
      handleAuthErrorIfExpired(error)
    }
  }

  async function handleMovePin(pinId: string, normalizedX: number, normalizedY: number) {
    if (!auth.accessToken) return
    try {
      await movePin(pinId, { normalizedX, normalizedY }, auth.accessToken)
    } catch (error) {
      logger.error('Failed to move map pin', error)
      handleAuthErrorIfExpired(error)
    }
  }

  async function handleDeletePin(pinId: string) {
    if (!auth.accessToken) return
    if (!window.confirm(t('map_pin_delete_confirm'))) return
    try {
      await removePin(pinId, auth.accessToken)
    } catch (error) {
      logger.error('Failed to delete map pin', error)
      handleAuthErrorIfExpired(error)
    }
  }

  // The signing key is ephemeral in dev (see keynor-core's security-model
  // skill) — every backend restart invalidates every previously-issued
  // token. Without this, a stale token in sessionStorage just fails
  // silently (console-only) on every attempt until the user notices the
  // inputter badge is a lie and manually logs out.
  function handleAuthErrorIfExpired(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      auth.logout()
      window.alert(t('auth_session_expired'))
    }
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        crs={L.CRS.Simple}
        // No bounds/center/zoom fit here on purpose — FitImageToViewport
        // below is the single source of truth for the initial view and
        // every re-fit. Using MapContainer's own `bounds` prop AS WELL used
        // to race it: MapContainer applies its initial fit against whatever
        // the container's DOM size already is at mount time, which can be
        // the pre-letterbox fallback size (useAspectRatioBox's box state
        // hasn't committed yet) — a real, too-zoomed-in initial view that
        // FitImageToViewport's later correction wasn't reliably overriding.
        center={[0, 0]}
        zoom={0}
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

        {/* bounds={...} above only fits the image once, on mount. This keeps
            minZoom pinned to "the whole image exactly fills the viewport" —
            without it, minZoom defaulted to an arbitrary fixed value that let
            users zoom out past the image and see the empty background color
            (bg-map-water) as visible borders. Recomputed on resize since the
            "fits the viewport" zoom level depends on the viewport's size. */}
        <FitImageToViewport bounds={bounds} containerSize={containerSize} />

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
            onMove={(normalizedX, normalizedY) => { void handleMovePin(pin.id, normalizedX, normalizedY) }}
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

function FitImageToViewport({ bounds, containerSize }: { bounds: L.LatLngBounds; containerSize: AspectRatioBox | null }) {
  const map = useMap()

  // containerSize comes from useAspectRatioBox's ResizeObserver (in the
  // parent MapArea) — Leaflet has no way to know its own container's pixel
  // size changed unless told. Without invalidateSize() first, getBoundsZoom
  // computes against Leaflet's stale cached size, not the letterboxed box's
  // actual current dimensions, and both the fit and the minZoom floor drift.
  useEffect(() => {
    function fit() {
      map.invalidateSize()
      // getBoundsZoom(bounds, false) = the zoom level at which the whole
      // image is exactly as large as possible while still fully visible —
      // exactly the "can't zoom out past the image" floor requested.
      const fitZoom = map.getBoundsZoom(bounds, false)
      map.setMinZoom(fitZoom)
      map.fitBounds(bounds)
    }
    fit()
    map.on('resize', fit)
    return () => {
      map.off('resize', fit)
    }
  }, [map, bounds, containerSize?.width, containerSize?.height])

  return null
}

interface PinMarkerProps {
  pin: MapPinData
  dimensions: { width: number; height: number }
  editMode: boolean
  onMove: (normalizedX: number, normalizedY: number) => void
  onDelete: () => void
}

function PinMarker({ pin, dimensions, editMode, onMove, onDelete }: PinMarkerProps) {
  const ctx = useAppContext()
  const position = toLatLng(pin.normalizedX, pin.normalizedY, dimensions.width, dimensions.height)
  const icon = useMemo(() => createPinIcon(pin.entity.name), [pin.entity.name])

  return (
    <Marker
      position={position}
      icon={icon}
      draggable={editMode}
      eventHandlers={{
        click: () => {
          if (editMode) {
            onDelete()
            return
          }
          ctx.setSelectedEntity(pin.entity.id)
        },
        // Leaflet suppresses the click event that would otherwise follow a
        // real drag (L.Draggable tracks whether the pointer moved past a
        // threshold), so this doesn't also trigger the click-to-delete
        // handler above.
        dragend: (e: L.DragEndEvent) => {
          const { lat, lng } = e.target.getLatLng()
          const { normalizedX, normalizedY } = fromLatLng(lat, lng, dimensions.width, dimensions.height)
          onMove(normalizedX, normalizedY)
        },
      }}
    />
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
