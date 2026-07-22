import { useTranslation } from '@/hooks/useTranslation'

// Rendered only for the brief window while AuthContext exchanges the OAuth2
// authorization code for a token and navigates away — see AuthContext.tsx.
// Deliberately has no navigation logic of its own: an effect here (e.g. a
// <Navigate> element) would fire before AuthContext's own effect gets a
// chance to read window.location.pathname, since it sits deeper in the tree.
export default function AuthCallbackPage() {
  const t = useTranslation()
  return (
    <div className="flex-1 flex items-center justify-center text-muted text-sm">
      {t('auth_signing_in')}
    </div>
  )
}
