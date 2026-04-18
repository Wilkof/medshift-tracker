import { NavLink } from 'react-router-dom'
import { BarChart3, CalendarDays, ClipboardList, Home, User } from 'lucide-react'
import { clsx } from '../lib/utils'

const items = [
  { to: '/', icon: Home, label: 'Головна', end: true },
  { to: '/calendar', icon: CalendarDays, label: 'Календар' },
  { to: '/shifts', icon: ClipboardList, label: 'Зміни' },
  { to: '/analytics', icon: BarChart3, label: 'Статистика' },
  { to: '/profile', icon: User, label: 'Профіль' },
]

export function BottomNav() {
  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/80 safe-bottom"
      aria-label="Нижня навігація"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1 pt-1.5">
        {items.map(({ to, icon: Icon, label, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex h-full flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all active:scale-95',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={clsx(
                      'grid h-9 w-12 place-items-center rounded-xl transition-all',
                      isActive && 'bg-brand-500/10 dark:bg-brand-400/15',
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
