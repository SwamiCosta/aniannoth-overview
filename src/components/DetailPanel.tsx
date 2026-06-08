import { User, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAppContext } from '@/context/AppContext'
import { useAllEntities } from '@/hooks/useEntities'
import { useEras } from '@/hooks/useEras'

export default function DetailPanel() {
  const ctx = useAppContext()
  const { data: entities } = useAllEntities()
  const { data: erasData } = useEras()

  if (!ctx.selectedEntityId) {
    return (
      <div className="border-t border-border bg-surface h-12 flex items-center justify-center">
        <span className="text-muted text-sm">Select an entity to view details</span>
      </div>
    )
  }

  const entity = entities.find(e => e.id === ctx.selectedEntityId)

  if (!entity) {
    return (
      <div className="border-t border-border bg-surface h-12 flex items-center justify-center">
        <span className="text-muted text-sm">Entity not found</span>
      </div>
    )
  }

  const eraName = erasData.find(e => e.id === entity.timeline.era)?.name

  const metadataParts = [entity.category, entity.location, eraName].filter(
    (part): part is string => Boolean(part)
  )

  return (
    <div className="border-t border-border bg-surface min-h-48 p-4 flex flex-row gap-4 relative">
      {/* Close button */}
      <button
        onClick={() => ctx.setSelectedEntity(null)}
        className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors"
        aria-label="Close detail panel"
      >
        <XCircle size={16} />
      </button>

      {/* Left column — image */}
      <div className="w-32 flex-shrink-0">
        {entity.image ? (
          <img
            src={entity.image}
            alt={entity.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="bg-border rounded-lg w-full h-full flex items-center justify-center">
            <User size={32} className="text-muted" />
          </div>
        )}
      </div>

      {/* Right column — details */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {/* Title */}
        <h2 className="text-xl font-medium text-foreground">{entity.name}</h2>

        {/* Metadata row */}
        {metadataParts.length > 0 && (
          <p className="text-sm text-muted">{metadataParts.join(' · ')}</p>
        )}

        {/* Tag pills */}
        <div className="flex flex-wrap gap-1">
          <span className="bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">
            {entity.status}
          </span>
          {entity.tags.map(tag => (
            <span
              key={tag}
              className="bg-border text-muted text-[10px] px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Body — Markdown */}
        <div className="overflow-y-auto flex-1">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-base font-medium text-foreground mt-3 mb-1">{children}</h2>
              ),
              p: ({ children }) => (
                <p className="text-sm text-muted leading-relaxed">{children}</p>
              ),
            }}
          >
            {entity.body}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
