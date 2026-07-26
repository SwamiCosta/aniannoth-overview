import { useEffect, useState } from 'react'
import { Lock, XCircle } from 'lucide-react'
import { fetchHiddenContentRiddle } from '@/api/hiddenContentApi'
import { InvalidHiddenContentPasswordError } from '@/api/hiddenContentApi'
import { useHiddenContentUnlock } from '@/context/HiddenContentUnlockContext'
import { useTranslation } from '@/hooks/useTranslation'
import { logger } from '@/lib/logger'

interface HiddenContentModalProps {
  entityType: string
  entityId: string
  onUnlocked: () => void
  onClose: () => void
}

export function HiddenContentModal({ entityType, entityId, onUnlocked, onClose }: HiddenContentModalProps) {
  const t = useTranslation()
  const { unlock } = useHiddenContentUnlock()
  const [riddleText, setRiddleText] = useState<string | null>(null)
  const [riddleError, setRiddleError] = useState(false)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [wrongPassword, setWrongPassword] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchHiddenContentRiddle(entityType, entityId)
      .then(text => { if (!cancelled) setRiddleText(text) })
      .catch(() => { if (!cancelled) setRiddleError(true) })
    return () => { cancelled = true }
  }, [entityType, entityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim() || submitting) return
    setSubmitting(true)
    setWrongPassword(false)
    try {
      await unlock(entityType, entityId, password)
      onUnlocked()
    } catch (error) {
      if (error instanceof InvalidHiddenContentPasswordError) {
        setWrongPassword(true)
      } else {
        logger.error('Unexpected error unlocking hidden content', error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-lg shadow-xl w-96 p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            <h2 className="text-sm font-medium text-foreground">{t('hidden_content_title')}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground transition-colors">
            <XCircle size={18} />
          </button>
        </div>

        {riddleError ? (
          <p className="text-sm text-muted">{t('hidden_content_load_error')}</p>
        ) : riddleText === null ? (
          <p className="text-sm text-muted">{t('hidden_content_submitting')}</p>
        ) : (
          <p className="text-sm text-foreground leading-relaxed mb-3 italic">{riddleText}</p>
        )}

        <form onSubmit={e => { void handleSubmit(e) }} className="flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('hidden_content_password_placeholder')}
            disabled={riddleText === null || riddleError}
            className="w-full text-sm px-2 py-1.5 rounded border border-border bg-background text-foreground disabled:opacity-50"
          />
          {wrongPassword && (
            <p className="text-xs text-red-600">{t('hidden_content_wrong_password')}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !password.trim() || riddleText === null || riddleError}
            className="w-full text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? t('hidden_content_submitting') : t('hidden_content_submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
