import MapArea from '@/components/MapArea'
import Sidebar from '@/components/Sidebar'
import DetailPanel from '@/components/DetailPanel'

export default function ExplorePage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Zone 3: map + sidebar */}
      <div className="flex flex-row flex-1">
        <MapArea />
        <div className="w-80 border-l border-border">
          <Sidebar />
        </div>
      </div>

      {/* Zone 4: detail panel */}
      <DetailPanel />
    </div>
  )
}
