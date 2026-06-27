import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, User, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { useAppContext } from '@/context/AppContext'
import { useAllEntities } from '@/hooks/useEntities'
import { useEras } from '@/hooks/useEras'
import { categoryForType } from '@/lib/entityCategory'
import type { LinkedEntity } from '@/types/universe'

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="text-base font-medium text-foreground mt-3 mb-1">{children}</h2>
  ),
  p: ({ children }) => (
    <p className="text-sm text-muted leading-relaxed">{children}</p>
  ),
}

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

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
    <>
      <div className="flex flex-col gap-2 w-full h-full">
        {/* Main image */}
        <div className="relative rounded-lg overflow-hidden bg-border flex-1">
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="w-full h-full cursor-zoom-in"
            aria-label="Expand image"
          >
            <img
              src={images[activeIndex]}
              alt={`${name} — image ${activeIndex + 1} of ${images.length}`}
              className="w-full h-full object-cover"
            />
          </button>
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

      {isLightboxOpen && (
        <ImageLightbox
          images={images}
          name={name}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  )
}

function ImageLightbox({
  images,
  name,
  activeIndex,
  onIndexChange,
  onClose,
}: {
  images: string[]
  name: string
  activeIndex: number
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const hasManyImages = images.length > 1

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-surface hover:text-primary-border transition-colors"
        aria-label="Close image viewer"
      >
        <XCircle size={28} />
      </button>

      <img
        src={images[activeIndex]}
        alt={`${name} — image ${activeIndex + 1} of ${images.length}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      {hasManyImages && (
        <>
          <button
            onClick={() => onIndexChange((activeIndex - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-surface hover:text-primary-border transition-colors"
            aria-label="Previous image (fullscreen)"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={() => onIndexChange((activeIndex + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface hover:text-primary-border transition-colors"
            aria-label="Next image (fullscreen)"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}
    </div>
  )
}

function RelatedEntities({ links }: { links: LinkedEntity[] }) {
  const ctx = useAppContext()

  if (links.length === 0) return null

  function handleClick(link: LinkedEntity) {
    const category = categoryForType(link.type)
    if (category && category !== ctx.filters.category) {
      ctx.setFilter(category)
    }
    ctx.setSelectedEntity(link.id)
  }

  return (
    <div className="border-t border-border pt-2 mt-1">
      <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
        Related entities
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {links.map(link => {
          const isAvailable = link.status === 'canon'
          return isAvailable ? (
            <button
              key={link.id}
              onClick={() => handleClick(link)}
              className="bg-border hover:bg-primary-light text-foreground text-xs px-2 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
            >
              {link.name}
              <span className="text-[10px] text-muted uppercase">{link.type}</span>
            </button>
          ) : (
            <span
              key={link.id}
              title="Not available in the public atlas"
              aria-disabled="true"
              className="bg-border text-muted text-xs px-2 py-1 rounded-full opacity-50 cursor-not-allowed flex items-center gap-1"
            >
              {link.name}
              <span className="text-[10px] uppercase">{link.type}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function DetailPanel() {
  const ctx = useAppContext()
  const { data: entities } = useAllEntities()
  const { data: erasData } = useEras()
  const [isBodyExpanded, setIsBodyExpanded] = useState(false)

  // Closing the panel always returns to the collapsed reading view —
  // isBodyExpanded otherwise persists across entity switches so that
  // navigating via Related Entities keeps the reading view expanded.
  useEffect(() => {
    if (ctx.selectedEntityId === null) setIsBodyExpanded(false)
  }, [ctx.selectedEntityId])

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

    const eraName = entity.timeline.era || undefined

    const metadataParts = [entity.category, entity.location, eraName].filter(
      (part): part is string => Boolean(part)
    )

    return (
      <div className="border-t border-border bg-surface h-72 shrink-0 p-4 flex flex-row gap-4 relative">
        {/* Close button */}
        <button
          onClick={() => ctx.setSelectedEntity(null)}
          className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors"
          aria-label="Close detail panel"
        >
          <XCircle size={16} />
        </button>

        {/* Left column — image gallery */}
        {/* key resets activeIndex/lightbox state on entity switch — DetailPanel never unmounts between entities */}
        <div className="w-32 flex-shrink-0">
          <ImageGallery key={entity.id} images={entity.images} name={entity.name} />
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
            <div className="flex justify-end">
              <button
                onClick={() => setIsBodyExpanded(true)}
                className="text-muted hover:text-foreground transition-colors"
                aria-label="Expand reading view"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <ReactMarkdown components={markdownComponents}>
              {entity.body}
            </ReactMarkdown>
          </div>

          {/* Related entities */}
          <RelatedEntities links={entity.links} />
        </div>

        {isBodyExpanded && (
          <div className="fixed inset-0 z-[100] bg-surface flex flex-col p-8">
            <button
              onClick={() => setIsBodyExpanded(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
              aria-label="Collapse reading view"
            >
              <Minimize2 size={20} />
            </button>
            <div className="max-w-5xl mx-auto w-full shrink-0">
              <h2 className="text-2xl font-medium text-foreground mb-4 text-center">{entity.name}</h2>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="max-w-5xl mx-auto flex flex-row gap-8">
                <div className="flex-1 min-w-0">
                  <ReactMarkdown components={markdownComponents}>
                    {entity.body}
                  </ReactMarkdown>
                  <RelatedEntities links={entity.links} />
                </div>
                {/* Image column sits beside the text instead of above it — avoids
                    cropping a wide-short box would force on portrait artwork, and
                    sticky keeps it in view while the text column scrolls. */}
                {entity.images.length > 0 && (
                  <div className="w-72 h-80 shrink-0 sticky top-0 self-start">
                    <ImageGallery key={entity.id} images={entity.images} name={entity.name} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Priority 2: timeline entry detail (era or temporal point)
  if (ctx.eraDetailOpen) {
    const entry = erasData.find(e => e.id === ctx.timelineDetailId)

    if (!entry) {
      return (
        <div className="border-t border-border bg-surface h-12 flex items-center justify-center">
          <span className="text-muted text-sm">Entry not found</span>
        </div>
      )
    }

    return (
      <div className="border-t border-border bg-surface h-72 shrink-0 p-4 flex flex-col gap-2 relative overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => ctx.setEraDetailOpen(false)}
          className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors"
          aria-label="Close timeline detail panel"
        >
          <XCircle size={16} />
        </button>

        {/* Entry name */}
        <h2 className="text-xl font-medium text-foreground pr-6">{entry.name}</h2>

        {/* Description */}
        <p className="text-sm text-muted leading-relaxed">{entry.description}</p>
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
