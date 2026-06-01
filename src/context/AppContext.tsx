import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { useEras } from '@/hooks/useEras'
import { useMaps } from '@/hooks/useMaps'

interface Filters {
  category: string | null
  tags: string[]
}

interface AppState {
  selectedEra: string
  selectedMap: string
  filters: Filters
}

interface AppContextValue extends AppState {
  setEra: (eraId: string) => void
  setMap: (mapId: string) => void
  setFilter: (category: string | null) => void
  mapResetTriggered: boolean
  clearMapResetTrigger: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const eras = useEras()
  const maps = useMaps()

  const firstEra = [...eras].sort((a, b) => a.order - b.order)[0]

  const [selectedEra, setSelectedEra] = useState<string>(firstEra?.id ?? '')
  const [selectedMap, setSelectedMap] = useState<string>(firstEra?.defaultMap ?? '')
  const [filters, setFilters] = useState<Filters>({ category: null, tags: [] })
  const [mapResetTriggered, setMapResetTriggered] = useState(false)

  function setEra(eraId: string) {
    const era = eras.find(e => e.id === eraId)
    if (!era) return

    const currentMap = maps.find(m => m.id === selectedMap)
    const mapAvailable = currentMap?.availableInEras.includes(eraId) ?? false

    setSelectedEra(eraId)
    if (!mapAvailable) {
      setSelectedMap(era.defaultMap)
      setMapResetTriggered(true)
    }
  }

  function setMap(mapId: string) {
    setSelectedMap(mapId)
  }

  function setFilter(category: string | null) {
    setFilters(prev => ({ ...prev, category }))
  }

  function clearMapResetTrigger() {
    setMapResetTriggered(false)
  }

  return (
    <AppContext.Provider
      value={{
        selectedEra,
        selectedMap,
        filters,
        setEra,
        setMap,
        setFilter,
        mapResetTriggered,
        clearMapResetTrigger,
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
