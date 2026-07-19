import { useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, User } from 'lucide-react'
import { useAppContext } from '@/context/AppContext'
import { useAllEntities } from '@/hooks/useEntities'
import { useEras } from '@/hooks/useEras'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { imageAlignmentClass } from '@/lib/entityCategory'
import type { Entity } from '@/types/universe'
import type { TranslationKey } from '@/lib/translations'

const FILTER_CHIPS: { key: TranslationKey; value: string | null }[] = [
  { key: 'filter_all', value: null },
  { key: 'filter_characters', value: 'characters' },
  { key: 'filter_lore', value: 'lore' },
]

export default function Sidebar() {
  const ctx = useAppContext()
  const t = useTranslation()
  const { data: eras } = useEras()
  const { data: allEntities } = useAllEntities()
  const [isExpanded, setIsExpanded] = useState(false)

  const currentEra = eras.find(era => era.id === ctx.selectedEra)

  const visibleEntities = allEntities.filter(entity => {
    if (entity.timeline.era !== currentEra?.name) return false
    if (ctx.filters.category !== null && entity.category !== ctx.filters.category) return false
    return true
  })

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-surface',
        isExpanded ? 'absolute inset-y-0 right-0 left-0 z-30 shadow-2xl' : 'relative'
      )}
    >
      {/* Expand/collapse handle — straddles the left edge so it stays
          reachable and visible whether the panel is narrow or full-width */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        aria-label={t(isExpanded ? 'sidebar_collapse' : 'sidebar_expand')}
        title={t(isExpanded ? 'sidebar_collapse' : 'sidebar_expand')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-6 h-14 rounded-full bg-surface border border-border shadow-md flex items-center justify-center text-muted transition-all cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110"
      >
        {isExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0 flex items-center gap-2">
        <MapPin size={14} className="text-primary shrink-0" />
        <span className="font-semibold text-foreground text-sm leading-tight flex-1 min-w-0 truncate">
          {currentEra?.name ?? '—'}
        </span>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-3 flex gap-2 flex-wrap shrink-0 border-b border-border">
        {FILTER_CHIPS.map(chip => {
          const isActive = ctx.filters.category === chip.value
          return (
            <button
              key={chip.key}
              onClick={() => ctx.setFilter(chip.value)}
              className={[
                'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface border border-border text-muted hover:border-primary-border',
              ].join(' ')}
            >
              {t(chip.key)}
            </button>
          )
        })}
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto">
        {visibleEntities.length === 0 ? (
          <p className="text-muted text-sm text-center mt-8 px-4">{t('sidebar_no_entities')}</p>
        ) : isExpanded ? (
          <div className="flex flex-wrap gap-4 p-4">
            {visibleEntities.map(entity => {
              const isActive = ctx.selectedEntityId === entity.id
              return (
                <button
                  key={entity.id}
                  onClick={() => ctx.setSelectedEntity(entity.id)}
                  className={cn(
                    'w-48 text-left rounded-lg overflow-hidden border transition-colors cursor-pointer',
                    isActive
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-surface hover:border-primary-border'
                  )}
                >
                  <div className="w-full h-28 bg-border flex items-center justify-center overflow-hidden">
                    {entity.images[0] ? (
                      <img
                        src={entity.images[0]}
                        alt=""
                        className={cn('w-full h-full object-cover', imageAlignmentClass(entity.category))}
                      />
                    ) : (
                      <User size={20} className="text-muted" />
                    )}
                  </div>
                  <div className="p-3">
                    <EntityMeta entity={entity} />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          visibleEntities.map(entity => {
            const isActive = ctx.selectedEntityId === entity.id
            return (
              <button
                key={entity.id}
                onClick={() => ctx.setSelectedEntity(entity.id)}
                className={[
                  'w-full text-left px-4 py-3 transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary-light border-l-2 border-primary'
                    : 'bg-surface hover:bg-background border-b border-border',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="shrink-0 w-10 h-10 rounded overflow-hidden bg-border flex items-center justify-center mt-0.5">
                    {entity.images[0] ? (
                      <img
                        src={entity.images[0]}
                        alt=""
                        className={cn('w-full h-full object-cover', imageAlignmentClass(entity.category))}
                      />
                    ) : (
                      <User size={16} className="text-muted" />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <EntityMeta entity={entity} />
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function EntityMeta({ entity }: { entity: Entity }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-primary text-[10px] tracking-widest font-medium uppercase">
          {entity.category}
        </span>
        {entity.status !== 'canon' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-border text-muted shrink-0">
            {entity.status}
          </span>
        )}
      </div>
      <p className="font-medium text-foreground text-sm mt-0.5">{entity.name}</p>
      <p className="text-muted text-sm mt-0.5 line-clamp-2">{entity.summary}</p>
    </>
  )
}
