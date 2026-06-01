import { useEras } from '@/hooks/useEras'
import { useAppContext } from '@/context/AppContext'
import { cn } from '@/lib/utils'

export default function TimelineBar() {
  const eras = [...useEras()].sort((a, b) => a.order - b.order)
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

        {/* Era nodes */}
        <div className="relative flex w-full justify-between">
          {eras.map((era) => {
            const isActive = era.id === ctx.selectedEra
            const isAbstract = era.mapType === 'abstract'

            return (
              <button
                key={era.id}
                onClick={() => ctx.setEra(era.id)}
                className="flex flex-col items-center gap-1.5 group focus:outline-none"
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
                      : 'border-border group-hover:border-primary-border bg-surface'
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
          })}
        </div>
      </div>
    </div>
  )
}
