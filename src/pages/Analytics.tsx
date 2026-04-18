import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useShifts } from '../hooks/useShifts'
import { useProfile } from '../hooks/useProfile'
import { formatMoney, monthNameUA, parseLocalDate, UA_WEEKDAYS_SHORT } from '../lib/utils'

export function AnalyticsPage() {
  const { profile } = useProfile()
  const { shifts } = useShifts({})
  const currency = profile?.currency ?? 'PLN'

  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; key: string; hours: number; wage: number; count: number }>()
    shifts.forEach((s) => {
      const d = parseLocalDate(s.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${monthNameUA(d.getMonth()).slice(0, 3)} ${String(d.getFullYear()).slice(2)}`
      const current =
        map.get(key) ?? { month: label, key, hours: 0, wage: 0, count: 0 }
      current.hours += Number(s.hours)
      current.wage += Number(s.wage)
      if (Number(s.hours) > 0) current.count += 1
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
  }, [shifts])

  const byWeekday = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]
    const hours = [0, 0, 0, 0, 0, 0, 0]
    shifts.forEach((s) => {
      if (Number(s.hours) <= 0) return
      const idx = (parseLocalDate(s.date).getDay() + 6) % 7
      counts[idx] += 1
      hours[idx] += Number(s.hours)
    })
    const order = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
    return order.map((name, i) => ({ name, shifts: counts[i], hours: Number(hours[i].toFixed(1)) }))
  }, [shifts])

  const totals = useMemo(() => {
    const worked = shifts.filter((s) => Number(s.hours) > 0)
    return {
      shifts: worked.length,
      hours: worked.reduce((a, s) => a + Number(s.hours), 0),
      wage: worked.reduce((a, s) => a + Number(s.wage), 0),
      avgShift: worked.length ? worked.reduce((a, s) => a + Number(s.wage), 0) / worked.length : 0,
      avgHour: worked.reduce((a, s) => a + Number(s.hours), 0)
        ? worked.reduce((a, s) => a + Number(s.wage), 0) /
          worked.reduce((a, s) => a + Number(s.hours), 0)
        : 0,
    }
  }, [shifts])

  const tickStroke = 'currentColor'

  return (
    <div className="animate-fade-up space-y-5 pt-2 text-slate-600 dark:text-slate-300">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Статистика
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Аналіз годин, заробітку та навантаження
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="text-xs text-slate-500 dark:text-slate-400">Усього змін</div>
          <div className="text-2xl font-bold">{totals.shifts}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 dark:text-slate-400">Усього годин</div>
          <div className="text-2xl font-bold">{totals.hours.toFixed(0)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 dark:text-slate-400">Сер. / зміну</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatMoney(totals.avgShift, currency)}
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 dark:text-slate-400">Сер. / годину</div>
          <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
            {formatMoney(totals.avgHour, currency)}
          </div>
        </div>
      </div>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Заробіток по місяцях
        </h2>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={byMonth} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="month" tick={{ fill: tickStroke, fontSize: 11 }} stroke="currentColor" strokeOpacity={0.1} />
              <YAxis tick={{ fill: tickStroke, fontSize: 11 }} stroke="currentColor" strokeOpacity={0.1} />
              <Tooltip
                cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                formatter={(value) => formatMoney(Number(value), currency)}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)',
                }}
              />
              <Bar dataKey="wage" name="Заробіток" fill="var(--color-brand-500)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Години по місяцях
        </h2>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <LineChart data={byMonth} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="month" tick={{ fill: tickStroke, fontSize: 11 }} stroke="currentColor" strokeOpacity={0.1} />
              <YAxis tick={{ fill: tickStroke, fontSize: 11 }} stroke="currentColor" strokeOpacity={0.1} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="hours"
                name="Години"
                stroke="var(--color-brand-500)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Найзавантаженіші дні тижня
        </h2>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={byWeekday} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="name" tick={{ fill: tickStroke, fontSize: 11 }} stroke="currentColor" strokeOpacity={0.1} />
              <YAxis tick={{ fill: tickStroke, fontSize: 11 }} stroke="currentColor" strokeOpacity={0.1} />
              <Tooltip
                cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)',
                }}
              />
              <Legend />
              <Bar dataKey="shifts" name="Змін" fill="var(--color-brand-500)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="hours" name="Годин" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <span className="hidden">{UA_WEEKDAYS_SHORT[0]}</span>
    </div>
  )
}
