import { useMemo, useState } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'
import { useShifts } from '../hooks/useShifts'
import { useProfile } from '../hooks/useProfile'
import type { Shift } from '../lib/database.types'
import { formatDateUA, formatMoney, isoDate, monthNameUA, parseLocalDate, weekdayLongUA } from '../lib/utils'
import { ShiftForm } from '../components/ShiftForm'

function monthOptions(years = 2) {
  const now = new Date()
  const opts: Array<{ key: string; label: string; from: string; to: string }> = [
    { key: 'all', label: 'Усі', from: '', to: '' },
  ]
  for (let y = 0; y < years; y++) {
    for (let m = 11; m >= 0; m--) {
      const year = now.getFullYear() - y
      const from = new Date(year, m, 1)
      const to = new Date(year, m + 1, 0)
      opts.push({
        key: `${year}-${String(m + 1).padStart(2, '0')}`,
        label: `${monthNameUA(m)} ${year}`,
        from: isoDate(from),
        to: isoDate(to),
      })
    }
  }
  return opts
}

export function ShiftsPage() {
  const { profile } = useProfile()
  const months = useMemo(() => monthOptions(2), [])
  const currentKey = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [monthKey, setMonthKey] = useState<string>(currentKey)
  const [search, setSearch] = useState('')

  const opt = months.find((m) => m.key === monthKey) ?? months[0]
  const { shifts, upsert, remove } = useShifts({
    from: opt.from || undefined,
    to: opt.to || undefined,
    search: search.trim() || undefined,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Shift | null>(null)

  const totals = useMemo(() => {
    const worked = shifts.filter((s) => Number(s.hours) > 0)
    return {
      count: worked.length,
      hours: worked.reduce((a, s) => a + Number(s.hours), 0),
      wage: worked.reduce((a, s) => a + Number(s.wage), 0),
    }
  }, [shifts])

  const currency = profile?.currency ?? 'PLN'

  return (
    <div className="animate-fade-up space-y-4 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Зміни</h1>
        <button
          onClick={() => {
            setSelected(null)
            setFormOpen(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5" />
          Додати
        </button>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук: дата, день, нотатка…"
            className="input pl-9"
          />
        </div>
        <select
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          className="input max-w-[45%]"
          aria-label="Фільтр за місяцем"
        >
          {months.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Змін</div>
          <div className="text-lg font-bold">{totals.count}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Годин</div>
          <div className="text-lg font-bold">{totals.hours.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Заробіток</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatMoney(totals.wage, currency)}
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {shifts.map((s) => {
          const worked = Number(s.hours) > 0
          return (
            <li
              key={s.id}
              className="card flex items-center gap-3 !p-4 hover:shadow-[var(--shadow-soft)] active:scale-[0.995]"
              onClick={() => {
                setSelected(s)
                setFormOpen(true)
              }}
            >
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-center text-xs font-semibold ${
                  worked
                    ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase opacity-80">{s.weekday}</div>
                  <div className="text-base font-bold">{parseLocalDate(s.date).getDate()}</div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="truncate text-sm font-semibold">{formatDateUA(s.date)}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                    · {weekdayLongUA(s.date)}
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {s.start_time ?? '—'} – {s.end_time ?? '—'} · {Number(s.hours).toFixed(2)} год · {Number(s.rate)} {currency}/год
                </div>
                {s.notes && (
                  <div className="mt-0.5 truncate text-xs italic text-slate-400">{s.notes}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div
                  className={`text-sm font-bold ${
                    worked
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {formatMoney(Number(s.wage), currency)}
                </div>
                <Pencil className="h-4 w-4 text-slate-300" />
              </div>
            </li>
          )
        })}
        {shifts.length === 0 && (
          <li className="card py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Немає змін за обраний період.
          </li>
        )}
      </ul>

      <ShiftForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={selected}
        defaultRate={profile?.default_rate ?? 33}
        currency={currency}
        onSave={upsert}
        onDelete={selected ? remove : undefined}
      />
    </div>
  )
}
