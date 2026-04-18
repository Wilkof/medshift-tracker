import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useShifts } from '../hooks/useShifts'
import { useProfile } from '../hooks/useProfile'
import type { Shift } from '../lib/database.types'
import {
  formatMoney,
  isoDate,
  monthNameUA,
  parseLocalDate,
  UA_WEEKDAYS_SHORT,
  weekdayLongUA,
} from '../lib/utils'
import { ShiftForm } from '../components/ShiftForm'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function buildGrid(current: Date) {
  const first = startOfMonth(current)
  const last = endOfMonth(current)
  const grid: Date[] = []
  const startWeekday = (first.getDay() + 6) % 7
  for (let i = startWeekday; i > 0; i--) {
    grid.push(new Date(first.getFullYear(), first.getMonth(), 1 - i))
  }
  for (let d = 1; d <= last.getDate(); d++) {
    grid.push(new Date(first.getFullYear(), first.getMonth(), d))
  }
  while (grid.length % 7 !== 0) {
    const next = new Date(grid[grid.length - 1])
    next.setDate(next.getDate() + 1)
    grid.push(next)
  }
  while (grid.length < 42) {
    const next = new Date(grid[grid.length - 1])
    next.setDate(next.getDate() + 1)
    grid.push(next)
  }
  return grid
}

const WEEKDAY_MON_FIRST = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export function CalendarPage() {
  const { profile } = useProfile()
  const [current, setCurrent] = useState(() => new Date())
  const [selected, setSelected] = useState<Shift | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<Partial<Shift> | null>(null)

  const mStart = startOfMonth(current)
  const mEnd = endOfMonth(current)

  const { shifts, upsert, remove } = useShifts({
    from: isoDate(new Date(mStart.getFullYear(), mStart.getMonth(), -7)),
    to: isoDate(new Date(mEnd.getFullYear(), mEnd.getMonth() + 1, 7)),
  })

  const byDate = useMemo(() => {
    const map = new Map<string, Shift>()
    shifts.forEach((s) => map.set(s.date, s))
    return map
  }, [shifts])

  const grid = useMemo(() => buildGrid(current), [current])

  const totals = useMemo(() => {
    const inMonth = shifts.filter((s) => {
      const d = parseLocalDate(s.date)
      return d.getMonth() === current.getMonth() && d.getFullYear() === current.getFullYear()
    })
    const hours = inMonth.reduce((a, s) => a + Number(s.hours), 0)
    const wage = inMonth.reduce((a, s) => a + Number(s.wage), 0)
    const workedDays = inMonth.filter((s) => Number(s.hours) > 0).length
    return { hours, wage, workedDays }
  }, [shifts, current])

  const currency = profile?.currency ?? 'PLN'

  function onPickDay(d: Date) {
    const iso = isoDate(d)
    const existing = byDate.get(iso)
    setSelected(existing ?? null)
    setFormInitial(existing ?? { date: iso })
    setFormOpen(true)
  }

  return (
    <div className="animate-fade-up space-y-5 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Календар</h1>
      </header>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Попередній місяць"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-lg font-bold">
              {monthNameUA(current.getMonth())} {current.getFullYear()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {totals.workedDays} днів · {totals.hours.toFixed(1)} год · {formatMoney(totals.wage, currency)}
            </div>
          </div>
          <button
            onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Наступний місяць"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {WEEKDAY_MON_FIRST.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, idx) => {
            const iso = isoDate(d)
            const inMonth = d.getMonth() === current.getMonth()
            const today = iso === isoDate(new Date())
            const shift = byDate.get(iso)
            const worked = shift && Number(shift.hours) > 0
            const weekdayIdx = (d.getDay() + 6) % 7
            const isWeekend = weekdayIdx >= 5

            return (
              <button
                key={idx}
                onClick={() => onPickDay(d)}
                className={`relative aspect-square rounded-xl border text-xs transition-all active:scale-95 ${
                  inMonth
                    ? 'border-slate-200 dark:border-white/5'
                    : 'border-transparent text-slate-300 dark:text-slate-600'
                } ${
                  worked
                    ? 'bg-gradient-to-br from-brand-500/10 to-emerald-500/10 dark:from-brand-400/20 dark:to-emerald-400/15'
                    : isWeekend && inMonth
                      ? 'bg-slate-50/60 dark:bg-white/[0.02]'
                      : ''
                } ${today ? 'ring-2 ring-brand-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-950' : ''}`}
              >
                <div className="absolute inset-1 flex flex-col items-start justify-between">
                  <div className={`text-sm font-semibold ${today ? 'text-brand-600 dark:text-brand-300' : ''}`}>
                    {d.getDate()}
                  </div>
                  {worked && (
                    <div className="w-full text-left">
                      <div className="truncate text-[9px] font-semibold text-brand-700 dark:text-brand-300">
                        {Number(shift!.hours).toFixed(1)}г
                      </div>
                      <div className="truncate text-[9px] text-emerald-700 dark:text-emerald-300">
                        {Math.round(Number(shift!.wage))}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Легенда
        </h2>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-md bg-gradient-to-br from-brand-500/20 to-emerald-500/20" />
            Робочий день
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-md bg-slate-50 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/5" />
            Вихідний / без зміни
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-md ring-2 ring-brand-500" />
            Сьогодні
          </div>
        </div>
      </div>

      <ShiftForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={formInitial}
        defaultRate={profile?.default_rate ?? 33}
        currency={currency}
        onSave={upsert}
        onDelete={selected ? remove : undefined}
      />
      <span className="hidden">{UA_WEEKDAYS_SHORT.length ? weekdayLongUA(new Date()) : ''}</span>
    </div>
  )
}
