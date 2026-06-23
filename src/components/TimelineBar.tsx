import { useEras } from '@/hooks/useEras'
import { useAppContext } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import type { Era } from '@/types/universe'

function EraNode({ era, isActive }: { era: Era; isActive: boolean }) {
  const ctx = useAppContext()
  const isAbstract = era.mapType === 'abstract'

  return (
    <button
      onClick={() => { ctx.setEra(era.id); ctx.openTimelineDetail(era.id) }}
      className="relative flex flex-col items-center gap-1.5 group cursor-pointer shrink-0 focus:outline-none"
      aria-label={era.name}
      aria-pressed={isActive}
    >
      {/* Marker — fixed-size slot keeps every entry type centered on the connecting line */}
      <span className="relative w-6 h-6 flex items-center justify-center">
        <span
          className={cn(
            'w-6 h-6 rounded-full border-2 transition-colors',
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
        {/* Inner dot distinguishes the active era from a flat color fill */}
        {isActive && <span className="absolute w-2 h-2 rounded-full bg-surface" aria-hidden="true" />}
      </span>

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

function StandardPointPin({ point, isSelected }: { point: Era; isSelected: boolean }) {
  const ctx = useAppContext()

  return (
    <button
      onClick={() => ctx.openTimelineDetail(point.id)}
      className="relative flex flex-col items-center gap-1.5 group cursor-pointer shrink-0 focus:outline-none"
      aria-label={point.name}
      aria-pressed={isSelected}
      data-point-type="STANDARD"
      title={point.name}
    >
      {/* Marker — fixed-size slot keeps the dot centered on the connecting line */}
      <span className="relative w-6 h-6 flex items-center justify-center">
        <span
          className={cn(
            'w-3 h-3 rounded-full border block transition-colors',
            isSelected
              ? 'bg-primary border-primary'
              : 'bg-border border-muted group-hover:border-primary-border'
          )}
        />
      </span>

      {/* Label */}
      <span
        className={cn(
          'text-[10px] leading-tight text-center max-w-[60px] transition-colors',
          isSelected ? 'text-primary font-medium' : 'text-muted group-hover:text-foreground'
        )}
      >
        {point.name}
      </span>
    </button>
  )
}

function MajorPointPin({ point, isSelected }: { point: Era; isSelected: boolean }) {
  const ctx = useAppContext()

  return (
    <button
      onClick={() => ctx.openTimelineDetail(point.id)}
      className="relative flex flex-col items-center gap-1.5 group cursor-pointer shrink-0 focus:outline-none"
      aria-label={point.name}
      aria-pressed={isSelected}
      data-point-type="MAJOR"
      title={point.name}
    >
      {/* Marker — fixed-size slot gives the rotated diamond headroom so its tip isn't clipped */}
      <span className="relative w-6 h-6 flex items-center justify-center">
        <span
          className={cn(
            'w-3.5 h-3.5 rotate-45 border-2 block transition-colors',
            isSelected ? 'bg-primary border-foreground' : 'bg-primary border-primary-border group-hover:bg-primary/80'
          )}
          aria-hidden="true"
        />
      </span>

      {/* Label */}
      <span
        className={cn(
          'text-[10px] leading-tight text-center max-w-[60px] text-primary transition-colors',
          isSelected ? 'font-semibold' : 'font-medium'
        )}
      >
        {point.name}
      </span>
    </button>
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
      <div className="overflow-x-auto pb-1">
        <div className="relative flex items-start gap-10 min-w-full w-max">
          {/* Connecting line — sized with the row itself so it covers the full scrollable width */}
          <div className="absolute top-3 left-0 right-0 h-px bg-border" />

          {/* Timeline entries — eras and temporal points */}
          {entries.map((entry) => {
            if (entry.type === 'POINT') {
              const isSelected = ctx.eraDetailOpen && ctx.timelineDetailId === entry.id
              if (entry.importance === 'MAJOR') {
                return <MajorPointPin key={entry.id} point={entry} isSelected={isSelected} />
              }
              return <StandardPointPin key={entry.id} point={entry} isSelected={isSelected} />
            }

            const isActive = entry.id === ctx.selectedEra
            return <EraNode key={entry.id} era={entry} isActive={isActive} />
          })}
        </div>
      </div>
    </div>
  )
}
