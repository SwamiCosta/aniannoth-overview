import MapArea from '@/components/MapArea'
import Sidebar from '@/components/Sidebar'

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col pt-[calc(3rem+5rem)]">
      {/* Zone 3: map + sidebar */}
      <div className="flex flex-row flex-1">
        <MapArea />
        <div className="w-80 border-l border-border">
          <Sidebar />
        </div>
      </div>

      {/* Zone 4: detail panel */}
      <div className="border-t border-border h-48 flex items-center justify-center text-muted text-sm">
        Detail panel — coming next
      </div>
    </div>
  )
}
