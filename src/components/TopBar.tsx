import { NavLink } from 'react-router-dom'
import { Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslation } from '@/hooks/useTranslation'

const NAV_LINKS = [
  { key: 'nav_explore', path: '/explore' },
  { key: 'nav_characters', path: '/characters' },
  { key: 'nav_places', path: '/places' },
  { key: 'nav_items', path: '/items' },
  { key: 'nav_lore', path: '/lore' },
] as const

export default function TopBar() {
  const t = useTranslation()
  const { language, setLanguage } = useLanguage()

  return (
    <header className="sticky top-0 z-50 h-12 bg-surface border-b border-border flex items-center px-6 gap-8">
      {/* Logo */}
      <div className="flex items-center gap-2 text-foreground font-medium select-none">
        <Map size={18} className="text-primary" />
        <span className="font-bold text-sm tracking-wide">Atlas</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ key, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'px-3 py-1.5 rounded text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted hover:text-foreground hover:bg-border'
              )
            }
          >
            {t(key)}
          </NavLink>
        ))}
      </nav>

      {/* Language switcher */}
      <div className="ml-auto flex items-center gap-1 bg-background rounded-full p-0.5 border border-border">
        {(['en', 'pt'] as const).map(lang => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            aria-pressed={language === lang}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium uppercase transition-colors cursor-pointer',
              language === lang
                ? 'bg-primary text-primary-foreground'
                : 'text-muted hover:text-foreground'
            )}
          >
            {lang}
          </button>
        ))}
      </div>
    </header>
  )
}
