import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useEras } from '@/hooks/useEras'
import { useMaps } from '@/hooks/useMaps'
import { useAllEntities } from '@/hooks/useEntities'
import { readPersistedEra, writePersistedEra, readEraMapSelection, writeEraMapSelection } from '@/lib/explorationPersistence'
import type { Era } from '@/types/universe'

interface Filters {
  category: string | null
}

interface AppState {
  selectedEra: string
  selectedMap: string
  filters: Filters
  selectedEntityId: string | null
  selectedEntityCategory: string | null
}

export interface SelectedHiddenEntity {
  type: string
  id: string
}

interface AppContextValue extends AppState {
  setEra: (eraId: string) => void
  setMap: (mapId: string) => void
  setFilter: (category: string | null) => void
  // `category` lets DetailPanel fall back to fetching the entity directly
  // (fetchEntityById) when it isn't present in the cached useAllEntities()
  // list -- the case for a `common` entity, which is deliberately excluded
  // from that list but still a legitimate link target. Callers that already
  // have the entity/link's category (Sidebar, RelatedEntities, FactionMembers,
  // a map pin) should always pass it; omitting it just means a common-entity
  // link from that call site won't resolve.
  setSelectedEntity: (id: string | null, category?: string) => void
  mapResetTriggered: boolean
  clearMapResetTrigger: () => void
  erasLoading: boolean
  mapsLoading: boolean
  eraDetailOpen: boolean
  setEraDetailOpen: (open: boolean) => void
  timelineDetailId: string | null
  openTimelineDetail: (entryId: string) => void
  // Hidden content (see root ARCHITECTURE.md — "Cross-Project Feature:
  // Hidden Content & Black Pins") is never part of the normal entities
  // list, so it is tracked separately from selectedEntityId rather than
  // overloading it with ids that useAllEntities() would never resolve.
  selectedHiddenEntity: SelectedHiddenEntity | null
  setSelectedHiddenEntity: (entity: SelectedHiddenEntity | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: eras, loading: erasLoading } = useEras()
  const { data: maps, loading: mapsLoading } = useMaps()
  const { data: entities, loading: entitiesLoading } = useAllEntities()

  const [selectedEra, setSelectedEra] = useState<string>('')
  const [selectedMap, setSelectedMap] = useState<string>('')
  const [filters, setFilters] = useState<Filters>({ category: null })
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [selectedEntityCategory, setSelectedEntityCategory] = useState<string | null>(null)
  const [mapResetTriggered, setMapResetTriggered] = useState(false)
  const [eraDetailOpen, setEraDetailOpen] = useState(false)
  const [timelineDetailId, setTimelineDetailId] = useState<string | null>(null)
  const [selectedHiddenEntity, setSelectedHiddenEntityState] = useState<SelectedHiddenEntity | null>(null)

  // Era/entity ids are per-language rows (one row per translation, linked by
  // translationGroupId — see keynor-core EraResponse/CharacterResponse etc).
  // These refs remember which translation group the current selection belongs
  // to, so a language switch can be resolved to its new-language id instead of
  // leaving selectedEra/timelineDetailId/selectedEntityId pointing at an id
  // that only existed in the previous language's response.
  const selectedEraGroupIdRef = useRef<string | null>(null)
  const timelineDetailGroupIdRef = useRef<string | null>(null)
  const selectedEntityGroupIdRef = useRef<string | null>(null)

  function defaultMapForEra(eraId: string): string {
    return maps.find(m => m.availableInEras.includes(eraId))?.id ?? ''
  }

  // Resolves which map an era should show: the map the user last selected
  // for that specific era (if still valid for it) takes priority over
  // `fallbackMapId` (typically the map being left), which in turn takes
  // priority over the era's own default. `wasReset` tells the caller whether
  // this is a genuine reset (worth a toast) or a silent restore/carry-over.
  function resolveMapForEra(eraId: string, fallbackMapId?: string): { mapId: string; wasReset: boolean } {
    const rememberedMapId = readEraMapSelection()[eraId]
    if (rememberedMapId && maps.some(m => m.id === rememberedMapId && m.availableInEras.includes(eraId))) {
      return { mapId: rememberedMapId, wasReset: false }
    }
    if (fallbackMapId && maps.some(m => m.id === fallbackMapId && m.availableInEras.includes(eraId))) {
      return { mapId: fallbackMapId, wasReset: false }
    }
    return { mapId: defaultMapForEra(eraId), wasReset: true }
  }

  function firstEraByOrder(eraList: Era[]): Era | undefined {
    const eraEntries = eraList.filter(e => !e.type || e.type === 'ERA')
    if (eraEntries.length === 0) return undefined
    return [...eraEntries].sort((a, b) => a.order - b.order)[0]
  }

  // Waits for both eras and maps to finish loading (not just eras) so the
  // persisted-map lookup below has a populated `maps` array to validate
  // against instead of racing an empty one.
  useEffect(() => {
    if (erasLoading || mapsLoading || selectedEra) return

    const persistedEraId = readPersistedEra()
    const restoredEra = persistedEraId ? eras.find(e => e.id === persistedEraId) : undefined
    const initialEra = restoredEra ?? firstEraByOrder(eras)
    if (!initialEra) return

    setSelectedEra(initialEra.id)
    selectedEraGroupIdRef.current = initialEra.translationGroupId
    setSelectedMap(resolveMapForEra(initialEra.id).mapId)
  }, [eras, erasLoading, maps, mapsLoading, selectedEra])

  // Re-resolve the current era and timeline selection after a language switch
  // brings in a new eras array with different (per-language) ids.
  useEffect(() => {
    // erasLoading (not eras.length) distinguishes "still loading" from "loaded
    // but genuinely empty" — the latter must still fall through and clear a
    // now-stale selection instead of being silently skipped.
    if (erasLoading) return

    if (selectedEra && !eras.some(e => e.id === selectedEra)) {
      const groupId = selectedEraGroupIdRef.current
      const remapped = groupId ? eras.find(e => e.translationGroupId === groupId) : undefined
      if (remapped) {
        setSelectedEra(remapped.id)
        selectedEraGroupIdRef.current = remapped.translationGroupId
      } else {
        // No translation found for the previously selected era — fall back to
        // the same default the bootstrap effect uses, rather than leaving
        // selectedEra pointing at an id that no longer exists anywhere.
        const fallback = firstEraByOrder(eras)
        if (fallback) {
          setSelectedEra(fallback.id)
          selectedEraGroupIdRef.current = fallback.translationGroupId
          setSelectedMap(resolveMapForEra(fallback.id).mapId)
        }
      }
    }

    if (timelineDetailId && !eras.some(e => e.id === timelineDetailId)) {
      const groupId = timelineDetailGroupIdRef.current
      const remapped = groupId ? eras.find(e => e.translationGroupId === groupId) : undefined
      if (remapped) {
        setTimelineDetailId(remapped.id)
        timelineDetailGroupIdRef.current = remapped.translationGroupId
      } else {
        setEraDetailOpen(false)
        setTimelineDetailId(null)
      }
    }
    // erasLoading is read as a guard above and must be in the dependency array:
    // setData and setLoading(false) in useEras can land in separate renders, so
    // relying on `eras` alone would let this effect fire once while still
    // loading (a no-op) and never get a second chance once loading clears,
    // since `eras`'s reference does not change again on its own.
  }, [eras, erasLoading])

  // Re-resolve the selected entity after a language switch brings in a new
  // entities array with different (per-language) ids. Does not apply to a
  // `common` entity (selectedEntityCategory set, never present in `entities`
  // by design — see fetchEntityById fallback in DetailPanel): there is no
  // cached groupId to remap from for a common entity, and nulling the
  // selection out here would silently close the panel on every language
  // switch. Left showing the same (now possibly wrong-language) row instead,
  // which DetailPanel's own direct fetch keeps rendering — a known rough
  // edge, not a regression, since the alternative is losing the selection.
  useEffect(() => {
    if (selectedEntityId === null) return
    if (entitiesLoading) return
    if (entities.some(e => e.id === selectedEntityId)) return
    if (selectedEntityCategory !== null) return

    const groupId = selectedEntityGroupIdRef.current
    const remapped = groupId ? entities.find(e => e.translationGroupId === groupId) : undefined
    if (remapped) {
      setSelectedEntityId(remapped.id)
      selectedEntityGroupIdRef.current = remapped.translationGroupId
    } else {
      setSelectedEntityId(null)
    }
    // entitiesLoading must be in the dependency array for the same reason as
    // erasLoading above — see the era/timeline remap effect. selectedEntityId
    // and selectedEntityCategory are deliberately left out: this effect only
    // needs to react to `entities` changing (a language switch), not to every
    // selection change — both are read via closure, which is fine since they
    // change together and this effect re-closes over their latest value the
    // next time `entities`/`entitiesLoading` actually changes.
  }, [entities, entitiesLoading])

  function setEra(eraId: string) {
    const era = eras.find(e => e.id === eraId)
    if (!era) return

    // Prefer the map this era was last showing over merely checking whether
    // the map being left happens to also be valid here — two different eras
    // can share a map, and that coincidence must not overwrite the target
    // era's own remembered selection.
    const { mapId, wasReset } = resolveMapForEra(eraId, selectedMap)

    setSelectedEra(eraId)
    selectedEraGroupIdRef.current = era.translationGroupId
    if (mapId !== selectedMap) {
      setSelectedMap(mapId)
    }
    if (wasReset) {
      setMapResetTriggered(true)
    }
  }

  function setMap(mapId: string) {
    setSelectedMap(mapId)
  }

  function setFilter(category: string | null) {
    setFilters(prev => ({ ...prev, category }))
  }

  function setSelectedEntity(id: string | null, category?: string) {
    setSelectedEntityId(id)
    setSelectedEntityCategory(id ? (category ?? null) : null)
    selectedEntityGroupIdRef.current = id ? (entities.find(e => e.id === id)?.translationGroupId ?? null) : null
    if (id !== null) {
      setEraDetailOpen(false)
      setSelectedHiddenEntityState(null)
    }
  }

  function setSelectedHiddenEntity(entity: SelectedHiddenEntity | null) {
    setSelectedHiddenEntityState(entity)
    if (entity !== null) {
      setEraDetailOpen(false)
      setSelectedEntityId(null)
      setSelectedEntityCategory(null)
    }
  }

  // Persists the current era so a reload restores it, and records it as the
  // era last selected for `selectedMap` so a later revisit of this era
  // restores this exact map — see resolveMapForEra above. Runs after every
  // render where both are set, including the bootstrap/remap restores
  // themselves; writeEraMapSelection no-ops when the value hasn't changed.
  useEffect(() => {
    if (!selectedEra) return
    writePersistedEra(selectedEra)
  }, [selectedEra])

  useEffect(() => {
    if (!selectedEra || !selectedMap) return
    writeEraMapSelection(selectedEra, selectedMap)
  }, [selectedEra, selectedMap])

  function clearMapResetTrigger() {
    setMapResetTriggered(false)
  }

  function openTimelineDetail(entryId: string) {
    setTimelineDetailId(entryId)
    timelineDetailGroupIdRef.current = eras.find(e => e.id === entryId)?.translationGroupId ?? null
    setEraDetailOpen(true)
    setSelectedEntityId(null)
    setSelectedEntityCategory(null)
  }

  return (
    <AppContext.Provider
      value={{
        selectedEra,
        selectedMap,
        filters,
        selectedEntityId,
        selectedEntityCategory,
        setEra,
        setMap,
        setFilter,
        setSelectedEntity,
        mapResetTriggered,
        clearMapResetTrigger,
        erasLoading,
        mapsLoading,
        eraDetailOpen,
        setEraDetailOpen,
        timelineDetailId,
        openTimelineDetail,
        selectedHiddenEntity,
        setSelectedHiddenEntity,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
