import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useEras } from '@/hooks/useEras'
import { useMaps } from '@/hooks/useMaps'
import { useAllEntities } from '@/hooks/useEntities'

interface Filters {
  category: string | null
}

interface AppState {
  selectedEra: string
  selectedMap: string
  filters: Filters
  selectedEntityId: string | null
}

interface AppContextValue extends AppState {
  setEra: (eraId: string) => void
  setMap: (mapId: string) => void
  setFilter: (category: string | null) => void
  setSelectedEntity: (id: string | null) => void
  mapResetTriggered: boolean
  clearMapResetTrigger: () => void
  erasLoading: boolean
  mapsLoading: boolean
  eraDetailOpen: boolean
  setEraDetailOpen: (open: boolean) => void
  timelineDetailId: string | null
  openTimelineDetail: (entryId: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: eras, loading: erasLoading } = useEras()
  const { data: maps, loading: mapsLoading } = useMaps()
  const { data: entities } = useAllEntities()

  const [selectedEra, setSelectedEra] = useState<string>('')
  const [selectedMap, setSelectedMap] = useState<string>('')
  const [filters, setFilters] = useState<Filters>({ category: null })
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [mapResetTriggered, setMapResetTriggered] = useState(false)
  const [eraDetailOpen, setEraDetailOpen] = useState(false)
  const [timelineDetailId, setTimelineDetailId] = useState<string | null>(null)

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

  useEffect(() => {
    if (eras.length > 0 && !selectedEra) {
      const eraEntries = eras.filter(e => !e.type || e.type === 'ERA')
      if (eraEntries.length === 0) return
      const firstEra = [...eraEntries].sort((a, b) => a.order - b.order)[0]
      setSelectedEra(firstEra.id)
      selectedEraGroupIdRef.current = firstEra.translationGroupId
      setSelectedMap(defaultMapForEra(firstEra.id))
    }
  }, [eras, selectedEra])

  // Re-resolve the current era and timeline selection after a language switch
  // brings in a new eras array with different (per-language) ids.
  useEffect(() => {
    if (eras.length === 0) return

    if (selectedEra && !eras.some(e => e.id === selectedEra)) {
      const groupId = selectedEraGroupIdRef.current
      const remapped = groupId ? eras.find(e => e.translationGroupId === groupId) : undefined
      if (remapped) {
        setSelectedEra(remapped.id)
        selectedEraGroupIdRef.current = remapped.translationGroupId
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
  }, [eras])

  // Re-resolve the selected entity after a language switch brings in a new
  // entities array with different (per-language) ids.
  useEffect(() => {
    if (selectedEntityId === null) return
    if (entities.length === 0) return
    if (entities.some(e => e.id === selectedEntityId)) return

    const groupId = selectedEntityGroupIdRef.current
    const remapped = groupId ? entities.find(e => e.translationGroupId === groupId) : undefined
    if (remapped) {
      setSelectedEntityId(remapped.id)
      selectedEntityGroupIdRef.current = remapped.translationGroupId
    } else {
      setSelectedEntityId(null)
    }
  }, [entities])

  function setEra(eraId: string) {
    const era = eras.find(e => e.id === eraId)
    if (!era) return

    const currentMap = maps.find(m => m.id === selectedMap)
    const mapAvailable = currentMap?.availableInEras.includes(eraId) ?? false

    setSelectedEra(eraId)
    selectedEraGroupIdRef.current = era.translationGroupId
    if (!mapAvailable) {
      setSelectedMap(defaultMapForEra(eraId))
      setMapResetTriggered(true)
    }
  }

  function setMap(mapId: string) {
    setSelectedMap(mapId)
  }

  function setFilter(category: string | null) {
    setFilters(prev => ({ ...prev, category }))
  }

  function setSelectedEntity(id: string | null) {
    setSelectedEntityId(id)
    selectedEntityGroupIdRef.current = id ? (entities.find(e => e.id === id)?.translationGroupId ?? null) : null
    if (id !== null) {
      setEraDetailOpen(false)
    }
  }

  function clearMapResetTrigger() {
    setMapResetTriggered(false)
  }

  function openTimelineDetail(entryId: string) {
    setTimelineDetailId(entryId)
    timelineDetailGroupIdRef.current = eras.find(e => e.id === entryId)?.translationGroupId ?? null
    setEraDetailOpen(true)
    setSelectedEntityId(null)
  }

  return (
    <AppContext.Provider
      value={{
        selectedEra,
        selectedMap,
        filters,
        selectedEntityId,
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
