import { MapPin, User } from 'lucide-react'
import { useAppContext } from '@/context/AppContext'
import { useAllEntities } from '@/hooks/useEntities'
import { useEras } from '@/hooks/useEras'
import { useTranslation } from '@/hooks/useTranslation'
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

  const currentEra = eras.find(era => era.id === ctx.selectedEra)

  const visibleEntities = allEntities.filter(entity => {
    if (entity.timeline.era !== currentEra?.name) return false
    if (ctx.filters.category !== null && entity.category !== ctx.filters.category) return false
    return true
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <MapPin size={14} className="text-primary shrink-0" />
          <span className="font-semibold text-foreground text-sm leading-tight">
            {currentEra?.name ?? '—'}
          </span>
        </div>
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
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-muted" />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
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
