import { useEras } from '@/hooks/useEras'
import { useAppContext } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import type { Era } from '@/types/universe'

function EraNode({ era, isActive }: { era: Era; isActive: boolean }) {
  const ctx = useAppContext()
  const isAbstract = era.mapType === 'abstract'

  return (
    <button
      onClick={() => { ctx.setEra(era.id); ctx.setEraDetailOpen(true) }}
      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
      aria-label={era.name}
      aria-pressed={isActive}
    >
      {/* Circle node */}
      <span
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
          isAbstract && 'border-dashed',
          isActive
            ? 'border-transparent'
            : 'border-border group-hover:border-primary-border group-hover:bg-primary-light bg-surface'
        )}
        style={
          isActive
            ? { backgroundColor: era.color, borderColor: era.color }
            : undefined
        }
      />

      {/* Label */}
      <span
        className={cn(
          'text-[11px] leading-tight text-center max-w-[80px] transition-colors',
          isActive ? 'font-medium' : 'text-muted group-hover:text-foreground'
        )}
        style={isActive ? { color: era.color } : undefined}
      >
        {era.name}
      </span>
    </button>
  )
}

function StandardPointPin({ point }: { point: Era }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      aria-label={point.name}
      data-point-type="STANDARD"
      title={point.name}
    >
      {/* Small circle pin — sits on the connecting line */}
      <span className="w-3 h-3 rounded-full bg-border border border-muted block" />

      {/* Label */}
      <span className="text-[10px] leading-tight text-center max-w-[60px] text-muted">
        {point.name}
      </span>
    </div>
  )
}

function MajorPointPin({ point }: { point: Era }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      aria-label={point.name}
      data-point-type="MAJOR"
      title={point.name}
    >
      {/* Diamond shape — rotated square using primary accent color */}
      <span
        className="w-4 h-4 rotate-45 bg-primary border-2 border-primary-border block"
        aria-hidden="true"
      />

      {/* Label */}
      <span className="text-[10px] leading-tight text-center max-w-[60px] text-primary font-medium">
        {point.name}
      </span>
    </div>
  )
}

export default function TimelineBar() {
  const { data: erasData } = useEras()
  const entries = [...erasData].sort((a, b) => a.order - b.order)
  const ctx = useAppContext()

  return (
    <div className="sticky top-12 z-40 bg-surface border-b border-border px-6 py-3">
      {/* Label */}
      <span className="block text-[10px] uppercase tracking-widest text-muted font-medium mb-2">
        timeline
      </span>

      {/* Track */}
      <div className="relative flex items-start">
        {/* Connecting line */}
        <div className="absolute top-3 left-0 right-0 h-px bg-border" />

        {/* Timeline entries — eras and temporal points */}
        <div className="relative flex w-full justify-between">
          {entries.map((entry) => {
            if (entry.type === 'POINT') {
              if (entry.importance === 'MAJOR') {
                return <MajorPointPin key={entry.id} point={entry} />
              }
              return <StandardPointPin key={entry.id} point={entry} />
            }

            const isActive = entry.id === ctx.selectedEra
            return <EraNode key={entry.id} era={entry} isActive={isActive} />
          })}
        </div>
      </div>
    </div>
  )
}
