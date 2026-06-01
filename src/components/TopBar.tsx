import { NavLink } from 'react-router-dom'
import { Map } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Explore', path: '/explore' },
  { label: 'Characters', path: '/characters' },
  { label: 'Places', path: '/places' },
  { label: 'Items', path: '/items' },
  { label: 'Lore', path: '/lore' },
] as const

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 h-12 bg-surface border-b border-border flex items-center px-6 gap-8">
      {/* Logo */}
      <div className="flex items-center gap-2 text-foreground font-medium select-none">
        <Map size={18} className="text-primary" />
        <span className="font-bold text-sm tracking-wide">Atlas</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ label, path }) => (
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
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
