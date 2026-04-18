import { useMemo, useState } from 'react'
import { CalendarClock, Coins, Clock, Plus, TrendingUp } from 'lucide-react'
import { useShifts } from '../hooks/useShifts'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'
import {
  formatDateUA,
  formatMoney,
  isoDate,
  monthNameUA,
  weekdayLongUA,
} from '../lib/utils'
import { StatCard } from '../components/StatCard'
import { ShiftForm } from '../components/ShiftForm'

export function DashboardPage() {
  const { user } = useAuth()
  const { profile } = useProfile()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { shifts, upsert } = useShifts({
    from: isoDate(monthStart),
    to: isoDate(monthEnd),
  })
  const { shifts: allUpcoming } = useShifts({
    from: isoDate(now),
  })

  const [formOpen, setFormOpen] = useState(false)

  const stats = useMemo(() => {
    const worked = shifts.filter((s) => s.hours > 0)
    const totalHours = worked.reduce((sum, s) => sum + Number(s.hours), 0)
    const totalWage = worked.reduce((sum, s) => sum + Number(s.wage), 0)
    const avgPerShift = worked.length ? totalWage / worked.length : 0
    return {
      shiftCount: worked.length,
      totalHours,
      totalWage,
      avgPerShift,
    }
  }, [shifts])

  const upcoming = useMemo(() => {
    const future = allUpcoming
      .filter((s) => s.hours > 0 || (s.start_time && s.end_time))
      .sort((a, b) => a.date.localeCompare(b.date))
    return future[0] ?? null
  }, [allUpcoming])

  const greeting = useMemo(() => {
    const h = now.getHours()
    if (h < 6) return 'Доброї ночі'
    if (h < 12) return 'Доброго ранку'
    if (h < 18) return 'Доброго дня'
    return 'Доброго вечора'
  }, [now])

  const currency = profile?.currency ?? 'PLN'

  return (
    <div className="animate-fade-up space-y-5 pt-2">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{greeting},</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile?.full_name || user?.email?.split('@')[0] || 'користувач'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {monthNameUA(now.getMonth())} {now.getFullYear()}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="btn btn-primary !px-4 !py-3"
          aria-label="Додати зміну"
        >
          <Plus className="h-5 w-5" />
          <span>Додати</span>
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatCard
          icon={CalendarClock}
          label="Змін цього місяця"
          value={String(stats.shiftCount)}
          tone="brand"
        />
        <StatCard
          icon={Clock}
          label="Годин цього місяця"
          value={`${stats.totalHours.toFixed(1)} год`}
          tone="violet"
        />
        <StatCard
          icon={Coins}
          label="Заробіток"
          value={formatMoney(stats.totalWage, currency)}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Середнє за зміну"
          value={formatMoney(stats.avgPerShift, currency)}
          tone="amber"
        />
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Наступна зміна
          </h2>
        </div>
        {upcoming ? (
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-soft)]">
              <div className="text-center leading-none">
                <div className="text-[10px] uppercase opacity-80">
                  {monthNameUA(new Date(upcoming.date).getMonth()).slice(0, 3)}
                </div>
                <div className="text-xl font-bold">{new Date(upcoming.date).getDate()}</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold">
                {weekdayLongUA(upcoming.date)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {upcoming.start_time ?? '—'} – {upcoming.end_time ?? '—'} · {Number(upcoming.hours).toFixed(1)} год
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-brand-600 dark:text-brand-400">
                {formatMoney(Number(upcoming.wage), currency)}
              </div>
              <div className="text-xs text-slate-400">{formatDateUA(upcoming.date, 'd MMM')}</div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Поки що немає запланованих змін.
            <br />
            <button
              onClick={() => setFormOpen(true)}
              className="mt-2 inline-flex items-center gap-1 text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
            >
              <Plus className="h-4 w-4" /> Додати зміну
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Останні зміни
        </h2>
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {shifts
            .filter((s) => s.hours > 0)
            .slice(0, 5)
            .map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                  {new Date(s.date).getDate()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {weekdayLongUA(s.date)}
                    <span className="ml-1 text-slate-400">
                      · {s.start_time ?? '—'}–{s.end_time ?? '—'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {Number(s.hours).toFixed(2)} год · {Number(s.rate)} {currency}/год
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(Number(s.wage), currency)}
                </div>
              </li>
            ))}
          {shifts.filter((s) => s.hours > 0).length === 0 && (
            <li className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Цього місяця ще немає робочих змін.
            </li>
          )}
        </ul>
      </section>

      <ShiftForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultRate={profile?.default_rate ?? 33}
        currency={currency}
        onSave={upsert}
      />
    </div>
  )
}
