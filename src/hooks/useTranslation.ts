import { useLanguage } from '@/context/LanguageContext'
import { translate } from '@/lib/translations'
import type { TranslationKey } from '@/lib/translations'

export function useTranslation() {
  const { language } = useLanguage()
  return (key: TranslationKey) => translate(key, language)
}
