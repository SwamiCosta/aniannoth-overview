import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useEras } from '@/hooks/useEras'
import { useMaps } from '@/hooks/useMaps'

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

  const [selectedEra, setSelectedEra] = useState<string>('')
  const [selectedMap, setSelectedMap] = useState<string>('')
  const [filters, setFilters] = useState<Filters>({ category: null })
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [mapResetTriggered, setMapResetTriggered] = useState(false)
  const [eraDetailOpen, setEraDetailOpen] = useState(false)
  const [timelineDetailId, setTimelineDetailId] = useState<string | null>(null)

  function defaultMapForEra(eraId: string): string {
    return maps.find(m => m.availableInEras.includes(eraId))?.id ?? ''
  }

  useEffect(() => {
    if (eras.length > 0 && !selectedEra) {
      const eraEntries = eras.filter(e => !e.type || e.type === 'ERA')
      if (eraEntries.length === 0) return
      const firstEra = [...eraEntries].sort((a, b) => a.order - b.order)[0]
      setSelectedEra(firstEra.id)
      setSelectedMap(defaultMapForEra(firstEra.id))
    }
  }, [eras, selectedEra])

  function setEra(eraId: string) {
    const era = eras.find(e => e.id === eraId)
    if (!era) return

    const currentMap = maps.find(m => m.id === selectedMap)
    const mapAvailable = currentMap?.availableInEras.includes(eraId) ?? false

    setSelectedEra(eraId)
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
    if (id !== null) {
      setEraDetailOpen(false)
    }
  }

  function clearMapResetTrigger() {
    setMapResetTriggered(false)
  }

  function openTimelineDetail(entryId: string) {
    setTimelineDetailId(entryId)
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
