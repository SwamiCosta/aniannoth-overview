import { useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Globe, User, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAppContext } from '@/context/AppContext'
import { useAllEntities } from '@/hooks/useEntities'
import { useEras } from '@/hooks/useEras'

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div
        className="bg-border rounded-lg w-full h-full flex items-center justify-center"
        aria-label="No images available"
      >
        <User size={32} className="text-muted" />
      </div>
    )
  }

  const hasManyImages = images.length > 1

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Main image */}
      <div className="relative rounded-lg overflow-hidden bg-border flex-1">
        <img
          src={images[activeIndex]}
          alt={`${name} — image ${activeIndex + 1} of ${images.length}`}
          className="w-full h-full object-cover"
        />
        {hasManyImages && (
          <>
            <button
              onClick={() => setActiveIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-surface text-muted hover:text-foreground rounded-full p-0.5 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setActiveIndex(i => (i + 1) % images.length)}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-surface text-muted hover:text-foreground rounded-full p-0.5 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip — only when there are multiple images */}
      {hasManyImages && (
        <div className="flex gap-1 overflow-x-auto">
          {images.map((src, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={[
                'shrink-0 w-8 h-8 rounded overflow-hidden border-2 transition-colors',
                index === activeIndex ? 'border-primary' : 'border-border',
              ].join(' ')}
              aria-label={`View image ${index + 1}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DetailPanel() {
  const ctx = useAppContext()
  const { data: entities } = useAllEntities()
  const { data: erasData } = useEras()

  // Priority 1: entity detail
  if (ctx.selectedEntityId !== null) {
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

        {/* Left column — image gallery */}
        <div className="w-32 flex-shrink-0">
          <ImageGallery images={entity.images} name={entity.name} />
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

  // Priority 2: era detail
  if (ctx.eraDetailOpen) {
    const era = erasData.find(e => e.id === ctx.selectedEra)

    if (!era) {
      return (
        <div className="border-t border-border bg-surface h-12 flex items-center justify-center">
          <span className="text-muted text-sm">Era not found</span>
        </div>
      )
    }

    const MapTypeIcon = era.mapType === 'navigable' ? Globe : MapPin

    return (
      <div className="border-t border-border bg-surface min-h-48 p-4 flex flex-col gap-2 relative">
        {/* Close button */}
        <button
          onClick={() => ctx.setEraDetailOpen(false)}
          className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors"
          aria-label="Close era detail panel"
        >
          <XCircle size={16} />
        </button>

        {/* Era name */}
        <h2 className="text-xl font-medium text-foreground pr-6">{era.name}</h2>

        {/* Period subtitle */}
        <p className="text-sm text-muted">{era.period}</p>

        {/* Map type badge */}
        <div className="flex items-center gap-1">
          <span className="bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <MapTypeIcon size={10} />
            {era.mapType}
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted leading-relaxed">{era.summary}</p>
      </div>
    )
  }

  // Priority 3: placeholder
  return (
    <div className="border-t border-border bg-surface h-12 flex items-center justify-center">
      <span className="text-muted text-sm">Select an entity to view details</span>
    </div>
  )
}
